-- ============================================================
-- Persistent AI chat — conversations + messages
-- ============================================================

-- ── Conversations ─────────────────────────────────────────────────────
create table public.conversations (
  id         uuid        primary key default gen_random_uuid(),
  profile_id uuid        not null references public.profiles(id) on delete cascade,
  title      text        not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_profile_id_idx on public.conversations (profile_id);
create index conversations_updated_at_idx on public.conversations (updated_at desc);

create trigger set_conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.handle_updated_at();

alter table public.conversations enable row level security;

create policy "users_manage_own_conversations"
  on public.conversations for all
  using  (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ── Messages ──────────────────────────────────────────────────────────
create table public.conversation_messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  role            text        not null check (role in ('user', 'assistant')),
  content         text        not null,
  -- RAG sources attached to assistant messages:
  -- [{ source: string, section: string|null, similarity: number }]
  sources         jsonb,
  created_at      timestamptz not null default now()
);

create index conversation_messages_conv_id_idx
  on public.conversation_messages (conversation_id, created_at asc);

alter table public.conversation_messages enable row level security;

-- Users can read/write messages that belong to their own conversations
create policy "users_read_own_messages"
  on public.conversation_messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.profile_id = auth.uid()
    )
  );

create policy "users_insert_own_messages"
  on public.conversation_messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.profile_id = auth.uid()
    )
  );
