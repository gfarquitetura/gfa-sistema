'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageBubble, StreamingBubble } from './message-bubble'
import type { ConversationMessage, MessageSource } from '@/lib/types/database'
import type { Role } from '@/lib/types/database'

interface Props {
  convId:          string
  initialMessages: ConversationMessage[]
  profileName:     string
  profileRole:     Role
  onTitleUpdate:   (title: string) => void
}

type StreamingState = { content: string; sources: MessageSource[] } | null

export function ChatPanel({
  convId,
  initialMessages,
  onTitleUpdate,
}: Props) {
  const [messages, setMessages]   = useState<ConversationMessage[]>(initialMessages)
  const [streaming, setStreaming] = useState<StreamingState>(null)
  const [input, setInput]         = useState('')
  const [isSending, setIsSending] = useState(false)
  const endRef                    = useRef<HTMLDivElement>(null)
  const textareaRef               = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom whenever messages change or streaming content grows
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming?.content])

  // Reset textarea height after sending
  useEffect(() => {
    if (!isSending && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [isSending])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isSending) return

    // Optimistic user message
    const userMsg: ConversationMessage = {
      id:              crypto.randomUUID(),
      conversation_id: convId,
      role:            'user',
      content:         text,
      sources:         null,
      created_at:      new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsSending(true)
    setStreaming({ content: '', sources: [] })

    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text }),
      })

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => 'Erro desconhecido.')
        pushErrorMessage(`⚠ ${errText}`)
        return
      }

      // Parse SSE events from the stream
      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer       = ''
      let finalContent = ''
      let finalSources: MessageSource[] = []

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Each SSE event is separated by \n\n
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''   // keep incomplete last chunk

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue

          let event: {
            type:     string
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
            case 'sources':
              finalSources = event.sources ?? []
              setStreaming((s) => s ? { ...s, sources: finalSources } : s)
              break

            case 'chunk':
              finalContent += event.text ?? ''
              setStreaming((s) => s ? { ...s, content: s.content + (event.text ?? '') } : s)
              break

            case 'done': {
              // Move streaming state → persisted messages
              const assistantMsg: ConversationMessage = {
                id:              crypto.randomUUID(),
                conversation_id: convId,
                role:            'assistant',
                content:         finalContent,
                sources:         finalSources.length > 0 ? finalSources : null,
                created_at:      new Date().toISOString(),
              }
              setMessages((prev) => [...prev, assistantMsg])
              setStreaming(null)
              if (event.title) onTitleUpdate(event.title)
              break
            }

            case 'error':
              setStreaming(null)
              pushErrorMessage(`⚠ ${event.message ?? 'Erro inesperado.'}`)
              break
          }
        }
      }
    } catch {
      pushErrorMessage('⚠ Erro de conexão. Tente novamente.')
    } finally {
      setIsSending(false)
    }
  }

  function pushErrorMessage(content: string) {
    setStreaming(null)
    setMessages((prev) => [
      ...prev,
      {
        id:              crypto.randomUUID(),
        conversation_id: convId,
        role:            'assistant',
        content,
        sources:         null,
        created_at:      new Date().toISOString(),
      },
    ])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    // Auto-grow textarea up to max-h
    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const isEmpty = messages.length === 0 && !streaming

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full bg-zinc-950">

      {/* ── Messages area ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-8">

        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center select-none">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: '#3D0A0A', border: '1px solid #6B1A1A' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className="w-7 h-7" style={{ color: '#F87171' }} aria-hidden="true">
                <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <div>
              <p className="text-zinc-300 font-medium">Assistente de Normas Técnicas</p>
              <p className="text-zinc-600 text-sm mt-1 max-w-xs">
                Pergunte sobre NBR, ANVISA RDC-50, recuos, gabaritos, ART/RRT e mais.
              </p>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {streaming && (
            <StreamingBubble content={streaming.content} sources={streaming.sources} />
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* ── Input area ───────────────────────────────────────────────── */}
      <div className="border-t border-zinc-800 px-4 py-4">
        <div className="flex gap-3 items-end max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            rows={1}
            placeholder="Digite sua pergunta… (Enter envia, Shift+Enter nova linha)"
            disabled={isSending}
            className="flex-1 resize-none bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 max-h-36 overflow-y-auto leading-relaxed"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#8B1A1A' }}
            aria-label="Enviar mensagem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4 text-white" aria-hidden="true">
              <path d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[0.6rem] text-zinc-700 mt-2 select-none">
          Respostas baseadas nas normas indexadas — consulte sempre o texto original.
        </p>
      </div>
    </div>
  )
}
