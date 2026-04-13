import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return new NextResponse('Não autorizado.', { status: 401 })
  }

  const filename = request.nextUrl.searchParams.get('filename')
  if (!filename) {
    return new NextResponse('filename obrigatório.', { status: 400 })
  }

  const sanitized = filename.replace(/[^a-zA-Z0-9._\-() ]/g, '_').trim()
  const storagePath = `${Date.now()}_${sanitized}`

  const admin = createAdminClient()

  // Ensure bucket exists (idempotent)
  await admin.storage.createBucket('pdf-uploads', {
    public: false,
    fileSizeLimit: 314572800, // 300 MB
    allowedMimeTypes: ['application/pdf'],
  })

  const { data, error } = await admin.storage
    .from('pdf-uploads')
    .createSignedUploadUrl(storagePath)

  if (error || !data) {
    return new NextResponse('Erro ao gerar URL de upload.', { status: 500 })
  }

  return NextResponse.json({
    signedUrl:   data.signedUrl,
    storagePath: data.path,
    sourceName:  sanitized,
  })
}
