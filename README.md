# NutriTrack — Руководство по запуску

## Что внутри

```
nutritrack/
├── app/                    # Next.js страницы
│   ├── layout.js           # HTML-обёртка, шрифты, мета
│   ├── page.js             # Главная страница
│   └── globals.css         # Стили + анимации
├── components/
│   └── NutriTrack.jsx      # Всё приложение (UI)
├── lib/
│   └── supabase.js         # Клиент Supabase
├── public/
│   └── manifest.json       # PWA-манифест
├── supabase/
│   └── schema.sql          # Схема базы данных
├── .env.local.example      # Шаблон переменных
├── next.config.js          # Настройки Next.js
├── package.json            # Зависимости
└── README.md               # Вы здесь
```

---

## Шаг 1. Supabase (база данных + авторизация)

1. Откройте https://supabase.com → "Start your project"
2. Войдите через GitHub
3. Нажмите "New Project", выберите регион (eu-central-1 для Европы)
4. Придумайте пароль к базе данных (сохраните его)
5. Подождите ~2 мин пока проект создастся

### Настройка базы данных:
6. Перейдите в **SQL Editor** (иконка в левом меню)
7. Нажмите **New Query**
8. Скопируйте содержимое файла `supabase/schema.sql` → вставьте → **Run**
9. Должно показать "Success. No rows returned" — это нормально

### Получение ключей:
10. Перейдите в **Settings → API**
11. Скопируйте:
    - Project URL (например `https://abc123.supabase.co`)
    - anon/public key (длинная строка, начинается с `eyJ...`)

### Настройка авторизации:
12. Перейдите в **Authentication → Providers**
13. Email уже включён по умолчанию
14. Для SMS (опционально): **Authentication → Providers → Phone** → включите → подключите Twilio

---

## Шаг 2. Развёртывание (Vercel)

### Первый раз:

1. Залейте проект на GitHub:
   ```bash
   cd nutritrack
   git init
   git add .
   git commit -m "Initial commit"
   # Создайте репозиторий на github.com, затем:
   git remote add origin https://github.com/ВАШ_ЛОГИН/nutritrack.git
   git push -u origin main
   ```

2. Откройте https://vercel.com → войдите через GitHub
3. Нажмите "Import Project" → выберите репозиторий `nutritrack`
4. В разделе **Environment Variables** добавьте:
   - `NEXT_PUBLIC_SUPABASE_URL` = ваш URL из шага 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ваш ключ из шага 1
5. Нажмите **Deploy**
6. Через ~1-2 мин сайт будет доступен по адресу `nutritrack-xxx.vercel.app`

### Свой домен (опционально):
- В Vercel → Settings → Domains → добавьте свой домен
- Укажите DNS-записи у регистратора домена

---

## Шаг 3. Локальная разработка

```bash
# Установите зависимости
npm install

# Создайте файл .env.local
cp .env.local.example .env.local
# Отредактируйте .env.local — вставьте свои ключи Supabase

# Запустите
npm run dev

# Откройте http://localhost:3000
```

---

## Как делать обновления безопасно

### Правило #1: Никогда не редактируйте напрямую в main

```bash
# 1. Создайте ветку для изменений
git checkout -b feature/новая-фича

# 2. Внесите изменения в коде

# 3. Проверьте локально
npm run dev
# Потестируйте в браузере

# 4. Сохраните изменения
git add .
git commit -m "Добавил новую фичу"

# 5. Отправьте ветку
git push origin feature/новая-фича

# 6. На GitHub → создайте Pull Request → проверьте превью
# Vercel автоматически создаст Preview Deployment для PR

# 7. Если всё работает — Merge в main
# Vercel автоматически обновит production
```

### Правило #2: Vercel Preview Deployments

Каждый Pull Request на GitHub автоматически создаёт
отдельный URL для тестирования (например `nutritrack-git-feature-xxx.vercel.app`).
Вы можете проверить все изменения ДО того как они попадут в production.

### Правило #3: Откат при проблемах

```bash
# Если что-то сломалось — откатите на предыдущий коммит:
git revert HEAD
git push origin main
# Vercel автоматически задеплоит откат

# Или в Vercel Dashboard → Deployments → найдите рабочий → "Redeploy"
```

### Правило #4: База данных

Изменения в базе (новые таблицы/колонки) делайте через Supabase SQL Editor.
Сохраняйте каждый SQL-запрос в папке `supabase/migrations/`.
Пример:

```
supabase/migrations/
  001_initial.sql       (текущий schema.sql)
  002_add_allergies.sql  (новая колонка)
  003_add_goals.sql      (таблица целей)
```

---

## Перенос в App Store (iOS) и Google Play

### Вариант A: PWA (самый быстрый, без модерации)

Ваше приложение уже PWA (Progressive Web App).
Пользователи iPhone могут:
1. Открыть сайт в Safari
2. Нажать "Поделиться" → "На экран «Домой»"
3. Приложение появится как иконка, откроется без браузерной рамки

Это работает прямо сейчас, без App Store.

### Вариант B: Capacitor (нативная обёртка → App Store)

```bash
# 1. Установите Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init NutriTrack com.nutritrack.app

# 2. Добавьте iOS платформу
npm install @capacitor/ios
npx cap add ios

# 3. Соберите Next.js
npm run build
npx next export  # создаст папку out/

# 4. Скопируйте в Capacitor
npx cap copy ios

# 5. Откройте в Xcode
npx cap open ios

# 6. В Xcode → Product → Archive → Distribute
```

Для App Store потребуется:
- Apple Developer Account (99$/год)
- Mac с Xcode
- Иконки приложения (1024x1024)
- Скриншоты для App Store
- Описание на русском/английском
- Модерация ~1-3 дня

### Вариант C: Expo/React Native (полная переделка)

Если в будущем понадобятся push-уведомления, камера с нативным доступом,
офлайн-режим — имеет смысл переписать на React Native.
Но текущий код (React) переносится на ~70%, основная логика та же.

---

## Как работает авторизация

### Email-вход:
1. Пользователь вводит email + пароль
2. Supabase проверяет пароль
3. При первой регистрации — отправляет ссылку подтверждения на email
4. После подтверждения — аккаунт активен
5. При каждом входе — Supabase выдаёт JWT-токен (сохраняется в cookies)

### SMS-вход (требует Twilio):
1. Пользователь вводит номер телефона
2. Supabase через Twilio отправляет 6-значный код
3. Пользователь вводит код → вход
4. Стоимость: ~$0.05 за SMS

### Что нужно для SMS:
1. Зарегистрируйтесь на https://twilio.com
2. Получите Account SID, Auth Token, номер телефона
3. В Supabase → Authentication → Providers → Phone
4. Вставьте данные Twilio

---

## Стоимость в продакшене

| Сервис | Бесплатный лимит | Платный |
|--------|-----------------|---------|
| Supabase | 50K пользователей, 500MB БД, 1GB файлов | от $25/мес |
| Vercel | 100GB трафик, 100 деплоев/день | от $20/мес |
| Twilio (SMS) | — | ~$0.05/SMS |
| Домен | — | ~€10/год |

Для старта (до ~1000 клиентов) всё бесплатно кроме домена.
