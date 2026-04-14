import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'

/**
 * Entry point — redirects to the most recent conversation.
 * Creates the first conversation if the user has none.
 */
export default async function AssistentePage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()

  const { data: latest } = await supabase
    .from('conversations')
    .select('id')
    .eq('profile_id', profile.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (latest) redirect(`/sistema/assistente/${latest.id}`)

  // First visit — create an empty conversation
  const { data: newConv } = await supabase
    .from('conversations')
    .insert({ profile_id: profile.id })
    .select('id')
    .single()

  if (newConv) redirect(`/sistema/assistente/${newConv.id}`)

  redirect('/sistema')
}
