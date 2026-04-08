-- ============================================================
-- audit_logs
-- Append-only record of every significant action in the system.
-- Never updated or deleted — immutable by design.
-- ============================================================

create table public.audit_logs (
  id          bigint      generated always as identity primary key,
  user_id     uuid        references auth.users(id) on delete set null,
  user_email  text,         -- denormalized: survives user deletion
  action      text        not null,   -- e.g. 'user.created', 'client.updated'
  entity      text        not null,   -- e.g. 'user', 'client', 'project'
  entity_id   text,                   -- ID of the affected record
  metadata    jsonb,                  -- before/after values or extra context
  ip_address  text,
  created_at  timestamptz not null default now()
);

-- Indexes for the most common query patterns
create index audit_logs_user_id_idx    on public.audit_logs (user_id);
create index audit_logs_entity_idx     on public.audit_logs (entity, entity_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.audit_logs enable row level security;

-- Authenticated users may insert their own entries only
create policy "authenticated_insert_own_audit_logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Admins may read all entries
create policy "admins_read_audit_logs"
  on public.audit_logs
  for select
  using (public.get_my_role() = 'admin');

-- No UPDATE or DELETE policies → immutable via the API
