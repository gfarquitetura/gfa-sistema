'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export function ChatAssistant() {
  const [open, setOpen]           = useState(false)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [streaming, setStreaming] = useState(false)
  const endRef                    = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Focus input when panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function sendMessage() {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    // Add empty assistant message that will be filled as stream arrives
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10),
        }),
      })

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => 'Erro desconhecido.')
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: `⚠ ${errText}` },
        ])
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let done = false
      while (!done) {
        const { value, done: d } = await reader.read()
        done = d
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + chunk },
            ]
          })
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: '⚠ Erro de conexão. Tente novamente.' },
      ])
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir assistente de normas"
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer"
        style={{ background: '#8B1A1A' }}
      >
        {open ? (
          /* X icon */
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white" aria-hidden="true">
            <path d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          /* Brain / sparkle icon */
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white" aria-hidden="true">
            <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-5 z-50 flex flex-col w-[22rem] max-h-[70vh] rounded-xl border border-zinc-800 shadow-2xl overflow-hidden"
          style={{ background: '#18181b' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800"
            style={{ background: '#3D0A0A' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-300 shrink-0" aria-hidden="true">
              <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-100 leading-tight">Assistente de Normas</p>
              <p className="text-[0.6rem] text-red-300/70 truncate">GFA Projetos · NBR · ANVISA · Prefeitura</p>
            </div>
            <Link
              href="/sistema/assistente"
              className="text-[0.6rem] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer whitespace-nowrap"
              title="Abrir chat completo"
            >
              Tela cheia ↗
            </Link>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                className="text-[0.6rem] text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                aria-label="Limpar histórico"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.length === 0 && (
              <div className="text-zinc-600 text-xs text-center mt-4 leading-relaxed">
                Pergunte sobre NBR 9050, NBR 15575,<br />
                ANVISA RDC-50, recuos, gabaritos…
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'bg-zinc-800 text-zinc-200'
                  }`}
                >
                  {msg.content}
                  {streaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' && (
                    <span className="inline-block w-1.5 h-4 bg-zinc-400 animate-pulse" />
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800 px-3 py-3 flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Digite sua pergunta…"
              disabled={streaming}
              className="flex-1 resize-none bg-zinc-800 text-zinc-100 placeholder-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 max-h-28 overflow-y-auto"
              style={{ lineHeight: '1.5' }}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#8B1A1A' }}
              aria-label="Enviar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white" aria-hidden="true">
                <path d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
