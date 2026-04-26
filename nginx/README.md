# Supabase reverse proxy — `api.ellme.ru`

`supabase.co` is intermittently blocked from Russian ISPs, so we run an Nginx
reverse proxy on a Russian VDS that fronts our Supabase project at
`lcyrguguhiutdvdkptbs.supabase.co`. Clients reach Supabase via
`https://api.ellme.ru` and don't need a VPN.

## Files
- `api.ellme.ru.conf` — Nginx server block (HTTP → HTTPS redirect + TLS
  reverse proxy with WebSocket support for Realtime).

## One-time VDS setup (Ubuntu 22.04 / Debian 12)

```bash
# 1. Install nginx + certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Drop in the config
sudo cp api.ellme.ru.conf /etc/nginx/sites-available/api.ellme.ru
sudo ln -s /etc/nginx/sites-available/api.ellme.ru /etc/nginx/sites-enabled/
sudo mkdir -p /var/www/certbot

# 3. Point api.ellme.ru A/AAAA records at this VDS, wait for DNS to settle.

# 4. Issue the certificate (the conf already references the certbot paths)
sudo certbot --nginx -d api.ellme.ru --redirect --agree-tos -m admin@ellme.ru

# 5. Verify and reload
sudo nginx -t && sudo systemctl reload nginx
```

Certbot installs a systemd timer that auto-renews the cert.

## Switching the app to the proxy

After the proxy is live and `curl https://api.ellme.ru/auth/v1/health` returns
the same payload as `https://lcyrguguhiutdvdkptbs.supabase.co/auth/v1/health`,
update the Vercel env var on **both** `production` and `preview`:

```
NEXT_PUBLIC_SUPABASE_URL = https://api.ellme.ru
```

The anon key is unchanged. Re-deploy. The next.config.js `images.remotePatterns`
already whitelists `api.ellme.ru` so meal photos render via `next/image`.

> **Important**: also add `https://api.ellme.ru` to Supabase Dashboard →
> Authentication → URL Configuration → Site URL / Additional Redirect URLs
> so the Auth flow accepts redirects through the proxy. Add it to the CORS
> allow list as well (Project Settings → API → CORS) if requests originate
> from `api.ellme.ru`. Browser requests will still come from `ellme.ru`, so
> CORS is unaffected — but server-side calls (Yandex OAuth callback) hit
> Supabase directly with the original URL.

## Smoke tests after deploy

```bash
# Auth health
curl -sS https://api.ellme.ru/auth/v1/health

# REST root (should return 401 without apikey, which proves routing works)
curl -sS -o /dev/null -w '%{http_code}\n' https://api.ellme.ru/rest/v1/

# Storage public asset (replace with a real public photo path)
curl -sSI https://api.ellme.ru/storage/v1/object/public/photos/<some-path>.jpg

# Realtime websocket (needs websocat: `cargo install websocat`)
websocat -v "wss://api.ellme.ru/realtime/v1/websocket?apikey=<anon>&vsn=1.0.0"
```

## Rollback
Set `NEXT_PUBLIC_SUPABASE_URL` back to
`https://lcyrguguhiutdvdkptbs.supabase.co` in Vercel and redeploy. No
client-side code changes required.
