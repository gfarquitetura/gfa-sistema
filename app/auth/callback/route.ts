import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Handles Supabase auth redirects:
 *   - Invite links  (type=invite)
 *   - Password reset links (type=recovery)
 *   - Magic links   (type=magiclink)
 *
 * Supabase appends ?token_hash=xxx&type=yyy to whatever redirectTo we configure.
 * After verifying the token we redirect to the password-setup page (invite/recovery)
 * or straight to the app (other types).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as 'invite' | 'recovery' | 'magiclink' | 'email' | null
  const code       = searchParams.get('code')   // PKCE flow
  const next       = searchParams.get('next') ?? '/sistema'

  const supabase = await createClient()

  // ── PKCE code exchange (some Supabase versions) ───────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // ── Token hash exchange (invite / recovery / magiclink) ───────────
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      // Invite and recovery: user must set / change their password
      if (type === 'invite' || type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/definir-senha`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Fallback: invalid or expired link
  return NextResponse.redirect(`${origin}/login?erro=link_invalido`)
}
