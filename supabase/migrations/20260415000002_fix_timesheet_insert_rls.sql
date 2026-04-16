-- ============================================================
-- Fix timesheet insert RLS: restrict to roles with timesheets:submit.
-- The 'financial' role can approve timesheets but cannot submit their own.
-- Roles with timesheets:submit: admin, manager, readonly.
-- Also require is_active = true so deactivated users cannot insert.
-- ============================================================

drop policy "users_insert_own_entries" on public.timesheet_entries;

create policy "users_insert_own_entries"
  on public.timesheet_entries for insert
  with check (
    auth.uid() = profile_id
    and exists (
      select 1 from public.profiles
      where id   = auth.uid()
      and   role in ('admin', 'manager', 'readonly')
      and   is_active = true
    )
  );
