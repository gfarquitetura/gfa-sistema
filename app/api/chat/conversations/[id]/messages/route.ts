import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { chatStream } from '@/lib/ai/aireponado'
import { rateLimit } from '@/lib/rate-limit'
import type { MessageSource } from '@/lib/types/database'

export const maxDuration = 300

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
// Proxies to Aireponado and mirrors SSE events back to the browser.
// Still persists user + assistant messages to gfa's own DB for the UI.
//
// SSE event types forwarded to client:
//   { type: 'sources', sources: MessageSource[] }
//   { type: 'chunk',   text: string }
//   { type: 'done',    title: string | null }
//   { type: 'error',   message: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getProfile()
  if (!profile) return new NextResponse('Não autorizado.', { status: 401 })

  // 20 messages per minute per user
  if (!rateLimit(profile.id, 20, 60_000)) {
    return new NextResponse('Muitas requisições. Aguarde um momento.', { status: 429 })
  }

  const { id: convId } = await params

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

  // Verify ownership and get the linked aireponado conversation id (if any)
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, title, ai_conversation_id')
    .eq('id', convId)
    .eq('profile_id', profile.id)
    .single()

  if (!conv) return new NextResponse('Conversa não encontrada.', { status: 404 })

  // Save user message to gfa DB immediately (optimistic — UI reads from here)
  await supabase.from('conversation_messages').insert({
    conversation_id: convId,
    role:            'user',
    content:         userMessage,
  })

  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', convId)

  // ── Proxy to Aireponado ──────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const aiRes = await chatStream({
          message:         userMessage,
          conversation_id: conv.ai_conversation_id ?? undefined,
          user_id:         profile.id,
          user_name:       profile.full_name,
        })

        if (!aiRes.ok || !aiRes.body) {
          const errText = await aiRes.text().catch(() => 'Erro no serviço de IA.')
          controller.enqueue(sseEvent({ type: 'error', message: errText }))
          controller.close()
          return
        }

        // Read the SSE stream from aireponado, forward relevant events to browser,
        // and accumulate data needed to persist the assistant message.
        const reader  = aiRes.body.getReader()
        const decoder = new TextDecoder()
        let buffer       = ''
        let fullText     = ''
        let finalSources: MessageSource[] = []
        let newTitle: string | null = null
        let aiConvId: string | null = null

        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''

          for (const part of parts) {
            if (!part.startsWith('data: ')) continue

            let event: {
              type:     string
              id?:      string
              sources?: MessageSource[]
              text?:    string
              title?:   string | null
              message?: string
            }
            try {
              event = JSON.parse(part.slice(6))
            } catch {
              continue
            }

            switch (event.type) {
              case 'conversation_id':
                // Capture aireponado's conversation id — store in gfa DB below
                aiConvId = event.id ?? null
                // Do NOT forward this event to the browser (it's internal)
                break

              case 'sources':
                finalSources = event.sources ?? []
                controller.enqueue(sseEvent({ type: 'sources', sources: finalSources }))
                break

              case 'chunk':
                fullText += event.text ?? ''
                controller.enqueue(sseEvent({ type: 'chunk', text: event.text ?? '' }))
                break

              case 'done':
                newTitle = event.title ?? null
                // Persist assistant message to gfa DB
                await supabase.from('conversation_messages').insert({
                  conversation_id: convId,
                  role:            'assistant',
                  content:         fullText,
                  sources:         finalSources.length > 0 ? finalSources : null,
                })
                // Store aireponado conversation id + title on gfa conversation
                await supabase
                  .from('conversations')
                  .update({
                    ...(aiConvId && !conv.ai_conversation_id
                      ? { ai_conversation_id: aiConvId }
                      : {}),
                    ...(newTitle ? { title: newTitle } : {}),
                  })
                  .eq('id', convId)
                controller.enqueue(sseEvent({ type: 'done', title: newTitle }))
                break

              case 'error':
                controller.enqueue(sseEvent({ type: 'error', message: event.message ?? 'Erro inesperado.' }))
                break
            }
          }
        }
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
      'Content-Type':           'text/event-stream; charset=utf-8',
      'Cache-Control':          'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
