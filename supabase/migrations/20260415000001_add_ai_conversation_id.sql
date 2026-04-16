-- ============================================================
-- Add ai_conversation_id to conversations
-- Stores the corresponding Aireponado conversation UUID so gfa-sistema
-- can resume the same conversation context on the AI service.
-- ============================================================

alter table public.conversations
  add column if not exists ai_conversation_id text;
