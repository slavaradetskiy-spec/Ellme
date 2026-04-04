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
    const yEmail = (profile.default_email || (profile.emails && profile.emails[0]) || (profile.login + '@yandex.ru')).toLowerCase()
    const yName = profile.display_name || profile.real_name || profile.login || ''

    // 3. Supabase admin client (service key обходит RLS)
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const tempPass = crypto.randomUUID()

    // 4. Пробуем создать пользователя
    const { data: created } = await sb.auth.admin.createUser({
      email: yEmail,
      password: tempPass,
      email_confirm: true,
      user_metadata: { name: yName, role: 'client', provider: 'yandex' },
    })

    if (!created?.user) {
      // Пользователь уже существует — ищем его ID и ставим пароль
      let userId = null

      // Способ 1: через profiles
      try {
        const { data: prof } = await sb.from('profiles').select('id').eq('email', yEmail).maybeSingle()
        if (prof?.id) userId = prof.id
      } catch (e) { /* игнорируем */ }

      // Способ 2: через admin listUsers по страницам
      if (!userId) {
        try {
          for (let page = 1; page <= 20 && !userId; page++) {
            const { data: pageData } = await sb.auth.admin.listUsers({ page, perPage: 500 })
            const users = pageData?.users || []
            if (users.length === 0) break
            const found = users.find(u => u.email?.toLowerCase() === yEmail)
            if (found) userId = found.id
          }
        } catch (e) { /* игнорируем */ }
      }

      if (!userId) {
        return NextResponse.redirect(origin + '/?error=user_not_found&email=' + encodeURIComponent(yEmail))
      }

      const { error: upErr } = await sb.auth.admin.updateUser(userId, { password: tempPass })
      if (upErr) {
        return NextResponse.redirect(origin + '/?error=update_failed&detail=' + encodeURIComponent(upErr.message))
      }
    }

    // 5. Логинимся с временным паролем
    const signInRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
      body: JSON.stringify({ email: yEmail, password: tempPass }),
    })
    const session = await signInRes.json()

    if (!session?.access_token || !session?.refresh_token) {
      return NextResponse.redirect(origin + '/?error=signin_failed&detail=' + encodeURIComponent(session?.error_description || session?.msg || 'unknown'))
    }

    // 6. Редиректим с токенами — Supabase JS подхватит сессию
    return NextResponse.redirect(origin + '/#access_token=' + session.access_token + '&refresh_token=' + session.refresh_token + '&token_type=bearer&type=magiclink')

  } catch (e) {
    console.error('Yandex auth error:', e)
    return NextResponse.redirect(origin + '/?error=yandex_error&detail=' + encodeURIComponent(e.message || 'unknown'))
  }
}
