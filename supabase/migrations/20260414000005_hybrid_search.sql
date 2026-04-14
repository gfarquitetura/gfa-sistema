-- ============================================================
-- Hybrid search upgrade for ai_documents
-- Adds full-text search (Portuguese) alongside vector similarity.
-- Uses Reciprocal Rank Fusion (RRF) to merge both result sets.
-- Run in Supabase SQL Editor after the initial AI migration.
-- ============================================================

-- 1. Add stored tsvector column for full-text search
alter table public.ai_documents
  add column if not exists content_tsv tsvector
  generated always as (to_tsvector('portuguese', coalesce(content, ''))) stored;

-- 2. GIN index for fast full-text search
create index if not exists ai_documents_content_tsv_idx
  on public.ai_documents using gin(content_tsv);

-- 3. Replace match_documents with hybrid (vector + full-text) version
--    Uses RRF for result merging; returns cosine similarity for display.
create or replace function public.match_documents(
  query_embedding  vector(1536),
  query_text       text        default '',
  match_threshold  float       default 0.35,
  match_count      int         default 12
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
  with vector_matches as (
    select
      id,
      content,
      source,
      section,
      1 - (embedding <=> query_embedding)                           as vec_score,
      row_number() over (order by embedding <=> query_embedding)    as vec_rank
    from public.ai_documents
    where 1 - (embedding <=> query_embedding) > match_threshold
    order by embedding <=> query_embedding
    limit 20
  ),
  text_matches as (
    select
      id,
      content,
      source,
      section,
      ts_rank_cd(content_tsv, plainto_tsquery('portuguese', query_text), 1)  as text_score,
      row_number() over (
        order by ts_rank_cd(content_tsv, plainto_tsquery('portuguese', query_text), 1) desc
      )                                                                        as text_rank
    from public.ai_documents
    where query_text <> ''
      and content_tsv @@ plainto_tsquery('portuguese', query_text)
    order by text_score desc
    limit 20
  ),
  combined as (
    select
      coalesce(v.id,      t.id)      as id,
      coalesce(v.content, t.content) as content,
      coalesce(v.source,  t.source)  as source,
      coalesce(v.section, t.section) as section,
      -- RRF score for ranking (k=60 is the standard constant)
      coalesce(1.0 / (60 + v.vec_rank),  0) +
      coalesce(1.0 / (60 + t.text_rank), 0) as rrf_score,
      -- Cosine similarity for display (0.40 fallback for text-only hits)
      coalesce(v.vec_score, 0.40)             as cosine_sim
    from vector_matches  v
    full outer join text_matches t on v.id = t.id
  )
  select
    content,
    source,
    section,
    cosine_sim as similarity
  from combined
  order by rrf_score desc
  limit match_count;
$$;
