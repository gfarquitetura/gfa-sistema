import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { buildSystemPrompt, type RetrievedChunk } from '@/lib/ai/system-prompt'
import type { MessageSource } from '@/lib/types/database'

export const maxDuration = 300

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Helper — encode one SSE data line
function sseEvent(obj: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`)
}

// ── GET — fetch all messages for a conversation ───────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getProfile()
  if (!profile) return new NextResponse('Não autorizado.', { status: 401 })

  const { id } = await params
  const supabase = await createClient()

  // Verify ownership
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('profile_id', profile.id)
    .single()

  if (!conv) return new NextResponse('Conversa não encontrada.', { status: 404 })

  const { data, error } = await supabase
    .from('conversation_messages')
    .select('id, role, content, sources, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (error) return new NextResponse('Erro ao buscar mensagens.', { status: 500 })

  return NextResponse.json(data ?? [])
}

// ── POST — send a message and stream the assistant response ───────────
// Body: { message: string }
//
// SSE event types emitted:
//   { type: 'sources', sources: MessageSource[] }
//   { type: 'chunk',   text: string }
//   { type: 'done',    title: string | null }   ← title set only on 1st message
//   { type: 'error',   message: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getProfile()
  if (!profile) return new NextResponse('Não autorizado.', { status: 401 })

  const { id: convId } = await params

  // Parse body
  let body: { message: string }
  try {
    body = await request.json()
  } catch {
    return new NextResponse('JSON inválido.', { status: 400 })
  }

  const userMessage = body.message?.trim()
  if (!userMessage || userMessage.length > 2000) {
    return new NextResponse('Mensagem inválida.', { status: 400 })
  }

  const supabase = await createClient()

  // Verify conversation ownership
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, title')
    .eq('id', convId)
    .eq('profile_id', profile.id)
    .single()

  if (!conv) return new NextResponse('Conversa não encontrada.', { status: 404 })

  // Check if this is the first message (title still default)
  const isFirstMessage = conv.title === 'Nova conversa'

  // Save user message immediately (before streaming starts)
  await supabase.from('conversation_messages').insert({
    conversation_id: convId,
    role:            'user',
    content:         userMessage,
  })

  // Touch updated_at on the conversation
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', convId)

  // ── Stream response ─────────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Embed user message
        const embeddingRes = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: userMessage,
        })
        const queryEmbedding = embeddingRes.data[0].embedding

        // 2. RAG retrieval
        const { data: rawChunks, error: rpcError } = await supabase.rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.50,
          match_count:     5,
        })
        if (rpcError) console.error('[messages] match_documents error:', rpcError.message)

        const chunks: RetrievedChunk[] = (rawChunks ?? []).map(
          (c: { content: string; source: string; section: string | null; similarity: number }) => ({
            content:    c.content,
            source:     c.source,
            section:    c.section,
            similarity: c.similarity,
          })
        )

        const sources: MessageSource[] = chunks.map((c) => ({
          source:     c.source,
          section:    c.section,
          similarity: c.similarity,
        }))

        // 3. Send sources event (client renders these below the message)
        controller.enqueue(sseEvent({ type: 'sources', sources }))

        // 4. Fetch recent history for context (last 10 messages, excluding the one we just saved)
        const { data: history } = await supabase
          .from('conversation_messages')
          .select('role, content')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(11)   // 10 previous + the user message we just inserted

        const historyMessages = (history ?? [])
          .reverse()
          .slice(0, -1)   // exclude the last item (current user message — already in prompt)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

        // 5. Build system prompt and stream GPT
        const systemPrompt = buildSystemPrompt(profile.full_name, profile.role, chunks)

        const gptStream = await openai.chat.completions.create({
          model:       'gpt-4o-mini',
          stream:      true,
          max_tokens:  700,
          temperature: 0.3,
          messages: [
            { role: 'system',  content: systemPrompt },
            ...historyMessages,
            { role: 'user',    content: userMessage },
          ],
        })

        let fullText = ''
        for await (const chunk of gptStream) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            fullText += delta
            controller.enqueue(sseEvent({ type: 'chunk', text: delta }))
          }
        }

        // 6. Save completed assistant message with sources
        await supabase.from('conversation_messages').insert({
          conversation_id: convId,
          role:            'assistant',
          content:         fullText,
          sources:         sources.length > 0 ? sources : null,
        })

        // 7. Generate title on first message
        let newTitle: string | null = null
        if (isFirstMessage && fullText) {
          try {
            const titleRes = await openai.chat.completions.create({
              model:       'gpt-4o-mini',
              max_tokens:  12,
              temperature: 0.5,
              messages: [
                {
                  role:    'system',
                  content: 'Gere um título curto (máximo 6 palavras, em português brasileiro) para uma conversa que começa com a mensagem abaixo. Responda apenas com o título, sem pontuação no final.',
                },
                { role: 'user', content: userMessage },
              ],
            })
            newTitle = titleRes.choices[0]?.message?.content?.trim() ?? null
            if (newTitle) {
              await supabase
                .from('conversations')
                .update({ title: newTitle })
                .eq('id', convId)
            }
          } catch {
            // Title generation is best-effort — don't fail the whole request
          }
        }

        // 8. Signal end of stream, include new title if generated
        controller.enqueue(sseEvent({ type: 'done', title: newTitle }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro inesperado.'
        controller.enqueue(sseEvent({ type: 'error', message }))
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type':            'text/event-stream; charset=utf-8',
      'Cache-Control':           'no-cache',
      'X-Content-Type-Options':  'nosniff',
    },
  })
}
