'use client'

import { useSearchParams } from 'next/navigation'

export function ExportButton() {
  const params = useSearchParams()

  function buildUrl() {
    const ep = new URLSearchParams()
    const q      = params.get('q')
    const status = params.get('status') ?? 'active'
    if (q) ep.set('q', q)
    ep.set('status', status)
    return `/api/clientes/export?${ep.toString()}`
  }

  return (
    <a
      href={buildUrl()}
      download
      className="px-3 py-2 text-xs text-zinc-500 border border-zinc-800 rounded hover:text-zinc-200 hover:border-zinc-600 transition-colors"
    >
      Exportar Excel
    </a>
  )
}
