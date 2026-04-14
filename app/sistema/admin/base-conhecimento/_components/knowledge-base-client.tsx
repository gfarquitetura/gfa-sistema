'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { resetAIData, type AIActionState } from '@/app/actions/ai'

type DocSource = {
  source: string
  chunk_count: number
  indexed_at: string
}

type UploadStep =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }   // 0–100 %
  | { status: 'processing' }
  | { status: 'done'; source: string; chunks: number }
  | { status: 'error'; message: string }

export function KnowledgeBaseClient({ initialSources }: { initialSources: DocSource[] }) {
  const [sources, setSources]           = useState<DocSource[]>(initialSources)
  const [step, setStep]                 = useState<UploadStep>({ status: 'idle' })
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [deletingSource, setDeletingSource] = useState<string | null>(null)
  const [, startTransition]             = useTransition()
  const fileRef                         = useRef<HTMLInputElement>(null)

  // Reset AI data
  const [resetState, resetAction, resetting] = useActionState<AIActionState, FormData>(resetAIData, undefined)
  const [resetConfirm, setResetConfirm]      = useState('')
  const [showResetForm, setShowResetForm]    = useState(false)

  // Clear the sources list when reset succeeds
  useEffect(() => {
    if (resetState && 'success' in resetState) {
      setSources([])
      setShowResetForm(false)
    }
  }, [resetState])

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setStep({ status: 'uploading', progress: 0 })

    try {
      // ── Step 1: get signed upload URL ─────────────────────────────
      const urlRes = await fetch(
        `/api/admin/documents/upload-url?filename=${encodeURIComponent(file.name)}`
      )
      if (!urlRes.ok) {
        const msg = await urlRes.text()
        setStep({ status: 'error', message: msg })
        return
      }
      const { signedUrl, storagePath, sourceName } = await urlRes.json()

      // ── Step 2: upload directly to Supabase Storage (with progress) ──
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', 'application/pdf')

        xhr.upload.addEventListener('progress', (ev) => {
          if (ev.lengthComputable) {
            setStep({ status: 'uploading', progress: Math.round((ev.loaded / ev.total) * 100) })
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload falhou (${xhr.status})`))
        })
        xhr.addEventListener('error', () => reject(new Error('Erro de rede durante o upload.')))
        xhr.send(file)
      })

      // ── Step 3: trigger processing on the server ──────────────────
      setStep({ status: 'processing' })

      const processRes = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath, sourceName }),
      })

      if (!processRes.ok) {
        const msg = await processRes.text()
        setStep({ status: 'error', message: msg })
        return
      }

      const result: { source: string; chunk_count: number } = await processRes.json()
      setStep({ status: 'done', source: result.source, chunks: result.chunk_count })
      setSelectedFile(null)
      if (fileRef.current) fileRef.current.value = ''

      startTransition(() => {
        setSources((prev) => {
          const filtered = prev.filter((s) => s.source !== result.source)
          return [
            { source: result.source, chunk_count: result.chunk_count, indexed_at: new Date().toISOString() },
            ...filtered,
          ]
        })
      })
    } catch (err) {
      setStep({ status: 'error', message: err instanceof Error ? err.message : 'Erro inesperado.' })
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

  const busy = step.status === 'uploading' || step.status === 'processing'

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
              disabled={busy}
              onChange={(e) => {
                setStep({ status: 'idle' })
                setSelectedFile(e.target.files?.[0]?.name ?? null)
              }}
            />
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm text-zinc-400 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" aria-hidden="true">
                <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <span className="truncate">{selectedFile ?? 'Selecionar PDF…'}</span>
            </div>
          </label>

          <button type="submit" disabled={!selectedFile || busy} className="btn-primary whitespace-nowrap">
            {busy ? 'Aguarde…' : 'Indexar documento'}
          </button>
        </form>

        {/* Progress feedback */}
        {step.status === 'uploading' && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Enviando para armazenamento…</span>
              <span>{step.progress}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${step.progress}%`, background: '#8B1A1A' }}
              />
            </div>
          </div>
        )}

        {step.status === 'processing' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
            <span className="inline-block w-3 h-3 rounded-full animate-pulse" style={{ background: '#8B1A1A' }} />
            Extraindo texto e gerando embeddings… isso pode levar alguns minutos para arquivos grandes.
          </div>
        )}

        {step.status === 'done' && (
          <p className="mt-3 text-sm text-emerald-400">
            "{step.source}" indexado com sucesso — {step.chunks} trechos.
          </p>
        )}

        {step.status === 'error' && (
          <p className="mt-3 text-sm text-red-400">{step.message}</p>
        )}

        <p className="mt-3 text-xs text-zinc-600">
          Sem limite de tamanho. O arquivo é enviado direto ao armazenamento — PDFs grandes podem levar alguns minutos para processar.
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

      {/* ── Danger Zone ─────────────────────────────────────────────── */}
      <div className="border border-red-900/40 rounded-xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: '#C0392B' }}>
          Zona de perigo
        </h2>
        <p className="text-xs text-zinc-500 mb-4">
          Apaga permanentemente toda a base de conhecimento (chunks, embeddings, arquivos) e o histórico de conversas de todos os usuários.
          Esta ação não pode ser desfeita.
        </p>

        {!showResetForm ? (
          <button
            type="button"
            onClick={() => setShowResetForm(true)}
            className="text-sm px-4 py-2 rounded-lg border border-red-900/50 text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            Resetar dados de IA…
          </button>
        ) : (
          <form
            action={(fd) => {
              resetAction(fd)
              setResetConfirm('')
            }}
            className="space-y-3"
          >
            <p className="text-xs text-zinc-400">
              Digite <span className="font-mono font-semibold text-red-400">RESETAR</span> para confirmar:
            </p>
            <input
              name="confirmation"
              type="text"
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              autoComplete="off"
              placeholder="RESETAR"
              className="block w-64 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-800 font-mono"
            />

            {resetState && 'error' in resetState && (
              <p className="text-sm text-red-400">{resetState.error}</p>
            )}
            {resetState && 'success' in resetState && (
              <p className="text-sm text-emerald-400">
                {resetState.success} {resetState.details}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={resetConfirm !== 'RESETAR' || resetting}
                className="text-sm px-4 py-2 rounded-lg text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#8B1A1A' }}
              >
                {resetting ? 'Apagando…' : 'Confirmar reset'}
              </button>
              <button
                type="button"
                onClick={() => { setShowResetForm(false); setResetConfirm('') }}
                className="text-sm px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
