'use client'

import { useActionState, useState } from 'react'
import { approveEntry, rejectEntry } from '@/app/actions/timesheets'
import { minutesToDisplay, formatDayBR } from '@/lib/timesheets/format'
import type { TimesheetEntry, Project } from '@/lib/types/database'

interface ApprovalRowProps {
  entry: TimesheetEntry
  project: Pick<Project, 'id' | 'code' | 'name'> | null
}

function ApproveButton({ entryId }: { entryId: string }) {
  const [state, dispatch, pending] = useActionState(approveEntry, undefined)

  return (
    <form action={dispatch}>
      <input type="hidden" name="entry_id" value={entryId} />
      <button
        type="submit"
        disabled={pending}
        className="px-3 py-1.5 text-xs border border-emerald-800 text-emerald-400 rounded hover:bg-emerald-950 transition-colors disabled:opacity-50"
      >
        {pending ? 'Aprovando…' : 'Aprovar'}
      </button>
      {state && 'error' in state && (
        <span className="text-xs text-red-400 ml-2">{state.error}</span>
      )}
    </form>
  )
}

function RejectForm({ entryId }: { entryId: string }) {
  const [open, setOpen] = useState(false)
  const [state, dispatch, pending] = useActionState(rejectEntry, undefined)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-xs border border-zinc-800 text-zinc-500 rounded hover:border-red-800 hover:text-red-400 transition-colors"
      >
        Rejeitar
      </button>
    )
  }

  return (
    <form action={dispatch} className="flex flex-col gap-2 mt-2">
      <input type="hidden" name="entry_id" value={entryId} />
      <textarea
        name="rejection_reason"
        placeholder="Motivo da rejeição…"
        rows={2}
        required
        minLength={3}
        className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-red-700 transition-colors resize-none"
      />
      {state && 'error' in state && (
        <p className="text-xs text-red-400">{state.error}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-3 py-1.5 text-xs border border-red-800 text-red-400 rounded hover:bg-red-950 transition-colors disabled:opacity-50"
        >
          {pending ? 'Rejeitando…' : 'Confirmar rejeição'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export function ApprovalRow({ entry, project }: ApprovalRowProps) {
  return (
    <div className="px-4 py-4 border-b border-zinc-800 last:border-b-0">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-500 font-mono">
              {formatDayBR(entry.entry_date)}
            </span>
            <span className="text-xs text-zinc-600">
              {project ? `${project.code} — ${project.name}` : 'Overhead / interno'}
            </span>
          </div>
          <p className="text-sm text-zinc-300">{entry.description}</p>
          {entry.notes && (
            <p className="text-xs text-zinc-600 mt-0.5">{entry.notes}</p>
          )}
          {entry.submitted_at && (
            <p className="text-[0.65rem] text-zinc-700 mt-1">
              Enviado em {new Date(entry.submitted_at).toLocaleString('pt-BR')}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <span className="text-sm text-zinc-300 font-mono">
            {minutesToDisplay(entry.minutes)}
          </span>
          <div className="flex items-center gap-2">
            <ApproveButton entryId={entry.id} />
            <RejectForm entryId={entry.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
