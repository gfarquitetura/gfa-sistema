-- ============================================================
-- AI Knowledge Base — vector store for RAG assistant
-- Requires: pgvector extension
-- Run in Supabase SQL Editor before deploying the AI assistant
-- ============================================================

-- Enable pgvector
create extension if not exists vector;

-- ── Documents table ──────────────────────────────────────────────
create table public.ai_documents (
  id           bigserial    primary key,
  content      text         not null,
  embedding    vector(1536) not null,   -- text-embedding-3-small dimensions
  source       text         not null,   -- document name / filename
  section      text,                    -- detected heading within chunk
  page_number  int,
  created_at   timestamptz  not null default now()
);

-- HNSW index — fast approximate nearest-neighbour, low memory
create index ai_documents_embedding_idx
  on public.ai_documents
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index ai_documents_source_idx on public.ai_documents (source);

-- ── Row Level Security ───────────────────────────────────────────
alter table public.ai_documents enable row level security;

-- All authenticated users can read (needed for the match_documents RPC)
create policy "authenticated_read_ai_documents"
  on public.ai_documents for select
  using (auth.role() = 'authenticated');

-- Only admins (via service role in API route) can insert/delete
-- The API routes use the service-role client which bypasses RLS
-- This policy is a belt-and-suspenders guard against direct client access
create policy "admins_manage_ai_documents"
  on public.ai_documents for all
  using (public.get_my_role() = 'admin');

-- ── Similarity search function ───────────────────────────────────
-- Called from the /api/chat route via supabase.rpc('match_documents', ...)
create or replace function public.match_documents(
  query_embedding  vector(1536),
  match_threshold  float  default 0.70,
  match_count      int    default 4
)
returns table (
  content      text,
  source       text,
  section      text,
  similarity   float
)
language sql stable
security definer
set search_path = public
as $$
  select
    content,
    source,
    section,
    1 - (embedding <=> query_embedding) as similarity
  from  public.ai_documents
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- ── Document summary view (used by admin list page) ──────────────
create view public.ai_document_sources as
  select
    source,
    count(*)::int          as chunk_count,
    min(created_at)        as indexed_at
  from public.ai_documents
  group by source
  order by indexed_at desc;
