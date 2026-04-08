'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { STATUS_LABELS } from '@/lib/projects/format'
import type { ProjectStatus } from '@/lib/types/database'

const STATUSES: { value: string; label: string }[] = [
  { value: 'all',       label: 'Todos' },
  { value: 'proposal',  label: STATUS_LABELS.proposal },
  { value: 'active',    label: STATUS_LABELS.active },
  { value: 'paused',    label: STATUS_LABELS.paused },
  { value: 'completed', label: STATUS_LABELS.completed },
  { value: 'cancelled', label: STATUS_LABELS.cancelled },
]

export function ProjectsFilters() {
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
    next.delete('page')
    router.push(`/sistema/projetos?${next.toString()}`)
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
        placeholder="Buscar por nome ou código..."
        className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2 text-sm w-64 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
      />
      <div className="flex rounded overflow-hidden border border-zinc-800">
        {STATUSES.map((opt) => (
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
