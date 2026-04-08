import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { ClientsTable } from './_components/clients-table'
import { ClientsFilters } from './_components/clients-filters'
import { ExportButton } from './_components/export-button'

export const metadata: Metadata = {
  title: 'Clientes — GF Arquitetura',
}

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{
    q?: string
    status?: string
    sort?: string
    dir?: string
    page?: string
  }>
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const [profile, resolvedParams] = await Promise.all([
    getProfile(),
    searchParams,
  ])

  const canManage = !!profile && hasPermission(profile.role, 'clients:manage')

  const q      = resolvedParams.q ?? ''
  const status = resolvedParams.status ?? 'active'
  const sort   = (resolvedParams.sort ?? 'created_at') as 'name' | 'cidade' | 'created_at'
  const dir    = resolvedParams.dir === 'asc'
  const page   = Math.max(1, parseInt(resolvedParams.page ?? '1', 10))
  const from   = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order(sort, { ascending: dir })
    .range(from, from + PAGE_SIZE - 1)

  if (status === 'active')   query = query.eq('is_active', true)
  if (status === 'inactive') query = query.eq('is_active', false)
  if (q.length >= 2)         query = query.ilike('name', `%${q}%`)

  const { data: clients, count } = await query
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-light text-zinc-100">Clientes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {total} cliente{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton />
          {canManage && (
            <Link
              href="/sistema/clientes/novo"
              className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-widest rounded hover:bg-white transition-colors"
            >
              Novo cliente
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5">
        <ClientsFilters />
      </div>

      {/* Table */}
      <ClientsTable clients={clients ?? []} canManage={canManage} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-zinc-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/sistema/clientes?${new URLSearchParams({ ...resolvedParams, page: String(page - 1) }).toString()}`}
                className="px-3 py-1.5 text-xs border border-zinc-800 rounded text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/sistema/clientes?${new URLSearchParams({ ...resolvedParams, page: String(page + 1) }).toString()}`}
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
