import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'

export async function POST() {
  const supabase = await createClient()

  // Capture identity before signing out (session is cleared after)
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.auth.signOut()

  await logAudit({
    action:    'auth.logout',
    entity:    'auth',
    userId:    user?.id,
    userEmail: user?.email,
  })

  return NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    { status: 303 }
  )
}
