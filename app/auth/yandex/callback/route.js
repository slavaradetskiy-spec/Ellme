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

    // 3a. Check if profile already exists — preserve existing role
    let existingRole = null
    try {
      const { data: existingProf } = await sb.from('profiles').select('role').eq('email', yEmail).maybeSingle()
      if (existingProf?.role) existingRole = existingProf.role
    } catch (e) { /* ignore */ }
    const finalRole = existingRole || role

    // 4. Создаём пользователя если не существует (БЕЗ пароля — magic link не нуждается)
    // Если пользователь уже есть — createUser вернёт ошибку/null, ничего не обновляем
    const { data: created } = await sb.auth.admin.createUser({
      email: yEmail,
      email_confirm: true,
      user_metadata: { name: yName, email: yEmail, role: finalRole, provider: 'yandex' },
    })

    let userId = created?.user?.id || null

    if (!userId) {
      // Пользователь уже существует — находим его, но НЕ трогаем пароль
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
    }

    // 4b. Обновляем роль в profiles ТОЛЬКО если state='doc' и текущая роль — client
    if (role === 'doc' && userId) {
      await sb.from('profiles').update({ role: 'doc' }).eq('id', userId).eq('role', 'client')
    }

    // 5. Генерируем magic link для входа (не перезаписывает пароль!)
    const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({
      type: 'magiclink',
      email: yEmail,
    })

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error('generateLink error:', linkErr)
      return NextResponse.redirect(origin + '/?error=auth_failed')
    }

    // 6. Редиректим через Supabase verify endpoint, который создаст сессию
    // и вернёт пользователя на origin с токенами в хеше
    const verifyUrl = new URL(SUPABASE_URL + '/auth/v1/verify')
    verifyUrl.searchParams.set('token', linkData.properties.hashed_token)
    verifyUrl.searchParams.set('type', 'magiclink')
    verifyUrl.searchParams.set('redirect_to', origin + '/')

    return NextResponse.redirect(verifyUrl.toString())

  } catch (e) {
    console.error('Yandex auth error:', e)
    return NextResponse.redirect(origin + '/?error=auth_failed')
  }
}
