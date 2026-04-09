'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { Profile, Project } from '@/lib/types/database'

interface AprovacoesFiltrosProps {
  profiles: Pick<Profile, 'id' | 'full_name' | 'email'>[]
  projects: Pick<Project, 'id' | 'code' | 'name'>[]
  total: number
}

export function AprovacoesFiltros({ profiles, projects, total }: AprovacoesFiltrosProps) {
  const router = useRouter()
  const sp = useSearchParams()

  function navigate(key: string, value: string) {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/sistema/apontamentos/aprovacoes?${params.toString()}`)
  }

  return (
    <div className="flex gap-3 flex-wrap mb-5">
      <select
        defaultValue={sp.get('person') ?? ''}
        onChange={(e) => navigate('person', e.target.value)}
        className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-4 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
      >
        <option value="">Todos os colaboradores</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
        ))}
      </select>

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

      <p className="text-xs text-zinc-600 self-center ml-1">
        {total} apontamento{total !== 1 ? 's' : ''} aguardando
      </p>
    </div>
  )
}
