'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'

export type LoginState = { error: string } | undefined

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'E-mail ou senha incorretos.' }
  }

  // Pass user identity explicitly — the session cookie hasn't reached the
  // browser yet, so auth.getUser() inside logAudit would return null.
  await logAudit({
    action: 'auth.login',
    entity: 'auth',
    userId: data.user.id,
    userEmail: data.user.email,
  })

  redirect('/sistema')
}
