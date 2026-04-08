import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types/database'

/**
 * Returns the profile for the currently authenticated user,
 * or null if unauthenticated or the profile doesn't exist.
 *
 * Use this in Server Components and Server Actions — never in middleware
 * (middleware has its own lightweight auth check via getUser()).
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data ?? null
}
