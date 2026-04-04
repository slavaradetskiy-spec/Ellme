import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const origin = url.origin

  if (!code) {
    return NextResponse.redirect(origin + '/?error=no_code')
  }

  const YANDEX_CLIENT_ID = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID
  const YANDEX_CLIENT_SECRET = process.env.YANDEX_CLIENT_SECRET
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!YANDEX_CLIENT_ID || !YANDEX_CLIENT_SECRET || !SERVICE_KEY) {
    return NextResponse.redirect(origin + '/?error=config_missing')
  }

  try {
    // 1. Обмениваем code на access_token Яндекса
    const tokenRes = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: YANDEX_CLIENT_ID,
        client_secret: YANDEX_CLIENT_SECRET,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      return NextResponse.redirect(origin + '/?error=yandex_token')
    }

    // 2. Получаем профиль из Яндекса
    const profileRes = await fetch('https://login.yandex.ru/info?format=json', {
      headers: { Authorization: 'OAuth ' + tokenData.access_token },
    })
    const profile = await profileRes.json()
    const yEmail = profile.default_email || (profile.emails && profile.emails[0]) || (profile.login + '@yandex.ru')
    const yName = profile.display_name || profile.real_name || profile.login || ''

    // 3. Supabase admin client
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 4. Создаём пользователя если не существует (ошибку дубликата игнорируем)
    await sb.auth.admin.createUser({
      email: yEmail,
      email_confirm: true,
      user_metadata: { name: yName, role: 'client', provider: 'yandex' },
    })

    // 5. Генерируем magic link
    const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({
      type: 'magiclink',
      email: yEmail,
    })

    if (linkErr || !linkData?.properties?.hashed_token) {
      return NextResponse.redirect(origin + '/?error=magic_link')
    }

    // 6. Верифицируем токен на сервере — получаем session
    const verifyRes = await fetch(SUPABASE_URL + '/auth/v1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({
        type: 'magiclink',
        token_hash: linkData.properties.hashed_token,
      }),
    })
    const session = await verifyRes.json()

    if (!session?.access_token || !session?.refresh_token) {
      return NextResponse.redirect(origin + '/?error=verify_failed')
    }

    // 7. Редиректим на клиент с токенами в hash — Supabase JS подхватит сессию
    const redirectUrl = origin + '/#access_token=' + session.access_token + '&refresh_token=' + session.refresh_token + '&token_type=bearer&type=magiclink'
    return NextResponse.redirect(redirectUrl)

  } catch (e) {
    console.error('Yandex auth error:', e)
    return NextResponse.redirect(origin + '/?error=yandex_error')
  }
}
