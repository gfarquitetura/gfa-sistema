'use client'

import { useRef, useState, useTransition } from 'react'

type DocSource = {
  source: string
  chunk_count: number
  indexed_at: string
}

export function KnowledgeBaseClient({ initialSources }: { initialSources: DocSource[] }) {
  const [sources, setSources]       = useState<DocSource[]>(initialSources)
  const [uploading, setUploading]   = useState(false)
  const [uploadMsg, setUploadMsg]   = useState<{ ok: boolean; text: string } | null>(null)
  const [deletingSource, setDeletingSource] = useState<string | null>(null)
  const [, startTransition]         = useTransition()
  const fileRef                     = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadMsg(null)

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/admin/documents', { method: 'POST', body: fd })
      if (res.ok) {
        const data: { source: string; chunk_count: number } = await res.json()
        setUploadMsg({ ok: true, text: `"${data.source}" indexado — ${data.chunk_count} trechos.` })
        // refresh list
        startTransition(() => {
          setSources((prev) => {
            const filtered = prev.filter((s) => s.source !== data.source)
            return [{ source: data.source, chunk_count: data.chunk_count, indexed_at: new Date().toISOString() }, ...filtered]
          })
        })
        if (fileRef.current) fileRef.current.value = ''
      } else {
        const msg = await res.text()
        setUploadMsg({ ok: false, text: msg || 'Erro ao processar o PDF.' })
      }
    } catch {
      setUploadMsg({ ok: false, text: 'Erro de conexão. Tente novamente.' })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(source: string) {
    if (!window.confirm(`Remover "${source}" da base de conhecimento?`)) return
    setDeletingSource(source)
    try {
      const res = await fetch(`/api/admin/documents/${encodeURIComponent(source)}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        setSources((prev) => prev.filter((s) => s.source !== source))
      }
    } finally {
      setDeletingSource(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Upload form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-4">
          Adicionar documento
        </h2>
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3 items-start">
          <label className="flex-1 cursor-pointer">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              disabled={uploading}
              onChange={() => setUploadMsg(null)}
            />
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm text-zinc-400 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" aria-hidden="true">
                <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <span id="file-label">
                {fileRef.current?.files?.[0]?.name ?? 'Selecionar PDF…'}
              </span>
            </div>
          </label>

          <button
            type="submit"
            disabled={uploading}
            className="btn-primary whitespace-nowrap"
          >
            {uploading ? 'Processando…' : 'Indexar documento'}
          </button>
        </form>

        {uploadMsg && (
          <p className={`mt-3 text-sm ${uploadMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
            {uploadMsg.text}
          </p>
        )}

        <p className="mt-3 text-xs text-zinc-600">
          Tamanho máximo: 20 MB. O texto existente para o mesmo arquivo será substituído.
        </p>
      </div>

      {/* Document list */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-3">
          Documentos indexados ({sources.length})
        </h2>

        {sources.length === 0 ? (
          <p className="text-sm text-zinc-600">Nenhum documento na base de conhecimento.</p>
        ) : (
          <div className="space-y-2">
            {sources.map((doc) => (
              <div
                key={doc.source}
                className="flex items-center gap-4 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg"
              >
                {/* PDF icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true">
                  <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{doc.source}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {doc.chunk_count} trechos &middot; indexado em{' '}
                    {new Date(doc.indexed_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(doc.source)}
                  disabled={deletingSource === doc.source}
                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                  aria-label={`Remover ${doc.source}`}
                >
                  {deletingSource === doc.source ? 'Removendo…' : 'Remover'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
