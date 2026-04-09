'use client'

import { useState } from 'react'
import { ExpenseForm } from './expense-form'
import type { ExpenseCategory, Project } from '@/lib/types/database'

interface AddExpenseDialogProps {
  categories: ExpenseCategory[]
  projects: Pick<Project, 'id' | 'code' | 'name'>[]
  defaultProjectId?: string
}

export function AddExpenseDialog({ categories, projects, defaultProjectId }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary"
      >
        Nova despesa
      </button>

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-lg mx-4 p-7">
            <h2 className="text-sm font-medium text-zinc-100 mb-6">Registrar despesa</h2>
            <ExpenseForm
              categories={categories}
              projects={projects}
              defaultProjectId={defaultProjectId}
              onSuccess={() => setOpen(false)}
            />
            <button
              onClick={() => setOpen(false)}
              className="mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
