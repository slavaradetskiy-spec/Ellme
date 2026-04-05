import { NextResponse } from 'next/server'

// ═══ In-memory rate limiter (resets on redeploy — acceptable for this scale) ═══
const rateLimitMap = new Map()
function checkRateLimit(ip, maxPerHour = 5) {
  const now = Date.now()
  const entries = rateLimitMap.get(ip) || []
  const recent = entries.filter(t => now - t < 3600000)
  if (recent.length >= maxPerHour) return false
  recent.push(now)
  rateLimitMap.set(ip, recent)
  // Cleanup old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, val] of rateLimitMap) {
      if (val.every(t => now - t > 3600000)) rateLimitMap.delete(key)
    }
  }
  return true
}

// ═══ HTML escape to prevent XSS in email ═══
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ═══ URL validation ═══
function isValidUrl(str) {
  if (!str) return false
  try {
    const url = new URL(str)
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

export async function POST(request) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Слишком много запросов. Попробуйте через час.' }, { status: 429 })
    }

    const body = await request.json()
    const { email, text, fileUrl } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No message' }, { status: 400 })
    }

    // Input limits
    if (text.length > 5000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    const RESEND_KEY = process.env.RESEND_API_KEY
    const NOTIFY_EMAIL = process.env.SUPPORT_EMAIL || 'slavaradetskiy@gmail.com'

    if (!RESEND_KEY) {
      console.error('RESEND_API_KEY not set')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Sanitize all user input for HTML
    const safeText = esc(text)
    const safeEmail = esc(email || '')
    const safeFileUrl = fileUrl && isValidUrl(fileUrl) ? esc(fileUrl) : null

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ELLME Поддержка <support@ellme.ru>',
        to: [NOTIFY_EMAIL],
        reply_to: email ? email.trim() : undefined,
        subject: 'Обращение в поддержку — ' + (safeEmail || 'без email'),
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#2D5F3F;margin-bottom:4px">Новое обращение в поддержку</h2>
            <p style="color:#6B6B6B;font-size:14px;margin-bottom:20px">ELLME — дневник питания</p>
            <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin-bottom:16px">
              <p style="margin:0 0 8px;font-size:13px;color:#999">От:</p>
              <p style="margin:0;font-size:15px;font-weight:600">${safeEmail || 'Не указан'}</p>
            </div>
            <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin-bottom:16px">
              <p style="margin:0 0 8px;font-size:13px;color:#999">Сообщение:</p>
              <p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap">${safeText}</p>
            </div>
            ${safeFileUrl ? `
            <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin-bottom:16px">
              <p style="margin:0 0 8px;font-size:13px;color:#999">Скриншот:</p>
              <a href="${safeFileUrl}" style="color:#2D5F3F;font-size:14px">Открыть скриншот</a>
              <br/><img src="${safeFileUrl}" style="max-width:100%;border-radius:8px;margin-top:8px" alt="screenshot"/>
            </div>
            ` : ''}
            <p style="color:#ABABAB;font-size:12px;margin-top:24px">Отправлено из приложения ELLME</p>
            <p style="color:#CDCDCD;font-size:10px">IP: ${esc(ip)}</p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend error:', data)
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Support API error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
