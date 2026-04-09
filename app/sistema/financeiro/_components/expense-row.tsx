'use client'

import { useActionState, useState } from 'react'
import { deleteExpense, type FinanceActionState } from '@/app/actions/finances'
import { formatBRL, formatDateBR } from '@/lib/projects/format'
import { ExpenseForm } from './expense-form'
import type { Expense, ExpenseCategory, Project } from '@/lib/types/database'

type ExpenseWithRels = Expense & {
  expense_categories: Pick<ExpenseCategory, 'name'> | null
  projects: Pick<Project, 'id' | 'code' | 'name'> | null
}

interface ExpenseRowProps {
  expense: ExpenseWithRels
  categories: ExpenseCategory[]
  projects: Pick<Project, 'id' | 'code' | 'name'>[]
  canManage: boolean
}

function DeleteButton({ expenseId, projectId }: { expenseId: string; projectId: string | null }) {
  const [, action, pending] = useActionState<FinanceActionState, FormData>(deleteExpense, undefined)
  return (
    <form action={action}>
      <input type="hidden" name="expense_id" value={expenseId} />
      <input type="hidden" name="project_id" value={projectId ?? ''} />
      <button
        type="submit" disabled={pending}
        className="text-xs text-zinc-700 hover:text-red-400 transition-colors disabled:opacity-40"
        onClick={(e) => { if (!confirm('Excluir esta despesa?')) e.preventDefault() }}
      >
        {pending ? '...' : 'Excluir'}
      </button>
    </form>
  )
}

export function ExpenseRow({ expense, categories, projects, canManage }: ExpenseRowProps) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <tr className="border-t border-zinc-800 bg-zinc-900/80">
        <td colSpan={6} className="px-4 py-4">
          <ExpenseForm
            initialData={expense}
            categories={categories}
            projects={projects}
            onSuccess={() => setEditing(false)}
          />
          <button
            onClick={() => setEditing(false)}
            className="mt-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Cancelar
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors">
      <td className="px-4 py-3.5 text-xs text-zinc-500 whitespace-nowrap">
        {formatDateBR(expense.expense_date)}
      </td>
      <td className="px-4 py-3.5">
        <p className="text-sm text-zinc-200">{expense.description}</p>
        {expense.notes && <p className="text-xs text-zinc-600 mt-0.5">{expense.notes}</p>}
      </td>
      <td className="px-4 py-3.5 text-xs text-zinc-400 hidden sm:table-cell">
        {expense.expense_categories?.name ?? <span className="text-zinc-700">—</span>}
      </td>
      <td className="px-4 py-3.5 text-xs text-zinc-400 hidden md:table-cell">
        {expense.projects
          ? <span className="font-mono">{expense.projects.code}</span>
          : <span className="text-zinc-700">Overhead</span>
        }
      </td>
      <td className="px-4 py-3.5 text-sm text-zinc-200 text-right whitespace-nowrap">
        {formatBRL(expense.amount)}
      </td>
      {canManage && (
        <td className="px-4 py-3.5 text-right">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              Editar
            </button>
            <DeleteButton expenseId={expense.id} projectId={expense.project_id} />
          </div>
        </td>
      )}
    </tr>
  )
}
