-- ============================================================
-- clients
-- Architecture firm clients — companies (CNPJ) or individuals (CPF).
-- Documents, phones and CEP stored as digits only — no formatting.
-- ============================================================

create table public.clients (
  id              uuid        primary key default gen_random_uuid(),

  -- Identity
  name            text        not null,
  trade_name      text,                            -- "nome fantasia" (companies only)
  document_type   text        not null
                              check (document_type in ('cpf', 'cnpj')),
  document_number text        not null unique,     -- digits only

  -- Contact
  email           text,
  phone           text,                            -- digits only

  -- Address (populated via ViaCEP auto-fill)
  cep             text,                            -- digits only
  logradouro      text,
  numero          text,
  complemento     text,
  bairro          text,
  cidade          text,
  estado          text,                            -- 2-char UF

  -- Internal
  notes           text,
  is_active       boolean     not null default true,

  -- Audit
  created_by      uuid        references auth.users(id) on delete set null,
  updated_by      uuid        references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Full-text search on name using Portuguese dictionary
create index clients_name_fts_idx   on public.clients using gin(to_tsvector('portuguese', name));
create index clients_document_idx   on public.clients (document_number);
create index clients_created_at_idx on public.clients (created_at desc);
create index clients_is_active_idx  on public.clients (is_active);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.clients enable row level security;

-- All authenticated users can read clients
create policy "authenticated_read_clients"
  on public.clients
  for select
  using (auth.role() = 'authenticated');

-- Admin, Financial, Manager can create clients
create policy "managers_insert_clients"
  on public.clients
  for insert
  with check (public.get_my_role() in ('admin', 'financial', 'manager'));

-- Admin, Financial, Manager can update clients
create policy "managers_update_clients"
  on public.clients
  for update
  using (public.get_my_role() in ('admin', 'financial', 'manager'));

-- Only admin can hard delete (soft delete via is_active is preferred)
create policy "admins_delete_clients"
  on public.clients
  for delete
  using (public.get_my_role() = 'admin');

-- ============================================================
-- Reuse updated_at trigger from migration 1
-- ============================================================
create trigger set_clients_updated_at
  before update on public.clients
  for each row execute procedure public.handle_updated_at();
