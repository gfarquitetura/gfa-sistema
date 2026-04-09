'use client'

import { ExpenseRow } from './expense-row'
import type { Expense, ExpenseCategory, Project } from '@/lib/types/database'

type ExpenseWithRels = Expense & {
  expense_categories: Pick<ExpenseCategory, 'name'> | null
  projects: Pick<Project, 'id' | 'code' | 'name'> | null
}

interface ExpensesTableProps {
  expenses: ExpenseWithRels[]
  categories: ExpenseCategory[]
  projects: Pick<Project, 'id' | 'code' | 'name'>[]
  canManage: boolean
}

export function ExpensesTable({ expenses, categories, projects, canManage }: ExpensesTableProps) {
  if (expenses.length === 0) {
    return <p className="text-sm text-zinc-500 py-12 text-center">Nenhuma despesa encontrada.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left">
        <thead className="bg-zinc-950">
          <tr>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">Data</th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">Descrição</th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium hidden sm:table-cell">Categoria</th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium hidden md:table-cell">Projeto</th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium text-right">Valor</th>
            {canManage && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="bg-zinc-900">
          {expenses.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              categories={categories}
              projects={projects}
              canManage={canManage}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
