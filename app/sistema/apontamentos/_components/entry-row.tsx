'use client'

import { useActionState, useState } from 'react'
import { deleteEntry, submitEntries } from '@/app/actions/timesheets'
import { minutesToDisplay, ENTRY_STATUS_LABELS, ENTRY_STATUS_COLORS } from '@/lib/timesheets/format'
import { EntryForm } from './entry-form'
import type { TimesheetEntry, Project } from '@/lib/types/database'

interface EntryRowProps {
  entry: TimesheetEntry
  project: Pick<Project, 'id' | 'code' | 'name'> | null
  projects: Pick<Project, 'id' | 'code' | 'name'>[]
  canEdit: boolean
}

function DeleteButton({ entryId }: { entryId: string }) {
  const [state, dispatch, pending] = useActionState(deleteEntry, undefined)
  const [confirm, setConfirm] = useState(false)

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
      >
        Excluir
      </button>
    )
  }

  return (
    <form action={dispatch} className="flex items-center gap-2">
      <input type="hidden" name="entry_id" value={entryId} />
      <span className="text-xs text-zinc-500">Confirmar?</span>
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
      >
        {pending ? 'Excluindo…' : 'Sim'}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        Não
      </button>
      {state && 'error' in state && (
        <span className="text-xs text-red-400">{state.error}</span>
      )}
    </form>
  )
}

function SubmitOneButton({ entryId }: { entryId: string }) {
  const [state, dispatch, pending] = useActionState(submitEntries, undefined)

  return (
    <form action={dispatch}>
      <input type="hidden" name="entry_ids" value={entryId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors disabled:opacity-50"
      >
        {pending ? 'Enviando…' : 'Enviar'}
      </button>
      {state && 'error' in state && (
        <span className="text-xs text-red-400 ml-2">{state.error}</span>
      )}
    </form>
  )
}

export function EntryRow({ entry, project, projects, canEdit }: EntryRowProps) {
  const [editing, setEditing] = useState(false)
  const isDraft = entry.status === 'draft'
  const statusColor = ENTRY_STATUS_COLORS[entry.status] ?? ENTRY_STATUS_COLORS.draft

  if (editing && canEdit && isDraft) {
    return (
      <div className="px-4 py-4 border-b border-zinc-800 last:border-b-0 bg-zinc-950">
        <EntryForm
          initialData={entry}
          projects={projects}
          onSuccess={() => setEditing(false)}
        />
        <button
          onClick={() => setEditing(false)}
          className="mt-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-b border-zinc-800 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider rounded border ${statusColor}`}>
              {ENTRY_STATUS_LABELS[entry.status]}
            </span>
            <span className="text-xs text-zinc-500">
              {project ? `${project.code} — ${project.name}` : 'Overhead / interno'}
            </span>
          </div>
          <p className="text-sm text-zinc-300 truncate">{entry.description}</p>
          {entry.notes && (
            <p className="text-xs text-zinc-600 mt-0.5 truncate">{entry.notes}</p>
          )}
          {entry.status === 'rejected' && entry.rejection_reason && (
            <p className="text-xs text-red-400 mt-1">
              Motivo: {entry.rejection_reason}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-sm text-zinc-300 font-mono">
            {minutesToDisplay(entry.minutes)}
          </span>

          {canEdit && isDraft && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                Editar
              </button>
              <SubmitOneButton entryId={entry.id} />
              <DeleteButton entryId={entry.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
