'use client'

import { useActionState, useState } from 'react'
import { createExpense, updateExpense, type FinanceActionState } from '@/app/actions/finances'
import { parseBRLtoCents, centsToInputValue } from '@/lib/projects/format'
import type { Expense, ExpenseCategory, Project } from '@/lib/types/database'

interface ExpenseFormProps {
  initialData?: Expense
  categories: ExpenseCategory[]
  projects: Pick<Project, 'id' | 'code' | 'name'>[]
  defaultProjectId?: string
  onSuccess?: () => void
}

export function ExpenseForm({
  initialData,
  categories,
  projects,
  defaultProjectId,
  onSuccess,
}: ExpenseFormProps) {
  const isEdit = !!initialData
  const action = isEdit ? updateExpense : createExpense

  const [state, formAction, pending] = useActionState<FinanceActionState, FormData>(
    action,
    undefined
  )
  const [amountDisplay, setAmountDisplay] = useState(
    initialData ? centsToInputValue(initialData.amount) : ''
  )

  // Close on success
  if (state && 'success' in state && onSuccess) onSuccess()

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isEdit && <input type="hidden" name="expense_id" value={initialData.id} />}
      {/* carries parsed cents */}
      <input type="hidden" name="amount" value={parseBRLtoCents(amountDisplay)} />

      {state && 'error' in state && (
        <p role="alert" className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded px-4 py-3">
          {state.error}
        </p>
      )}

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-xs uppercase tracking-widest text-zinc-500">
          Descrição <span className="text-red-500">*</span>
        </label>
        <input
          id="description" name="description" type="text" required
          defaultValue={initialData?.description}
          className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      {/* Amount + Date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount_display" className="text-xs uppercase tracking-widest text-zinc-500">
            Valor (R$) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">R$</span>
            <input
              id="amount_display"
              type="text"
              inputMode="decimal"
              value={amountDisplay}
              onChange={(e) => setAmountDisplay(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder="0,00"
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="expense_date" className="text-xs uppercase tracking-widest text-zinc-500">
            Data <span className="text-red-500">*</span>
          </label>
          <input
            id="expense_date" name="expense_date" type="date" required
            defaultValue={initialData?.expense_date ?? new Date().toISOString().slice(0, 10)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
      </div>

      {/* Category + Project */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category_id" className="text-xs uppercase tracking-widest text-zinc-500">
            Categoria
          </label>
          <select
            id="category_id" name="category_id"
            defaultValue={initialData?.category_id ?? ''}
            className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
          >
            <option value="">— Geral —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="project_id" className="text-xs uppercase tracking-widest text-zinc-500">
            Projeto
          </label>
          <select
            id="project_id" name="project_id"
            defaultValue={initialData?.project_id ?? defaultProjectId ?? ''}
            className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
          >
            <option value="">— Overhead —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-zinc-900">
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-xs uppercase tracking-widest text-zinc-500">
          Observações
        </label>
        <textarea
          id="notes" name="notes" rows={2}
          defaultValue={initialData?.notes ?? ''}
          className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors resize-none"
        />
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button
          type="submit" disabled={pending}
          className="px-6 py-2.5 bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-widest rounded hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Registrar despesa'}
        </button>
      </div>
    </form>
  )
}
