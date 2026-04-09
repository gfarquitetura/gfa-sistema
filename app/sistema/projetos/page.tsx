import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { ProjectsTable } from './_components/projects-table'
import { ProjectsFilters } from './_components/projects-filters'

export const metadata: Metadata = { title: 'Projetos — GFA Projetos' }

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{
    q?: string; status?: string; sort?: string; dir?: string; page?: string
  }>
}

export default async function ProjetosPage({ searchParams }: PageProps) {
  const [profile, sp] = await Promise.all([getProfile(), searchParams])

  const q      = sp.q ?? ''
  const status = sp.status ?? 'active'
  const sort   = (sp.sort ?? 'created_at') as 'name' | 'status' | 'deadline' | 'created_at'
  const asc    = sp.dir === 'asc'
  const page   = Math.max(1, parseInt(sp.page ?? '1', 10))
  const from   = (page - 1) * PAGE_SIZE

  const canManage = !!profile && hasPermission(profile.role, 'projects:manage')

  const supabase = await createClient()
  let query = supabase
    .from('projects')
    .select('*, clients(name)', { count: 'exact' })
    .order(sort, { ascending: asc })
    .range(from, from + PAGE_SIZE - 1)

  const VALID_STATUSES = ['proposal', 'active', 'paused', 'completed', 'cancelled'] as const
  type ValidStatus = typeof VALID_STATUSES[number]
  if (status !== 'all' && VALID_STATUSES.includes(status as ValidStatus)) {
    query = query.eq('status', status as ValidStatus)
  }
  if (q.length >= 2)    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%`)

  const { data: projects, count } = await query
  const total      = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-light text-zinc-100">Projetos</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {total} projeto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <Link
            href="/sistema/projetos/novo"
            className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-widest rounded hover:bg-white transition-colors"
          >
            Novo projeto
          </Link>
        )}
      </div>

      <div className="mb-5">
        <ProjectsFilters />
      </div>

      <ProjectsTable projects={(projects as any) ?? []} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-zinc-500">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/sistema/projetos?${new URLSearchParams({ ...sp, page: String(page - 1) }).toString()}`}
                className="px-3 py-1.5 text-xs border border-zinc-800 rounded text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/sistema/projetos?${new URLSearchParams({ ...sp, page: String(page + 1) }).toString()}`}
                className="px-3 py-1.5 text-xs border border-zinc-800 rounded text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
