'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Conversation } from '@/lib/types/database'

interface Props {
  conversations:     Conversation[]
  activeId:          string
  onNewConversation: (conv: Conversation) => void
}

export function ConversationSidebar({ conversations, activeId, onNewConversation }: Props) {
  const router  = useRouter()
  const [creating, setCreating] = useState(false)

  async function handleNew() {
    setCreating(true)
    try {
      const res = await fetch('/api/chat/conversations', { method: 'POST' })
      if (res.ok) {
        const conv: Conversation = await res.json()
        onNewConversation(conv)
        router.push(`/sistema/assistente/${conv.id}`)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <aside className="flex flex-col w-60 h-full bg-zinc-900 border-r border-zinc-800 shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-[0.65rem] font-semibold text-zinc-500 uppercase tracking-widest">
          Conversas
        </span>
        <button
          onClick={handleNew}
          disabled={creating}
          className="w-6 h-6 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Nova conversa"
          title="Nova conversa"
        >
          {/* Plus icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="w-3.5 h-3.5" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Conversation list */}
      <nav className="flex-1 overflow-y-auto py-1">
        {conversations.length === 0 ? (
          <p className="text-xs text-zinc-600 px-4 py-4">Nenhuma conversa ainda.</p>
        ) : (
          conversations.map((conv) => {
            const active = conv.id === activeId
            return (
              <Link
                key={conv.id}
                href={`/sistema/assistente/${conv.id}`}
                className={`flex items-start gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {/* Chat bubble icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true">
                  <path d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                <span className="truncate leading-snug">{conv.title}</span>
              </Link>
            )
          })
        )}
      </nav>
    </aside>
  )
}
