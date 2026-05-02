# MIGRATION: Vercel + Supabase → Timeweb Cloud (Россия)

> **Цель документа.** Передать любому следующему исполнителю (живому или
> Claude-сессии) полный контекст что за приложение, что переносим, куда,
> какие открытые решения и какие риски. Этот файл = промт для новой
> сессии: его одного достаточно чтобы человек/ИИ понял задачу и мог
> двигаться дальше без расспросов.

---

## 1. Что такое ELLME

**ELLME** (`ellme.ru`) — веб-приложение «Дневник питания + аналитика»,
PWA, доступное на iOS/Android через браузер и через «Добавить на главный
экран».

Две роли пользователей:

- **Клиент** ведёт дневник: приёмы пищи (фото + описание + голод/после),
  вода, добавки, сон (отбой/подъём/качество/заметка), движение,
  стресс + практики, стул, самочувствие (энергия/настроение/коммент),
  цель недели. На отдельном экране — аналитика по 9 метрикам с графиками
  и периодами 3д/5д/7д/1мес/Свой. Есть PDF-отчёт (профиль → дневник
  по дням → аналитика, см. HANDOFF.md).
- **Нутрициолог** видит список своих клиентов, их дневники в read-only
  режиме, может ставить лайки приёмам, вести чат (Telegram-style: пины,
  реакции, реплаи, форварды, голосовые), задавать клиенту цель недели и
  норму воды. Свой собственный дневник тоже ведёт.

Бизнес-модель — нутрициолог приглашает клиентов через invite-код;
тарификация и платежи на момент написания не реализованы.

## 2. Текущий стек (всё что нужно перенести)

| Компонент          | Текущий провайдер                | Куда уезжаем                       |
| ------------------ | -------------------------------- | ---------------------------------- |
| Хостинг фронта     | Vercel (Next.js 14, app router)  | Timeweb Cloud Apps или своя VDS    |
| База данных        | Supabase Postgres                | Timeweb Managed PostgreSQL         |
| Auth               | Supabase GoTrue                  | self-hosted GoTrue на Timeweb VDS  |
| Storage            | Supabase Storage                 | Timeweb S3 (или Yandex Object)     |
| Realtime           | Supabase Realtime (WAL → WS)     | self-hosted Supabase Realtime      |
| RLS-политики       | Postgres RLS (12 миграций)       | переезжают с pg_dump as-is         |
| Email (`/api/support`, password reset) | Resend         | smtp.yandex.ru / mail.ru SMTP      |
| OAuth Yandex       | свой callback `/auth/yandex/...` | без изменений (RU API)             |
| DNS                | у регистратора `ellme.ru`        | без изменений, меняем A-записи     |
| Прокси `api.ellme.ru` | (см. ветку `claude/supabase-nginx-proxy-Mqn7E`) | **снимается после переезда** |

Кодбейс — один большой `components/NutriTrack.jsx` (~6700 строк),
Supabase ref `lcyrguguhiutdvdkptbs`. Миграции 002-012 в `supabase/migrations/`.

## 3. Что **дополнительно** нужно завести (помимо самого хостинга)

Эти штуки сейчас «бесплатно» прилетают вместе с Supabase/Vercel —
после переезда придётся настроить руками:

1. **SMTP** для Auth (письма подтверждения, сброс пароля) и
   `/api/support` (форма обратной связи). Резон: рассылать письма с
   российских IP в Gmail/Outlook через сторонние сервисы (Resend,
   SendGrid, Mailgun) часто блокируется из-за IP-репутации.
   - Рекомендация: **smtp.yandex.ru** через Yandex Mail для бизнеса
     (домен `ellme.ru`), либо **mail.ru для бизнеса**. Оба — полноценные
     SPF/DKIM/DMARC, RU-IP, бесплатно до ~1000 писем/день.
2. **S3-совместимое хранилище** под фото/чат-вложения. Альтернативы:
   - **Timeweb S3** (≈₽0.6/ГБ месяц, есть public ACL и CORS)
   - **Yandex Object Storage** (≈₽1.4/ГБ месяц, проверенная репутация)
   - Selectel (если уже есть аккаунт)
