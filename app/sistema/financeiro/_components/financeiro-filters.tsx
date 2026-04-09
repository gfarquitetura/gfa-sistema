'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { ExpenseCategory, Project } from '@/lib/types/database'

interface FinanceiroFiltersProps {
  categories: ExpenseCategory[]
  projects: Pick<Project, 'id' | 'code' | 'name'>[]
  total: number
}

export function FinanceiroFilters({ categories, projects, total }: FinanceiroFiltersProps) {
  const router = useRouter()
  const sp = useSearchParams()

  function navigate(key: string, value: string) {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/sistema/financeiro?${params.toString()}`)
  }

  return (
    <div className="flex gap-3 flex-wrap mb-5">
      <select
        defaultValue={sp.get('project') ?? ''}
        onChange={(e) => navigate('project', e.target.value)}
        className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-4 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
      >
        <option value="">Todos os projetos</option>
        <option value="__overhead__">Somente overhead</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
        ))}
      </select>

      <select
        defaultValue={sp.get('category') ?? ''}
        onChange={(e) => navigate('category', e.target.value)}
        className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-4 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
      >
        <option value="">Todas as categorias</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <p className="text-xs text-zinc-600 self-center ml-1">
        {total} despesa{total !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
