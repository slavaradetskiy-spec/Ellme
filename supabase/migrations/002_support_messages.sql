-- ═══════════════════════════════════════
-- Таблица обращений в поддержку
-- Запустите этот SQL в Supabase → SQL Editor
-- ═══════════════════════════════════════

create table if not exists public.support_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  email text,
  text text not null,
  file_url text,
  status text default 'new' check (status in ('new', 'in_progress', 'resolved')),
  created_at timestamptz default now()
);

alter table public.support_messages enable row level security;

create policy "Users can create support messages"
  on public.support_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can view own support messages"
  on public.support_messages for select
  using (auth.uid() = user_id);

-- Админ (service role) может видеть все обращения через Supabase Dashboard