3. **Бэкапы**:
   - Postgres: managed-сервис делает автоматические снепшоты, но
     дополнительно — `pg_dump` крон-таска раз в сутки в S3 с retention
     14 дней. Без этого — переезд → отказ managed → потеря данных.
   - Storage: S3 versioning + lifecycle rule (90 дней).
4. **Мониторинг**:
   - Uptime: **Uptime Kuma** на отдельной мини-VDS (₽150/мес, открытый код).
   - Ошибки фронта: **GlitchTip** или **Sentry self-hosted** (на Docker).
   - Логи: достаточно `journalctl` + `logrotate` на VDS, без ELK.
5. **TLS**: Let's Encrypt + certbot для всех поддоменов
   (`ellme.ru`, `api.ellme.ru`, `db.ellme.ru` или как назовём auth-сервер).
6. **DNS**: оставляем у текущего регистратора, но **переключаемся на
   Cloudflare** для оркестрации (бесплатно). Cloudflare блокируется
   ICANN-аккаунтами в РФ редко, но если страшно — переехать к Reg.ru.
7. **Push-уведомления** (если планируется): Web Push нативно через сам
   Next.js + service worker, но ключи VAPID нужно сгенерировать заранее.

## 4. План по этапам (~5–7 дней работы)

### Этап 0. Подготовка (0.5 дня)
- Регистрируем аккаунт Timeweb Cloud, привязываем платёжку.
- Заводим Yandex Mail для бизнеса на домене `ellme.ru`,
  настраиваем SPF/DKIM/DMARC.
- Создаём S3-bucket в Timeweb (public-read для папки `meals/`,
  privacy для `chat/`). Прописываем CORS для `https://ellme.ru`.

### Этап 1. Backend (2 дня)
- Поднимаем VDS на Timeweb (Ubuntu 22, 2vCPU/4GB достаточно для старта).
- Поднимаем Managed PostgreSQL (Timeweb или Yandex Cloud).
- Self-host Supabase через docker-compose (репозиторий
  `supabase/supabase`, `docker/docker-compose.yml`):
  - Studio, Kong (gateway), Auth (GoTrue), REST (PostgREST),
    Realtime, Storage API, ImgProxy, Edge Functions (если понадобятся).
  - **Подключаем к managed Postgres**, не используем встроенный.
  - SMTP в `.env` GoTrue: `smtp.yandex.ru:465`, наш аккаунт.
  - Storage backend: S3 (см. этап 0), не локальный диск.
- TLS: certbot для `auth.ellme.ru` (или как назовём API-домен).

### Этап 2. Миграция данных (0.5 дня)
- `pg_dump --schema-only` старого Supabase → ревью миграций.
- `pg_dump --data-only` старого → restore в новый. Если есть `auth.users`
  — миграция через GoTrue `/admin/users`-API (хеши паролей сохраняются,
  GoTrue использует bcrypt совместимо).
- Перенос Storage: `rclone` или `aws s3 sync` из supabase storage
  через REST в новый S3-bucket.
- Прописать в `profiles.photo_url` и `meals.photo_url` новые URL
  (regex-replace в SQL по старому Supabase-домену).

### Этап 3. Frontend (1 день)
- В Next.js поменять `NEXT_PUBLIC_SUPABASE_URL` на новый
  (`https://api.ellme.ru` после прокси-переезда или сразу
  `https://auth.ellme.ru`).
- `next.config.js` `images.remotePatterns` — добавить новый S3-домен.
- Переменные Vercel дублируем в Timeweb Cloud Apps:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
    `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_YANDEX_CLIENT_ID`,
    `YANDEX_CLIENT_SECRET`, `RESEND_API_KEY` (заменить на SMTP-creds),
    `SUPPORT_EMAIL`.
- Деплой Next.js на Timeweb Cloud Apps (PaaS-режим — он сам собирает
  через `next build` и хостит). Если PaaS не дружит — fallback: Docker
  + `next start` на той же VDS.

### Этап 4. Cutover (0.5 дня)
- Включаем maintenance-режим на ellme.ru (Vercel rewrite на статическую
  страницу «обновляем сервис»).
- Финальный pg_dump → restore (delta).
- Финальный rclone Storage delta.
- Меняем DNS A-запись `ellme.ru` на Timeweb-инстанс. TTL=300 заранее.
- Отключаем maintenance, делаем дымовой тест: регистрация, логин,
  загрузка фото, чат, аналитика, PDF-экспорт.

