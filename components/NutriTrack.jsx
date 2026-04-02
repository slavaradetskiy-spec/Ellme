-- ═══════════════════════════════════════════════════════
-- NUTRITRACK — Схема базы данных
-- Запустите этот SQL в Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════

-- 1. Профили пользователей
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'client' check (role in ('client', 'doc')),
  name text not null default '',
  email text,
  phone text,
  age int,
  gender text,
  height_cm int,
  weight_kg numeric(5,1),
  request text default '',
  water_norm int default 2200,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Связь нутрициолог ↔ клиент
create table public.doc_clients (
  id uuid default gen_random_uuid() primary key,
  doc_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  nick text default '',
  status text default 'active' check (status in ('active', 'archive')),
  created_at timestamptz default now(),
  unique(doc_id, client_id)
);

-- 3. Дневники (одна запись = один день одного пользователя)
create table public.diary_days (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  water_ml int default 0,
  supplements text default '',
  sleep_wake text,
  sleep_bed text,
  sleep_quality int,
  movement text default '',
  stress_level int,
  stress_practices text default '',
  stool_state text,
  stool_note text default '',
  energy int,
  mood int,
  day_comment text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- 4. Приёмы пищи
create table public.meals (
  id uuid default gen_random_uuid() primary key,
  diary_day_id uuid references public.diary_days(id) on delete cascade not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack1','snack2','snack3')),
  time text,
  hunger text,
  description text default '',
  feeling text,
  feeling_note text default '',
  photo_url text,
  created_at timestamptz default now(),
  unique(diary_day_id, meal_type)
);

-- 5. Комментарии нутрициолога
create table public.doc_comments (
  id uuid default gen_random_uuid() primary key,
  doc_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  text text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- 6. Инвайт-ссылки
create table public.invites (
  id uuid default gen_random_uuid() primary key,
  doc_id uuid references public.profiles(id) on delete cascade not null,
  code text unique not null,
  used boolean default false,
  used_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════
-- Автоматическое создание профиля при регистрации
-- ═══════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════
-- Row Level Security (RLS) — защита данных
-- ═══════════════════════════════════════

-- Профили
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Docs can view their clients profiles"
  on public.profiles for select using (
    exists (
      select 1 from public.doc_clients
      where doc_id = auth.uid() and client_id = profiles.id
    )
  );

-- Связи нутрициолог-клиент
alter table public.doc_clients enable row level security;

create policy "Doc can manage own clients"
  on public.doc_clients for all using (doc_id = auth.uid());

create policy "Client can see own doc link"
  on public.doc_clients for select using (client_id = auth.uid());

-- Дневники
alter table public.diary_days enable row level security;

create policy "Users can manage own diary"
  on public.diary_days for all using (user_id = auth.uid());

create policy "Doc can view client diary"
  on public.diary_days for select using (
    exists (
      select 1 from public.doc_clients
      where doc_id = auth.uid() and client_id = diary_days.user_id
    )
  );

-- Приёмы пищи
alter table public.meals enable row level security;

create policy "Users can manage own meals"
  on public.meals for all using (
    exists (
      select 1 from public.diary_days
      where diary_days.id = meals.diary_day_id and diary_days.user_id = auth.uid()
    )
  );

create policy "Doc can view client meals"
  on public.meals for select using (
    exists (
      select 1 from public.diary_days d
      join public.doc_clients dc on dc.client_id = d.user_id
      where d.id = meals.diary_day_id and dc.doc_id = auth.uid()
    )
  );

-- Комментарии
alter table public.doc_comments enable row level security;

create policy "Doc can manage own comments"
  on public.doc_comments for all using (doc_id = auth.uid());

create policy "Client can view own comments"
  on public.doc_comments for select using (client_id = auth.uid());

create policy "Client can mark comments read"
  on public.doc_comments for update using (client_id = auth.uid());

-- Инвайты
alter table public.invites enable row level security;

create policy "Doc can manage own invites"
  on public.invites for all using (doc_id = auth.uid());

create policy "Anyone can view unused invites"
  on public.invites for select using (used = false);

-- ═══════════════════════════════════════
-- Storage для фото (аватары + фото еды)
-- ═══════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict do nothing;

create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "Anyone can view photos"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "Users can delete own photos"
  on storage.objects for delete
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
