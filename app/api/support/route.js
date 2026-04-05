import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email, text, fileUrl } = await request.json()
    
    if (!text) {
      return NextResponse.json({ error: 'No message' }, { status: 400 })
    }

    const RESEND_KEY = process.env.RESEND_API_KEY
    const NOTIFY_EMAIL = process.env.SUPPORT_EMAIL || 'slavaradetskiy@gmail.com'

    if (!RESEND_KEY) {
      console.error('RESEND_API_KEY not set')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

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
        subject: 'Обращение в поддержку — ' + (email || 'без email'),
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#2D5F3F;margin-bottom:4px">Новое обращение в поддержку</h2>
            <p style="color:#6B6B6B;font-size:14px;margin-bottom:20px">ELLME — дневник питания</p>
            <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin-bottom:16px">
              <p style="margin:0 0 8px;font-size:13px;color:#999">От:</p>
              <p style="margin:0;font-size:15px;font-weight:600">${email || 'Не указан'}</p>
            </div>
            <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin-bottom:16px">
              <p style="margin:0 0 8px;font-size:13px;color:#999">Сообщение:</p>
              <p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap">${text}</p>
            </div>
            ${fileUrl ? `
            <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin-bottom:16px">
              <p style="margin:0 0 8px;font-size:13px;color:#999">Скриншот:</p>
              <a href="${fileUrl}" style="color:#2D5F3F;font-size:14px">Открыть скриншот</a>
              <br/><img src="${fileUrl}" style="max-width:100%;border-radius:8px;margin-top:8px" alt="screenshot"/>
            </div>
            ` : ''}
            <p style="color:#ABABAB;font-size:12px;margin-top:24px">Отправлено из приложения ELLME</p>
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
