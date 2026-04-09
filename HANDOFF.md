# HANDOFF: ELLME проект

Временный файл для передачи контекста между сессиями Claude Code. Удалить когда не нужен.

## Текущая ветка и статус
- Активная ветка разработки: **staging** (последнее — фикс лайков с upsert + create diary_day)
- Production: **main**
- Staging URL: https://ellme-git-staging-slavaradetskiy-specs-projects.vercel.app
- Production URL: https://ellme.ru

## Стек
- Next.js (app router) + React
- Supabase (Auth + DB + Storage + Realtime)
- Vercel (деплой)
- Основной файл: `components/NutriTrack.jsx` (~1800 строк)

## Supabase проект
- Project ref: `lcyrguguhiutdvdkptbs`
- Dashboard: https://supabase.com/dashboard/project/lcyrguguhiutdvdkptbs

## Задачи из последней итерации (8 штук, статус)

### ✅ Группа A — сделано и в main
- **#1** Фикс скролла при смене экрана (useEffect с `window.scrollTo(0,0)` на `[screen]`)
- **#2** Фото клиента в `clientProfile` (круглое 96px)
- **#3** Иконка 👤 в TopBar клиентского представления → ведёт на свой профиль нутрициолога (не клиентский)
- **#4** Движение: чипы активности (9 типов) + степпер продолжительности (шаг 10 мин)
- **#8** Увеличен `marginTop` footer (60→140)
- Автоскролл чата только внутри контейнера, не всей страницы
- Переименовано "Чат" → "Комментарий нутрициолога"

### 🟡 Задача #7 — ЛАЙКИ, на staging, НЕ ПРОТЕСТИРОВАНА
- Код в `components/NutriTrack.jsx`:
  - `toggleMealLike(pid, mealId)` — обновляет `diaries` state напрямую, потом upsert в `meals` с `liked`
  - Если нет `diary_days` row — создаёт её (нужны RLS policies)
  - Сердечко в `MealDetail` TopBar (для doc — кликабельное, для клиента — индикатор)
  - Сердечко-бейдж на `MealTile` когда `liked=true`
- SQL миграции применены пользователем в Supabase:
  ```sql
  ALTER TABLE meals ADD COLUMN IF NOT EXISTS liked boolean DEFAULT false;
  
  CREATE POLICY "doc_can_update_client_meals_liked" ON meals
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM diary_days dd
      JOIN doc_clients dc ON dc.client_id = dd.user_id
      WHERE dd.id = meals.diary_day_id AND dc.doc_id = auth.uid()))
    WITH CHECK (...);
  
  CREATE POLICY "doc_can_insert_client_diary_days" ON diary_days
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM doc_clients dc
      WHERE dc.client_id = diary_days.user_id AND dc.doc_id = auth.uid()));
  
  CREATE POLICY "doc_can_insert_client_meals" ON meals
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM diary_days dd
      JOIN doc_clients dc ON dc.client_id = dd.user_id
      WHERE dd.id = meals.diary_day_id AND dc.doc_id = auth.uid()));
  ```
- **Нужно проверить на staging:**
  1. Login email/пароль
  2. Нутрициолог → клиент → приём пищи → сердечко → F5 → сохранилось?
  3. Клиент → тот же приём пищи → видно сердечко?
- Если работает — **мержить в main**

### 🔴 Остались нереализованными
- **#5** Колокольчик уведомлений у нутрициолога (зависит от #6)
- **#6** Чат в БД с realtime. Ранее падал с React error #310 (too many re-renders) когда пытались делать realtime подписку через useEffect. Нужен новый подход: компонент `<ChatComments>` с пустым `useEffect([])` который живёт отдельно, без зависимостей от `user?.id` / `selClient?.id`.

## Проблема с Supabase MCP
- Локальный `claude mcp add --scope user` работает
- Claude Code web (claude.ai/code) **не работает**: sandbox прокси блокирует `*.supabase.co` (`host_not_allowed`)
- Workaround: работать через локальный Claude Code CLI в PowerShell на ПК пользователя

## Известные особенности
- `.mcp.json` уже в репо (main и staging) — но в cloud sandbox не работает из-за прокси
- RLS policies в Supabase строгие — нутрициолог не может писать в чужие `diary_days` без специальных политик
- Auto-save через `setDay()` триггерит `saveDayToDb()` который пытается upsert в `diary_days` — при тестах это ломало лайки (403 Forbidden). Фикс: `toggleMealLike` обходит `setDay` и работает с `setDiaries` напрямую.

## Session log
См. https://claude.ai/code/session_01N6KzzPj4QXEad5hnm5nKZL

## План продолжения (priority)
1. Протестировать лайки на staging → если ОК, мержить в main
2. Сделать чат #6 правильно (без infinite re-render)
3. Добавить колокольчик нутрициолога #5
4. Удалить этот файл
