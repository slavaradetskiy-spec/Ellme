import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') || 'client' // 'doc' or 'client'
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

  // Validate role
  const role = state === 'doc' ? 'doc' : 'client'

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

    // 3. Supabase admin client
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 3a. Check if profile already exists — preserve existing role to avoid accidental downgrade
    // (e.g. existing doc clicking Yandex without state=doc would lose their role)
    let existingRole = null
    try {
      const { data: existingProf } = await sb.from('profiles').select('role').eq('email', yEmail).maybeSingle()
      if (existingProf?.role) existingRole = existingProf.role
    } catch (e) { /* ignore */ }
    const finalRole = existingRole || role

    const tempPass = crypto.randomUUID()

    // 4. Создаём пользователя (или находим существующего и обновляем пароль)
    const { data: created } = await sb.auth.admin.createUser({
      email: yEmail,
      password: tempPass,
      email_confirm: true,
      user_metadata: { name: yName, email: yEmail, role: finalRole, provider: 'yandex' },
    })

    let userId = created?.user?.id || null

    if (!userId) {
      // Пользователь уже существует — находим его
      try {
        const { data: prof } = await sb.from('profiles').select('id').eq('email', yEmail).maybeSingle()
        if (prof?.id) userId = prof.id
      } catch (e) { /* игнорируем */ }

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
        return NextResponse.redirect(origin + '/?error=auth_failed')
      }

      const { error: upErr } = await sb.auth.admin.updateUserById(userId, { password: tempPass })
      if (upErr) {
        return NextResponse.redirect(origin + '/?error=auth_failed')
      }
    }

    // 4b. Обновляем роль в profiles ТОЛЬКО если state='doc' (явная регистрация как нутрициолог)
    // и текущая роль — client. НИКОГДА не понижаем doc до client.
    if (role === 'doc' && userId) {
      await sb.from('profiles').update({ role: 'doc' }).eq('id', userId).eq('role', 'client')
    }
    // Если профиль уже doc — не трогаем (существующий doc сохранит свою роль)

    // 5. Логинимся с временным паролем
    const signInRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
      body: JSON.stringify({ email: yEmail, password: tempPass }),
    })
    const session = await signInRes.json()

    if (!session?.access_token || !session?.refresh_token) {
      return NextResponse.redirect(origin + '/?error=auth_failed')
    }

    // 6. Редиректим с токенами — Supabase JS подхватит сессию
    return NextResponse.redirect(origin + '/#access_token=' + session.access_token + '&refresh_token=' + session.refresh_token + '&token_type=bearer&type=magiclink')

  } catch (e) {
    console.error('Yandex auth error:', e)
    return NextResponse.redirect(origin + '/?error=auth_failed')
  }
}
