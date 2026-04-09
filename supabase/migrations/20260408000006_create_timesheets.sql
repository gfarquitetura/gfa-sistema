-- ============================================================
-- timesheet_entries
-- One row per person per project per day (no unique constraint —
-- multiple blocks on the same project on the same day are allowed).
-- Time stored as integer minutes (bigint) — never decimals.
-- ============================================================

create table public.timesheet_entries (
  id                uuid        primary key default gen_random_uuid(),

  -- Who & what
  profile_id        uuid        not null references public.profiles(id) on delete cascade,
  project_id        uuid        references public.projects(id) on delete set null,
  -- project_id NULL = overhead / internal time

  -- When & how long
  entry_date        date        not null,
  minutes           bigint      not null check (minutes > 0 and minutes <= 1440),

  -- What was done
  description       text        not null,
  notes             text,

  -- Workflow
  status            text        not null default 'draft'
                                check (status in ('draft', 'submitted', 'approved', 'rejected')),
  rejection_reason  text,

  -- Submission
  submitted_at      timestamptz,

  -- Review
  reviewed_by       uuid        references auth.users(id) on delete set null,
  reviewed_at       timestamptz,

  -- Audit timestamps
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index timesheet_entries_profile_id_idx   on public.timesheet_entries (profile_id);
create index timesheet_entries_project_id_idx   on public.timesheet_entries (project_id);
create index timesheet_entries_entry_date_idx   on public.timesheet_entries (entry_date desc);
create index timesheet_entries_status_idx       on public.timesheet_entries (status);
create index timesheet_entries_profile_date_idx on public.timesheet_entries (profile_id, entry_date desc);

create trigger set_timesheet_entries_updated_at
  before update on public.timesheet_entries
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.timesheet_entries enable row level security;

-- Users read own entries
create policy "users_read_own_entries"
  on public.timesheet_entries for select
  using (auth.uid() = profile_id);

-- Managers / admins / financial read all entries
create policy "managers_read_all_entries"
  on public.timesheet_entries for select
  using (public.get_my_role() in ('admin', 'manager', 'financial'));

-- Any authenticated user can insert their own entries
create policy "users_insert_own_entries"
  on public.timesheet_entries for insert
  with check (auth.uid() = profile_id);

-- Owner can only update their own draft entries
create policy "users_update_draft_entries"
  on public.timesheet_entries for update
  using (auth.uid() = profile_id and status = 'draft');

-- Managers/admins/financial can update any entry (approve / reject)
create policy "managers_update_entries"
  on public.timesheet_entries for update
  using (public.get_my_role() in ('admin', 'manager', 'financial'));

-- Owner can delete their own draft entries
create policy "users_delete_draft_entries"
  on public.timesheet_entries for delete
  using (auth.uid() = profile_id and status = 'draft');

-- Admins can delete any entry
create policy "admins_delete_any_entry"
  on public.timesheet_entries for delete
  using (public.get_my_role() = 'admin');
