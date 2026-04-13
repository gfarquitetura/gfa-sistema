import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/projects/format'
import { AddExpenseDialog } from '@/app/sistema/financeiro/_components/add-expense-dialog'
import type { ExpenseCategory, Project } from '@/lib/types/database'

type ExpenseRow = {
  id: string
  description: string
  amount: number
  expense_date: string
  category_id: string | null
}

interface ProjectFinancialsProps {
  projectId: string
  contractValue: number
  canManage: boolean
}

export async function ProjectFinancials({
  projectId,
  contractValue,
  canManage,
}: ProjectFinancialsProps) {
  const supabase = await createClient()

  const [expensesResult, categoriesResult, projectsResult] = await Promise.all([
    supabase
      .from('expenses')
      .select('id, description, amount, expense_date, category_id')
      .eq('project_id', projectId)
      .order('expense_date', { ascending: false })
      .limit(8),
    supabase.from('expense_categories').select('*').eq('is_active', true).order('name'),
    supabase.from('projects').select('id, code, name').in('status', ['proposal', 'active', 'paused']).order('code'),
  ])

  const expenses   = (expensesResult.data ?? []) as ExpenseRow[]
  const categories = (categoriesResult.data ?? []) as ExpenseCategory[]
  const projects   = (projectsResult.data ?? []) as Pick<Project, 'id' | 'code' | 'name'>[]

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  // Get full total (not just the 8 shown)
  const { data: totalResult } = await supabase
    .from('expenses')
    .select('amount')
    .eq('project_id', projectId)
  const fullTotal = (totalResult ?? []).reduce((s, e) => s + e.amount, 0)

  const margin     = contractValue - fullTotal
  const marginPct  = contractValue > 0 ? Math.round((margin / contractValue) * 100) : null

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500">Financeiro</h2>
        {canManage && (
          <AddExpenseDialog
            categories={categories}
            projects={projects}
            defaultProjectId={projectId}
          />
        )}
      </div>

      {/* P&L summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-[0.65rem] uppercase tracking-wider text-zinc-600">Receita (contrato)</p>
          <p className="text-base text-zinc-200 mt-1">{contractValue > 0 ? formatBRL(contractValue) : '—'}</p>
        </div>
        <div>
          <p className="text-[0.65rem] uppercase tracking-wider text-zinc-600">Despesas</p>
          <p className="text-base text-zinc-200 mt-1">{fullTotal > 0 ? formatBRL(fullTotal) : '—'}</p>
        </div>
        <div>
          <p className="text-[0.65rem] uppercase tracking-wider text-zinc-600">Margem</p>
          <p className={`text-base mt-1 ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {contractValue > 0 ? (
              <>
                {formatBRL(margin)}
                {marginPct !== null && (
                  <span className="text-xs ml-1">({marginPct}%)</span>
                )}
              </>
            ) : '—'}
          </p>
        </div>
      </div>

      {/* Margin bar */}
      {contractValue > 0 && fullTotal > 0 && (
        <div className="h-1.5 rounded-full bg-zinc-800 mb-6 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${margin >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`}
            style={{ width: `${Math.min(100, Math.max(0, (fullTotal / contractValue) * 100))}%` }}
          />
        </div>
      )}

      {/* Recent expenses */}
      {expenses.length > 0 ? (
        <>
          <ul className="flex flex-col divide-y divide-zinc-800 mb-3">
            {expenses.map((e) => (
              <li key={e.id} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-300">{e.description}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {(e.category_id ? categoryMap.get(e.category_id) : null) ?? 'Sem categoria'} ·{' '}
                    {new Date(e.expense_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <p className="text-sm text-zinc-300 shrink-0">{formatBRL(e.amount)}</p>
              </li>
            ))}
          </ul>
          <Link
            href={`/sistema/financeiro?project=${projectId}`}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Ver todas as despesas →
          </Link>
        </>
      ) : (
        <p className="text-sm text-zinc-600">Nenhuma despesa registrada.</p>
      )}
    </section>
  )
}
