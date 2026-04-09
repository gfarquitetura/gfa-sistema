import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { formatBRL } from '@/lib/projects/format'
import { ExpensesTable } from './_components/expenses-table'
import { AddExpenseDialog } from './_components/add-expense-dialog'
import { FinanceiroFilters } from './_components/financeiro-filters'

export const metadata: Metadata = { title: 'Financeiro — GFA Projetos' }

const PAGE_SIZE = 30

interface PageProps {
  searchParams: Promise<{
    project?: string
    category?: string
    page?: string
  }>
}

export default async function FinanceiroPage({ searchParams }: PageProps) {
  const [profile, sp] = await Promise.all([getProfile(), searchParams])
  const canManage = !!profile && hasPermission(profile.role, 'finances:manage')

  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  const [categoriesResult, projectsResult] = await Promise.all([
    supabase.from('expense_categories').select('*').eq('is_active', true).order('name'),
    supabase.from('projects').select('id, code, name').in('status', ['proposal', 'active', 'paused']).order('code'),
  ])

  let query = supabase
    .from('expenses')
    .select('*, expense_categories(name), projects(id, code, name)', { count: 'exact' })
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (sp.project)  query = query.eq('project_id', sp.project)
  if (sp.category) query = query.eq('category_id', sp.category)

  const { data: expenses, count } = await query
  const total      = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Summary totals
  const { data: totals } = await supabase
    .from('expenses')
    .select('amount, project_id')

  const totalSpend    = (totals ?? []).reduce((s, e) => s + e.amount, 0)
  const projectSpend  = (totals ?? []).filter((e) => e.project_id).reduce((s, e) => s + e.amount, 0)
  const overheadSpend = totalSpend - projectSpend

  const categories = categoriesResult.data ?? []
  const projects   = projectsResult.data ?? []

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-light text-zinc-100">Financeiro</h1>
          <p className="text-sm text-zinc-500 mt-1">Despesas gerais e por projeto</p>
        </div>
        {canManage && (
          <AddExpenseDialog categories={categories} projects={projects} />
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-zinc-800 rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Total de despesas</p>
          <p className="text-2xl font-light text-zinc-100">{formatBRL(totalSpend)}</p>
        </div>
        <div className="border border-zinc-800 rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Alocado em projetos</p>
          <p className="text-2xl font-light text-zinc-100">{formatBRL(projectSpend)}</p>
        </div>
        <div className="border border-zinc-800 rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Overhead geral</p>
          <p className="text-2xl font-light text-zinc-100">{formatBRL(overheadSpend)}</p>
        </div>
      </div>

      {/* Filters */}
      <FinanceiroFilters categories={categories} projects={projects} total={total} />

      {/* Table */}
      <ExpensesTable
        expenses={(expenses as any) ?? []}
        categories={categories}
        projects={projects}
        canManage={canManage}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-xs text-zinc-500">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/sistema/financeiro?${new URLSearchParams({ ...sp, page: String(page - 1) }).toString()}`}
                className="px-3 py-1.5 text-xs border border-zinc-800 rounded text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                Anterior
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/sistema/financeiro?${new URLSearchParams({ ...sp, page: String(page + 1) }).toString()}`}
                className="px-3 py-1.5 text-xs border border-zinc-800 rounded text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
              >
                Próxima
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
