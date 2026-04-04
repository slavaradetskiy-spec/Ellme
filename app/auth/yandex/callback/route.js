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

    console.log('Yandex profile email:', yEmail, 'name:', yName)

    // 3. Supabase admin client
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 4. Временный пароль
    const tempPass = crypto.randomUUID()

    // 5. Пробуем создать пользователя
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email: yEmail,
      password: tempPass,
      email_confirm: true,
      user_metadata: { name: yName, role: 'client', provider: 'yandex' },
    })

    console.log('createUser result:', created?.user?.id || 'null', 'error:', createErr?.message || 'none')

    if (created?.user) {
      // Новый пользователь создан — логинимся
      console.log('New user created, signing in...')
    } else {
      // Пользователь существует — ищем и обновляем пароль
      // Пробуем несколько страниц
      let foundUser = null
      for (let page = 1; page <= 10 && !foundUser; page++) {
        const { data: pageData, error: listErr } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
        console.log('listUsers page', page, ':', pageData?.users?.length || 0, 'users, error:', listErr?.message || 'none')
        if (!pageData?.users?.length) break
        foundUser = pageData.users.find(u => u.email?.toLowerCase() === yEmail)
      }

      if (!foundUser) {
        console.error('User not found for email:', yEmail)
        return NextResponse.redirect(origin + '/?error=user_not_found&email=' + encodeURIComponent(yEmail))
      }

      console.log('Found user:', foundUser.id, 'updating password...')
      const { error: updateErr } = await sb.auth.admin.updateUser(foundUser.id, { password: tempPass })
      if (updateErr) {
        console.error('updateUser error:', updateErr.message)
        return NextResponse.redirect(origin + '/?error=update_user')
      }
    }

    // 6. Логинимся с временным паролем
    const signInRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({ email: yEmail, password: tempPass }),
    })
    const session = await signInRes.json()

    if (!session?.access_token || !session?.refresh_token) {
      console.error('signIn error:', JSON.stringify(session))
      return NextResponse.redirect(origin + '/?error=signin_failed')
    }

    console.log('Sign in success, redirecting...')

    // 7. Редиректим на клиент с токенами в hash
    const redirectUrl = origin + '/#access_token=' + session.access_token + '&refresh_token=' + session.refresh_token + '&token_type=bearer&type=magiclink'
    return NextResponse.redirect(redirectUrl)

  } catch (e) {
    console.error('Yandex auth error:', e)
    return NextResponse.redirect(origin + '/?error=yandex_error&detail=' + encodeURIComponent(e.message))
  }
}
