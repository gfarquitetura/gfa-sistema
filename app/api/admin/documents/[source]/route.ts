import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return new NextResponse('Não autorizado.', { status: 401 })
  }

  const { source } = await params
  const sourceName = decodeURIComponent(source)

  const supabase = await createClient()
  const { error } = await supabase
    .from('ai_documents')
    .delete()
    .eq('source', sourceName)

  if (error) {
    return new NextResponse('Erro ao remover documento.', { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
