import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractText } from 'unpdf'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/auth/get-profile'
import { chunkText } from '@/lib/ai/chunker'

// Allow up to 300 s on Vercel Pro (Hobby cap is 60 s)
export const maxDuration = 300

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── GET — list indexed document sources ──────────────────────────────
export async function GET() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return new NextResponse('Não autorizado.', { status: 401 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_documents')
    .select('source, created_at')
    .order('created_at', { ascending: false })

  if (error) return new NextResponse('Erro ao listar documentos.', { status: 500 })

  const map = new Map<string, { chunk_count: number; indexed_at: string }>()
  for (const row of data ?? []) {
    const existing = map.get(row.source)
    if (!existing) {
      map.set(row.source, { chunk_count: 1, indexed_at: row.created_at })
    } else {
      existing.chunk_count++
      if (row.created_at < existing.indexed_at) existing.indexed_at = row.created_at
    }
  }

  const sources = Array.from(map.entries()).map(([source, info]) => ({
    source,
    chunk_count: info.chunk_count,
    indexed_at:  info.indexed_at,
  }))

  return NextResponse.json(sources)
}

// ── POST — process PDF from Supabase Storage ──────────────────────────
// Body: { storagePath: string, sourceName: string }
// The file was already uploaded directly to storage by the browser.
export async function POST(request: NextRequest) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return new NextResponse('Não autorizado.', { status: 401 })
  }

  let body: { storagePath: string; sourceName: string }
  try {
    body = await request.json()
  } catch {
    return new NextResponse('JSON inválido.', { status: 400 })
  }

  const { storagePath, sourceName } = body
  if (!storagePath || !sourceName) {
    return new NextResponse('storagePath e sourceName são obrigatórios.', { status: 400 })
  }

  // ── 1. Download file from Supabase Storage (service-role, no size limit) ──
  const admin = createAdminClient()
  const { data: blob, error: downloadError } = await admin.storage
    .from('pdf-uploads')
    .download(storagePath)

  // Clean up storage regardless of outcome below
  const cleanup = () => admin.storage.from('pdf-uploads').remove([storagePath])

  if (downloadError || !blob) {
    await cleanup()
    return new NextResponse('Erro ao baixar o arquivo do armazenamento.', { status: 500 })
  }

  // ── 2. Extract text ───────────────────────────────────────────────
  let text: string
  try {
    const buffer = await blob.arrayBuffer()
    const { text: pages } = await extractText(new Uint8Array(buffer), { mergePages: true })
    text = Array.isArray(pages) ? pages.join('\n') : (pages as string)
  } catch {
    await cleanup()
    return new NextResponse('Erro ao ler o PDF.', { status: 422 })
  }

  await cleanup()

  if (!text || text.trim().length < 100) {
    return new NextResponse('PDF sem texto extraível (pode ser escaneado).', { status: 422 })
  }

  // ── 3. Chunk ──────────────────────────────────────────────────────
  const chunks = chunkText(text)
  if (chunks.length === 0) {
    return new NextResponse('Nenhum trecho válido encontrado no documento.', { status: 422 })
  }

  // ── 4. Embed (batches of 100) ─────────────────────────────────────
  const BATCH = 100
  const embeddings: number[][] = []

  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH).map((c) => c.content)
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    })
    for (const item of res.data) {
      embeddings.push(item.embedding)
    }
  }

  // ── 5. Replace existing chunks, insert new ones ───────────────────
  const supabase = await createClient()
  await supabase.from('ai_documents').delete().eq('source', sourceName)

  const rows = chunks.map((chunk, i) => ({
    content:     chunk.content,
    embedding:   embeddings[i],
    source:      sourceName,
    section:     chunk.section || null,
    page_number: chunk.pageNumber,
  }))

  const { error: insertError } = await supabase.from('ai_documents').insert(rows)
  if (insertError) {
    return new NextResponse(
      `Erro ao salvar os trechos: ${insertError.message} (code: ${insertError.code})`,
      { status: 500 }
    )
  }

  return NextResponse.json({ source: sourceName, chunk_count: chunks.length })
}
