'use client'

import { useState } from 'react'
import { ConversationSidebar } from './conversation-sidebar'
import { ChatPanel } from './chat-panel'
import type { Conversation, ConversationMessage } from '@/lib/types/database'
import type { Role } from '@/lib/types/database'

interface Props {
  convId:          string
  conversations:   Conversation[]
  initialMessages: ConversationMessage[]
  profileName:     string
  profileRole:     Role
}

/**
 * Client wrapper that holds the conversation list in state so both the
 * sidebar and the chat panel can mutate it without a full server re-fetch.
 */
export function AssistanteLayout({
  convId,
  conversations: initialConversations,
  initialMessages,
  profileName,
  profileRole,
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)

  function handleTitleUpdate(id: string, title: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    )
  }

  function handleNewConversation(conv: Conversation) {
    setConversations((prev) => [conv, ...prev])
  }

  return (
    // h-full fills the flex-1 main in SistemaLayout; overflow-hidden keeps
    // scrolling contained inside the messages panel, not the page.
    <div className="flex h-full overflow-hidden">
      <ConversationSidebar
        conversations={conversations}
        activeId={convId}
        onNewConversation={handleNewConversation}
      />
      <ChatPanel
        convId={convId}
        initialMessages={initialMessages}
        profileName={profileName}
        profileRole={profileRole}
        onTitleUpdate={(title) => handleTitleUpdate(convId, title)}
      />
    </div>
  )
}
