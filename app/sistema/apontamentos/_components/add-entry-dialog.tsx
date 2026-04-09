'use client'

import { useState } from 'react'
import { EntryForm } from './entry-form'
import type { Project } from '@/lib/types/database'

interface AddEntryDialogProps {
  projects: Pick<Project, 'id' | 'code' | 'name'>[]
  defaultDate?: string
}

export function AddEntryDialog({ projects, defaultDate }: AddEntryDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-widest rounded hover:bg-white transition-colors"
      >
        Novo apontamento
      </button>

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-lg mx-4 p-7">
            <h2 className="text-sm font-medium text-zinc-100 mb-6">Registrar apontamento</h2>
            <EntryForm
              projects={projects}
              defaultDate={defaultDate}
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
