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

  if (!YANDEX_CLIENT_ID || !YANDEX_CLIENT_SECRET || !SERVICE_KEY) {
    return NextResponse.redirect(origin + '/?error=config_missing')
  }

  try {
    // 1. Exchange code for token
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

    // 2. Get Yandex profile
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

    // 4. Find or create user
    const { data: users } = await sb.auth.admin.listUsers({ perPage: 1000 })
    const existing = users?.users?.find(u => u.email === yEmail)

    let userId
    if (existing) {
      userId = existing.id
    } else {
      const { data: newUser, error: err } = await sb.auth.admin.createUser({
        email: yEmail,
        email_confirm: true,
        user_metadata: { name: yName, role: 'client', provider: 'yandex' },
      })
      if (err || !newUser?.user) {
        return NextResponse.redirect(origin + '/?error=create_user')
      }
      userId = newUser.user.id
    }

    // 5. Generate magic link
    const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({
      type: 'magiclink',
      email: yEmail,
    })

    if (linkErr || !linkData?.properties?.hashed_token) {
      return NextResponse.redirect(origin + '/?error=magic_link')
    }

    // 6. Redirect through Supabase verify endpoint
    const verifyUrl = SUPABASE_URL + '/auth/v1/verify?token=' + linkData.properties.hashed_token + '&type=magiclink&redirect_to=' + encodeURIComponent(origin + '/')
    return NextResponse.redirect(verifyUrl)

  } catch (e) {
    console.error('Yandex auth error:', e)
    return NextResponse.redirect(origin + '/?error=yandex_error')
  }
}
