'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatBRL, formatDateBR, STATUS_LABELS, STATUS_COLORS } from '@/lib/projects/format'
import type { Project, Client } from '@/lib/types/database'

type ProjectWithClient = Project & { clients: Pick<Client, 'name'> | null }

interface ProjectsTableProps {
  projects: ProjectWithClient[]
}

type SortKey = 'name' | 'status' | 'deadline' | 'created_at'

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const router = useRouter()
  const params = useSearchParams()

  const sort = (params.get('sort') as SortKey) ?? 'created_at'
  const dir  = params.get('dir') ?? 'desc'

  function toggleSort(key: SortKey) {
    const next = new URLSearchParams(params.toString())
    if (sort === key) {
      next.set('dir', dir === 'asc' ? 'desc' : 'asc')
    } else {
      next.set('sort', key)
      next.set('dir', 'asc')
    }
    router.push(`/sistema/projetos?${next.toString()}`)
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sort !== col) return <span className="text-zinc-700 ml-1">↕</span>
    return <span className="text-zinc-400 ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
  }

  if (projects.length === 0) {
    return <p className="text-sm text-zinc-500 py-12 text-center">Nenhum projeto encontrado.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left">
        <thead className="bg-zinc-950">
          <tr>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">
              Código
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium cursor-pointer select-none hover:text-zinc-300"
              onClick={() => toggleSort('name')}
            >
              Nome <SortIcon col="name" />
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium hidden md:table-cell">
              Cliente
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium cursor-pointer select-none hover:text-zinc-300"
              onClick={() => toggleSort('status')}
            >
              Status <SortIcon col="status" />
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium hidden lg:table-cell">
              Valor
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium hidden lg:table-cell cursor-pointer select-none hover:text-zinc-300"
              onClick={() => toggleSort('deadline')}
            >
              Prazo <SortIcon col="deadline" />
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="bg-zinc-900 divide-y divide-zinc-800">
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
              <td className="px-4 py-3.5">
                <span className="text-xs font-mono text-zinc-500">{p.code}</span>
              </td>
              <td className="px-4 py-3.5">
                <Link
                  href={`/sistema/projetos/${p.id}`}
                  className="text-sm text-zinc-200 hover:text-white transition-colors font-medium"
                >
                  {p.name}
                </Link>
              </td>
              <td className="px-4 py-3.5 text-xs text-zinc-400 hidden md:table-cell">
                {p.clients?.name ?? '—'}
              </td>
              <td className="px-4 py-3.5">
                <span className={`px-2 py-0.5 text-[0.65rem] uppercase tracking-wider rounded border ${STATUS_COLORS[p.status]}`}>
                  {STATUS_LABELS[p.status]}
                </span>
              </td>
              <td className="px-4 py-3.5 text-xs text-zinc-400 hidden lg:table-cell">
                {p.contract_value > 0 ? formatBRL(p.contract_value) : '—'}
              </td>
              <td className="px-4 py-3.5 text-xs text-zinc-400 hidden lg:table-cell">
                {formatDateBR(p.deadline)}
              </td>
              <td className="px-4 py-3.5 text-right">
                <Link
                  href={`/sistema/projetos/${p.id}`}
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
