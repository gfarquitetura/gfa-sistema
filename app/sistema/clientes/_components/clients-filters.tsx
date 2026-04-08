'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function ClientsFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const q      = params.get('q') ?? ''
  const status = params.get('status') ?? 'active'

  function push(updates: Record<string, string>) {
    const next = new URLSearchParams(params.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v)
      else next.delete(k)
    })
    next.delete('page') // reset to page 1 on filter change
    router.push(`/sistema/clientes?${next.toString()}`)
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    if (timerRef.current) clearTimeout(timerRef.current)
    const value = e.target.value
    timerRef.current = setTimeout(() => push({ q: value }), 300)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        type="search"
        defaultValue={q}
        onChange={handleSearch}
        placeholder="Buscar por nome..."
        className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2 text-sm w-60 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
      />

      <div className="flex rounded overflow-hidden border border-zinc-800">
        {[
          { value: 'active',   label: 'Ativos' },
          { value: 'inactive', label: 'Inativos' },
          { value: 'all',      label: 'Todos' },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => push({ status: opt.value })}
            className={`px-3 py-2 text-xs transition-colors ${
              status === opt.value
                ? 'bg-zinc-700 text-zinc-100'
                : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
