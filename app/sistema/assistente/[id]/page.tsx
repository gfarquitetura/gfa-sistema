import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'
import { AssistanteLayout } from '../_components/assistente-layout'
import type { Conversation, ConversationMessage } from '@/lib/types/database'

export default async function AssistanteConvPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const { id } = await params
  const supabase = await createClient()

  // Fetch all needed data in parallel
  const [convResult, messagesResult, listResult] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('id', id)
      .eq('profile_id', profile.id)
      .single(),
    supabase
      .from('conversation_messages')
      .select('id, role, content, sources, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('conversations')
      .select('id, title, updated_at')
      .eq('profile_id', profile.id)
      .order('updated_at', { ascending: false }),
  ])

  // Conversation not found or doesn't belong to this user
  if (!convResult.data) redirect('/sistema/assistente')

  return (
    <AssistanteLayout
      convId={id}
      conversations={(listResult.data ?? []) as Conversation[]}
      initialMessages={(messagesResult.data ?? []) as ConversationMessage[]}
      profileName={profile.full_name}
      profileRole={profile.role}
    />
  )
}
