import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { buildSystemPrompt, type RetrievedChunk } from '@/lib/ai/system-prompt'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  const profile = await getProfile()
  if (!profile) {
    return new NextResponse('Não autorizado.', { status: 401 })
  }

  let body: { message: string; history?: { role: 'user' | 'assistant'; content: string }[] }
  try {
    body = await request.json()
  } catch {
    return new NextResponse('JSON inválido.', { status: 400 })
  }

  const userMessage = body.message?.trim()
  if (!userMessage || userMessage.length > 2000) {
    return new NextResponse('Mensagem inválida.', { status: 400 })
  }

  // ── 1. Embed the user query ───────────────────────────────────────
  let queryEmbedding: number[]
  try {
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: userMessage,
    })
    queryEmbedding = embeddingRes.data[0].embedding
  } catch {
    return new NextResponse('Erro ao gerar embedding.', { status: 502 })
  }

  // ── 2. Retrieve relevant chunks from pgvector ─────────────────────
  const supabase = await createClient()
  const { data: rawChunks, error: rpcError } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.50,
    match_count: 5,
  })

  if (rpcError) {
    console.error('[chat] match_documents RPC error:', rpcError.message)
  }

  const chunks: RetrievedChunk[] = (rawChunks ?? []).map(
    (c: { content: string; source: string; section: string | null; similarity: number }) => ({
      content:    c.content,
      source:     c.source,
      section:    c.section,
      similarity: c.similarity,
    })
  )

  // ── 3. Build system prompt with RAG context ───────────────────────
  const systemPrompt = buildSystemPrompt(profile.full_name, profile.role, chunks)

  // ── 4. Build message history (cap at 10 exchanges) ────────────────
  const historyMessages = (body.history ?? [])
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }))

  // ── 5. Stream GPT-4o-mini response ───────────────────────────────
  let gptStream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
  try {
    gptStream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      max_tokens: 700,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userMessage },
      ],
    })
  } catch {
    return new NextResponse('Erro ao chamar o modelo de linguagem.', { status: 502 })
  }

  // Return a plain-text stream; client reads with ReadableStream
  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const chunk of gptStream) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) controller.enqueue(encoder.encode(delta))
        }
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    },
  })
}
