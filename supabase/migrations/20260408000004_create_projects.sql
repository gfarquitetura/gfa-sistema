-- ============================================================
-- projects
-- Each project belongs to a client and becomes a cost center.
-- Contract values stored as integer cents to avoid float precision issues.
-- ============================================================

create table public.projects (
  id              uuid        primary key default gen_random_uuid(),

  -- Identity
  code            text        not null unique, -- e.g. "GFA-2026-001"
  name            text        not null,
  description     text,

  -- Client relationship
  client_id       uuid        not null references public.clients(id) on delete restrict,

  -- Lifecycle
  status          text        not null default 'proposal'
                              check (status in ('proposal', 'active', 'paused', 'completed', 'cancelled')),

  -- Contract
  contract_value  bigint      not null default 0, -- stored in cents (R$ 1,00 = 100)
  start_date      date,
  end_date        date,
  deadline        date,

  -- Internal
  notes           text,

  -- Audit
  created_by      uuid        references auth.users(id) on delete set null,
  updated_by      uuid        references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index projects_client_id_idx   on public.projects (client_id);
create index projects_status_idx      on public.projects (status);
create index projects_created_at_idx  on public.projects (created_at desc);
create index projects_name_fts_idx    on public.projects using gin(to_tsvector('portuguese', name));

-- ============================================================
-- project_members
-- Which staff are assigned to each project and in what role.
-- ============================================================

create table public.project_members (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        not null references public.projects(id) on delete cascade,
  profile_id  uuid        not null references public.profiles(id) on delete cascade,
  member_role text        not null default 'collaborator'
                          check (member_role in ('responsible', 'collaborator')),
  joined_at   timestamptz not null default now(),
  unique (project_id, profile_id)
);

create index project_members_project_idx on public.project_members (project_id);
create index project_members_profile_idx on public.project_members (profile_id);

-- ============================================================
-- Row Level Security — projects
-- ============================================================
alter table public.projects enable row level security;

create policy "authenticated_read_projects"
  on public.projects for select
  using (auth.role() = 'authenticated');

create policy "managers_insert_projects"
  on public.projects for insert
  with check (public.get_my_role() in ('admin', 'manager'));

create policy "managers_update_projects"
  on public.projects for update
  using (public.get_my_role() in ('admin', 'manager'));

create policy "admins_delete_projects"
  on public.projects for delete
  using (public.get_my_role() = 'admin');

-- ============================================================
-- Row Level Security — project_members
-- ============================================================
alter table public.project_members enable row level security;

create policy "authenticated_read_project_members"
  on public.project_members for select
  using (auth.role() = 'authenticated');

create policy "managers_manage_project_members"
  on public.project_members for insert
  with check (public.get_my_role() in ('admin', 'manager'));

create policy "managers_delete_project_members"
  on public.project_members for delete
  using (public.get_my_role() in ('admin', 'manager'));

-- ============================================================
-- updated_at trigger (reuses function from migration 1)
-- ============================================================
create trigger set_projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- Auto-generate project code: GFA-YYYY-NNN
-- ============================================================
create or replace function public.generate_project_code()
returns trigger
language plpgsql
as $$
declare
  year_str text := to_char(now(), 'YYYY');
  seq      int;
begin
  select count(*) + 1
    into seq
    from public.projects
    where extract(year from created_at) = extract(year from now());

  new.code := 'GFA-' || year_str || '-' || lpad(seq::text, 3, '0');
  return new;
end;
$$;

create trigger set_project_code
  before insert on public.projects
  for each row
  when (new.code is null or new.code = '')
  execute procedure public.generate_project_code();
