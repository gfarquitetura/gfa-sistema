import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

// ── GET — list the caller's conversations ─────────────────────────────
export async function GET() {
  const profile = await getProfile()
  if (!profile) return new NextResponse('Não autorizado.', { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .eq('profile_id', profile.id)
    .order('updated_at', { ascending: false })

  if (error) return new NextResponse('Erro ao listar conversas.', { status: 500 })

  return NextResponse.json(data ?? [])
}

// ── POST — create a new empty conversation ────────────────────────────
export async function POST() {
  const profile = await getProfile()
  if (!profile) return new NextResponse('Não autorizado.', { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .insert({ profile_id: profile.id })
    .select('id, title, created_at, updated_at')
    .single()

  if (error || !data) {
    return new NextResponse('Erro ao criar conversa.', { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
