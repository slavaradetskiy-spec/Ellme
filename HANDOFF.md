# HANDOFF: ELLME проект

Временный файл для передачи контекста между сессиями Claude Code.

## Текущая ветка и статус
- Ветки: **staging** (dev) и **main** (prod)
- **ПРАВИЛО: ВСЕГДА сначала пуш на staging, НЕ мержить в main без одобрения пользователя!**
- Staging: https://ellme-git-staging-slavaradetskiy-specs-projects.vercel.app
- Prod: https://ellme.ru

## Стек
- Next.js 14 (app router) + React, Supabase, Chart.js, Vercel
- Основной файл: `components/NutriTrack.jsx` (~4500 строк)
- Supabase ref: `lcyrguguhiutdvdkptbs`

## Последний merge в прод (d966ce7, 14 апр)
Три вещи, пользователь протестил и подтвердил:

1. **`59543c9` — Уведомления: свои сообщения скрыты.**
   NotificationsPanel (NutriTrack.jsx:1412) теперь фильтрует `.neq('sender_id', userId)` при загрузке + гард `if (payload.new?.sender_id === userId) return;` в realtime INSERT. Свои лайки/комменты не попадают в ленту колокольчика. Бейдж-счётчик в шапке уже использовал тот же фильтр — теперь совпадает со списком.

2. **`28da85a` + `7f94c9d` — PWA-иконки + favicon.**
   Мастер-логотип пользователя: `public/logo-source.png` (1024×1024). Из него сгенерены: icon-512, icon-192, apple-touch-icon 180, favicon-16, favicon-32, favicon.ico (bundle 16/32/48). `app/layout.js` — прописаны все link-теги (favicon.ico + PNG 16/32 + apple-touch 180). Пересобрать можно одной командой Python:
   ```python
   from PIL import Image
   src = Image.open('public/logo-source.png').convert('RGBA')
   for sz,nm in [(512,'icon-512.png'),(192,'icon-192.png'),(180,'apple-touch-icon.png'),(32,'favicon-32.png'),(16,'favicon-16.png')]:
       src.resize((sz,sz), Image.LANCZOS).save('public/'+nm, optimize=True)
   src.resize((48,48), Image.LANCZOS).save('public/favicon.ico', sizes=[(16,16),(32,32),(48,48)])
   ```

3. **`cc80417` — MealDetail: сброс времени + плитка не залипает.**
   - `TimePick` (NutriTrack.jsx:356): справа от `мм` добавлена круглая кнопка × — видна только когда value непустое, по клику `onChange('')` (в БД пишется `NULL`).
   - `getVisibleMeals` (NutriTrack.jsx:51): из `isFilled` убрал `|| d.time`. Теперь снэк появляется на главной только при наличии `text` или `photo`. Случайный тап по времени больше не прилепляет «Перекус N» к дневнику.

## ⚠️ Открытые баги — жду инпут от пользователя

### 1. Вода прилипает ко всем дням недели (НЕ ВОСПРОИЗВЁЛ)
Пользователь: «добавила воду сегодня — во все дни недели добавилась». По коду баг не находится:
- localStorage key per-day: `wl_YYYY-MM-DD` (NutriTrack.jsx:706)
- `diaries[pid][dk(date)]` — по ключу даты (NutriTrack.jsx:3852-3870)
- Supabase upsert — `onConflict: 'user_id,date'`, одна строка (NutriTrack.jsx:3720-3734)

**Спросить перед фиксом:**
- Где именно 660 видно на других днях — дневник или аналитика?
- Сохраняется ли после F5 / релогина? Если да — баг в БД. Если нет — race/state на клиенте.
- Дай user_id или email — могу глянуть `diary_days` через Supabase.

### 2. «Сбросил время — цвет не поменялся» (НУЖЕН СКРИН)
Цвет `MealTile` (NutriTrack.jsx:527) зависит только от `has = d.text || firstPhoto`, время не участвует. Варианты:
- В приёме лежит текст/фото, плитка остаётся зелёной — это by design.
- Vercel ещё не пересобрал prod → хардрелоад.

Нужен скрин главной + детали приёма после сброса времени, тогда видно источник.

## Аналитика v3 — ГОТОВА и на проде
9 метрик (energy, mood, movement, water, stress, stool, sleepDuration, bedtime, sleepQuality),
периоды 3д/5д/7д/1мес/Свой с модалкой-календарём, фуллскрин-модалки по тапу на тайл
с линейными графиками (`DetailLineChart`, `Sparkline`), health score (bedtime исключён),
инсайты. Точка входа: функция `AnalyticsScreen` (NutriTrack.jsx:2688).

## Известные баги (досье)
- iOS: экран обрезается после закрытия клавиатуры в дневнике
- Safari убивает вкладку после простоя → перезагрузка
- TDZ: при добавлении useEffect ВСЕГДА проверять что deps объявлены ВЫШЕ
- **Фото в приёмах пищи:** крестик удаляет фото без confirm — нужен `window.confirm('Удалить фото?')`. *(Уже есть в коде NutriTrack.jsx:580, проверить что работает на iOS.)*
- **Галерея фото:** если несколько фото в приёме — нужен свайп между ними без закрытия модалки.

## Миграции (применены)
- 005 chat_system, 006 chat_tags_reactions, 007 profiles_chat_partner_read

## Полезно знать про код
- `ChartCanvas` (NutriTrack.jsx:2445) использует `JSON.parse(JSON.stringify(config))` для клона — это СРЕЗАЕТ функции (плагины, tooltip callbacks, tick callbacks). Пока всё работает из-за специфики текущих конфигов, но если понадобится `afterDatasetsDraw` или кастомный formatter — нужно вернуть `cloneConfig()` (рекурсивный клон, сохраняющий function references). См. историю `59775ab`, `9378ad5` — фикс был, но откатился при мерджах.
- `saveDayToDb` (NutriTrack.jsx:3720) — upsert с `onConflict: 'user_id,date'`. Обновляет одну строку по паре (user_id, date).
- `setDay` (NutriTrack.jsx:3854) — дебаунс 1.5 с на автосохранение. `key = dk(date)` захватывается через closure — безопасно при смене даты до срабатывания.
