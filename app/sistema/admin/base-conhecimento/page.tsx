import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'
import { KnowledgeBaseClient } from './_components/knowledge-base-client'

export default async function BaseConhecimentoPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') redirect('/sistema')

  const supabase = await createClient()

  // Fetch ai_documents grouped by source
  const { data } = await supabase
    .from('ai_documents')
    .select('source, created_at')
    .order('created_at', { ascending: false })

  // Aggregate client-side-style
  const map = new Map<string, { chunk_count: number; indexed_at: string }>()
  for (const row of data ?? []) {
    const existing = map.get(row.source)
    if (!existing) {
      map.set(row.source, { chunk_count: 1, indexed_at: row.created_at })
    } else {
      existing.chunk_count++
    }
  }

  const sources = Array.from(map.entries()).map(([source, info]) => ({
    source,
    chunk_count: info.chunk_count,
    indexed_at: info.indexed_at,
  }))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold text-zinc-100 mb-1">Base de Conhecimento</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Faça upload de PDFs (normas, manuais, regulamentos) para treinar o assistente de IA.
      </p>
      <KnowledgeBaseClient initialSources={sources} />
    </div>
  )
}
