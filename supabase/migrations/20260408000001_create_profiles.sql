-- ============================================================
-- profiles
-- One row per auth user. Stores role, display name, and status.
-- Created automatically via trigger on auth.users insert.
-- ============================================================

create table public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  full_name   text        not null default '',
  email       text        not null,
  role        text        not null default 'readonly'
                          check (role in ('admin', 'financial', 'manager', 'readonly')),
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- Helper: returns the calling user's role without hitting RLS
-- (security definer avoids infinite recursion in policies)
-- ============================================================
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;

-- Any authenticated user can read their own profile
create policy "users_read_own_profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Admins can read all profiles
create policy "admins_read_all_profiles"
  on public.profiles
  for select
  using (public.get_my_role() = 'admin');

-- Admins can update any profile (role changes, deactivation, name edits)
create policy "admins_update_profiles"
  on public.profiles
  for update
  using (public.get_my_role() = 'admin');

-- Direct INSERT is blocked for everyone — profiles are created
-- exclusively by the handle_new_user trigger (security definer).

-- ============================================================
-- Trigger: auto-create profile when a user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'readonly')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ============================================================
-- Trigger: keep updated_at current on every update
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();
