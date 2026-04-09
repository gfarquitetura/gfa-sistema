-- ============================================================
-- expense_categories
-- Reusable categories for classifying expenses.
-- ============================================================

create table public.expense_categories (
  id          uuid    primary key default gen_random_uuid(),
  name        text    not null unique,
  description text,
  is_active   boolean not null default true
);

-- Seed default categories
insert into public.expense_categories (name) values
  ('Mão de obra'),
  ('Materiais'),
  ('Subcontratados'),
  ('Deslocamento'),
  ('Software e licenças'),
  ('Impressão e plotagem'),
  ('Taxas e cartórios'),
  ('Outros');

alter table public.expense_categories enable row level security;

create policy "authenticated_read_categories"
  on public.expense_categories for select
  using (auth.role() = 'authenticated');

create policy "admins_manage_categories"
  on public.expense_categories for all
  using (public.get_my_role() in ('admin', 'financial'));

-- ============================================================
-- expenses
-- Both general (overhead) and project-allocated expenses.
-- project_id = NULL means it is a general/overhead expense.
-- All amounts stored as integer cents.
-- ============================================================

create table public.expenses (
  id              uuid        primary key default gen_random_uuid(),

  -- Allocation — project_id null = general overhead
  project_id      uuid        references public.projects(id) on delete set null,
  category_id     uuid        references public.expense_categories(id) on delete set null,

  -- Description
  description     text        not null,
  notes           text,

  -- Value
  amount          bigint      not null check (amount > 0), -- cents
  expense_date    date        not null default current_date,

  -- Receipt / document reference
  receipt_url     text,

  -- Audit
  created_by      uuid        references auth.users(id) on delete set null,
  updated_by      uuid        references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index expenses_project_id_idx   on public.expenses (project_id);
create index expenses_category_id_idx  on public.expenses (category_id);
create index expenses_expense_date_idx on public.expenses (expense_date desc);
create index expenses_created_at_idx   on public.expenses (created_at desc);

alter table public.expenses enable row level security;

create policy "authenticated_read_expenses"
  on public.expenses for select
  using (auth.role() = 'authenticated');

create policy "finances_insert_expenses"
  on public.expenses for insert
  with check (public.get_my_role() in ('admin', 'financial', 'manager'));

create policy "finances_update_expenses"
  on public.expenses for update
  using (public.get_my_role() in ('admin', 'financial', 'manager'));

create policy "admins_delete_expenses"
  on public.expenses for delete
  using (public.get_my_role() in ('admin', 'financial'));

create trigger set_expenses_updated_at
  before update on public.expenses
  for each row execute procedure public.handle_updated_at();