### Этап 5. Hardening (1 день)
- Мониторинг (Uptime Kuma + GlitchTip).
- Бэкап-крон в S3.
- Гасим Vercel-проект (но не удаляем 30 дней — на случай отката).
- Гасим Supabase-проект (но не удаляем 30 дней — то же).

## 5. Риски и митигация

| Риск                                    | Митигация                                           |
| --------------------------------------- | --------------------------------------------------- |
| Письма от Yandex SMTP падают в спам Gmail | DKIM + DMARC обязательно, прогрев домена 1-2 недели до миграции. Подождать с продакшеном. |
| Realtime WS медленнее чем у Supabase    | На Timeweb VDS низкий пинг для РФ, должно быть лучше. Тест на 100+ конкуррентных WS до cutover. |
| OAuth Yandex callback ломается из-за смены `redirect_uri` | До cutover в Yandex OAuth-консоли добавить НОВЫЙ redirect, оставив старый. |
| Хеши паролей не переносятся             | GoTrue использует bcrypt — совместимо. Если нет — `/admin/generate-link?type=recovery` для всех юзеров и форс-сброс. |
| Managed Postgres подвисает на крупный pg_restore | Делаем pg_restore в off-peak, ставим `--jobs=4`, разбиваем на схемы. |
| Прокся `api.ellme.ru` (текущая) станет лишней | Снять Nginx-конфиг и DNS после успешного cutover. Или оставить как «классический» api-роутер для будущего. |

## 6. Открытые решения (нужно слово от владельца)

- [ ] **Хостинг Next.js**: Timeweb Cloud Apps (PaaS) или Docker на VDS?
  PaaS быстрее, но менее гибкий с middleware и cron.
- [ ] **Postgres**: Timeweb Managed или Yandex Cloud Managed?
  Yandex дороже, но надёжнее (репликация, восстановление).
- [ ] **S3**: Timeweb S3 или Yandex Object Storage? Если Postgres у
  Yandex — логично и S3 там, для меньшей сетевой латентности.
- [ ] **Email**: Yandex Mail для бизнеса или Mail.ru? Yandex привычнее
  для разработки, Mail.ru исторически выше дофигачит дофинеабельность RU.
- [ ] **Цель миграции**: только обход блокировок Tele2 или ещё и
  152-ФЗ (хранение ПДн в РФ)? Если 152-ФЗ — нужен договор с
  оператором ПДн (Yandex Cloud имеет нужный сертификат, Timeweb тоже).
- [ ] **Окно cutover**: предупреждать клиентов за неделю или сделать
  ночью без анонса? Сейчас юзеров мало, ночь без шума ок.

## 7. Что НЕ переносить (можно удалить после cutover)

- `nginx/api.ellme.ru.conf` — прокся не нужна, если auth/storage уехали в РФ.
- Supabase project `lcyrguguhiutdvdkptbs` — гасим через 30 дней
  после успешного переезда.
- Vercel проект `ellme` — гасим через 30 дней.
- Resend API key — заменить на пусто после переключения на SMTP.

## 8. Промт для следующей сессии Claude

> **Контекст**: переезжаем ELLME с Vercel + Supabase на Timeweb Cloud
> (Россия). Прочитай `MIGRATION.md` и `HANDOFF.md`. Ветка для миграции —
> `claude/migration-timeweb-XXXX` (создать, если нет). Не пушить в main
> без явного «давай в прод».
>
> **Сейчас на каком этапе** (актуализировать перед коммитом):
> - [ ] этап 0: подготовка
> - [ ] этап 1: backend self-hosted Supabase на Timeweb
> - [ ] этап 2: миграция данных
> - [ ] этап 3: frontend cut
> - [ ] этап 4: cutover
> - [ ] этап 5: hardening
>
> **Что нужно от пользователя перед стартом**: ответы на «Открытые
> решения» из секции 6, доступы (Timeweb API token, SSH ключ к VDS,
> SMTP-реквизиты, S3-ключи, OAuth client secret для нового redirect_uri).
>
> **Стратегия**: не ломать прод. Поднять параллельный стек на
> `staging.ellme.ru`, прогнать дымовые тесты, потом cutover. Откат =
> переключить DNS обратно за 5 минут.
