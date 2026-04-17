import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { chatStream } from '@/lib/ai/aireponado'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  const profile = await getProfile()
  if (!profile) return new NextResponse('Não autorizado.', { status: 401 })

  if (!rateLimit(profile.id, 20, 60_000)) {
    return new NextResponse('Muitas requisições. Aguarde um momento.', { status: 429 })
  }

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

  const aiRes = await chatStream({
    message:   userMessage,
    user_id:   profile.id,
    user_name: profile.full_name,
  }).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : 'Erro ao conectar ao serviço de IA.'
    return new NextResponse(msg, { status: 502 }) as unknown as Response
  })

  if (!aiRes.ok || !aiRes.body) {
    const text = await aiRes.text().catch(() => 'Erro no serviço de IA.')
    return new NextResponse(text, { status: 502 })
  }

  // Parse SSE from aireponado, forward only text chunks as a plain stream
  const stream = new ReadableStream({
    async start(controller) {
      const reader  = aiRes.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''

          for (const part of parts) {
            if (!part.startsWith('data: ')) continue
            let event: { type: string; text?: string; message?: string }
            try { event = JSON.parse(part.slice(6)) } catch { continue }

            if (event.type === 'chunk' && event.text) {
              controller.enqueue(new TextEncoder().encode(event.text))
            } else if (event.type === 'error') {
              controller.enqueue(new TextEncoder().encode(`\n⚠ ${event.message ?? 'Erro inesperado.'}`))
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro inesperado.'
        controller.enqueue(new TextEncoder().encode(`\n⚠ ${msg}`))
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type':  'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
