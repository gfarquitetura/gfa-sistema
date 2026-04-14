import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

// ── GET — fetch a single conversation (ownership-checked) ─────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getProfile()
  if (!profile) return new NextResponse('Não autorizado.', { status: 401 })

  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .eq('id', id)
    .eq('profile_id', profile.id)
    .single()

  if (error || !data) {
    return new NextResponse('Conversa não encontrada.', { status: 404 })
  }

  return NextResponse.json(data)
}
