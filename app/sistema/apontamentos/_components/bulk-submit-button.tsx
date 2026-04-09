'use client'

import { useActionState } from 'react'
import { submitEntries } from '@/app/actions/timesheets'

interface BulkSubmitButtonProps {
  draftIds: string[]
}

export function BulkSubmitButton({ draftIds }: BulkSubmitButtonProps) {
  const [state, dispatch, pending] = useActionState(submitEntries, undefined)

  return (
    <form action={dispatch} className="mb-6">
      <input type="hidden" name="entry_ids" value={draftIds.join(',')} />
      <div className="flex items-center gap-4 p-4 border border-zinc-800 rounded-lg bg-zinc-950">
        <div className="flex-1">
          <p className="text-sm text-zinc-300">
            {draftIds.length} rascunho{draftIds.length !== 1 ? 's' : ''} prontos para envio
          </p>
          {state && 'success' in state && (
            <p className="text-xs text-emerald-400 mt-1">{state.success}</p>
          )}
          {state && 'error' in state && (
            <p className="text-xs text-red-400 mt-1">{state.error}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 border border-yellow-800 text-yellow-400 text-xs uppercase tracking-widest rounded hover:bg-yellow-950 transition-colors disabled:opacity-50"
        >
          {pending ? 'Enviando…' : `Enviar todos (${draftIds.length})`}
        </button>
      </div>
    </form>
  )
}
