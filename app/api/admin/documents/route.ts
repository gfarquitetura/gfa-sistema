import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractText } from 'unpdf'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { chunkText } from '@/lib/ai/chunker'

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

  // Aggregate: count chunks per source, take earliest created_at per source
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
    indexed_at: info.indexed_at,
  }))

  return NextResponse.json(sources)
}

// ── POST — upload PDF, chunk, embed, store ────────────────────────────
export async function POST(request: NextRequest) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return new NextResponse('Não autorizado.', { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return new NextResponse('Formulário inválido.', { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return new NextResponse('Arquivo não encontrado.', { status: 400 })
  }
  if (file.type !== 'application/pdf') {
    return new NextResponse('Apenas arquivos PDF são aceitos.', { status: 400 })
  }
  if (file.size > 20 * 1024 * 1024) {
    return new NextResponse('Arquivo muito grande (máx. 20 MB).', { status: 400 })
  }

  // Sanitise source name: use the original filename without path
  const sourceName = file.name.replace(/[^a-zA-Z0-9._\-() ]/g, '_').trim()

  // ── 1. Extract text from PDF ───────────────────────────────────────
  let text: string
  try {
    const buffer = await file.arrayBuffer()
    const { text: pages } = await extractText(new Uint8Array(buffer), { mergePages: true })
    text = Array.isArray(pages) ? pages.join('\n') : (pages as string)
  } catch {
    return new NextResponse('Erro ao ler o PDF.', { status: 422 })
  }

  if (!text || text.trim().length < 100) {
    return new NextResponse('PDF sem texto extraível (pode ser escaneado).', { status: 422 })
  }

  // ── 2. Chunk the text ─────────────────────────────────────────────
  const chunks = chunkText(text)
  if (chunks.length === 0) {
    return new NextResponse('Nenhum trecho válido encontrado no documento.', { status: 422 })
  }

  // ── 3. Embed all chunks (batch of up to 100 per API call) ─────────
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

  // ── 4. Remove existing chunks for this source (replace semantics) ──
  const supabase = await createClient()
  await supabase.from('ai_documents').delete().eq('source', sourceName)

  // ── 5. Insert new chunks ──────────────────────────────────────────
  const rows = chunks.map((chunk, i) => ({
    content:     chunk.content,
    embedding:   embeddings[i],
    source:      sourceName,
    section:     chunk.section || null,
    page_number: chunk.pageNumber,
  }))

  const { error: insertError } = await supabase.from('ai_documents').insert(rows)
  if (insertError) {
    return new NextResponse('Erro ao salvar os trechos.', { status: 500 })
  }

  return NextResponse.json({
    source:      sourceName,
    chunk_count: chunks.length,
  })
}
