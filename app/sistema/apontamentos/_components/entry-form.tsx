'use client'

import { useActionState, useEffect, useState } from 'react'
import { createEntry, updateEntry } from '@/app/actions/timesheets'
import { hoursInputValue } from '@/lib/timesheets/format'
import type { TimesheetEntry, Project } from '@/lib/types/database'

interface EntryFormProps {
  initialData?: TimesheetEntry
  projects: Pick<Project, 'id' | 'code' | 'name'>[]
  defaultDate?: string
  onSuccess?: () => void
}

export function EntryForm({ initialData, projects, defaultDate, onSuccess }: EntryFormProps) {
  const isEdit = !!initialData
  const action = isEdit ? updateEntry : createEntry
  const [state, dispatch, pending] = useActionState(action, undefined)
  const [hoursDisplay, setHoursDisplay] = useState(
    isEdit ? hoursInputValue(initialData.minutes) : ''
  )

  useEffect(() => {
    if (state && 'success' in state) onSuccess?.()
  }, [state, onSuccess])

  return (
    <form action={dispatch} className="flex flex-col gap-4">
      {isEdit && <input type="hidden" name="entry_id" value={initialData.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[0.65rem] uppercase tracking-wider text-zinc-500 mb-1">
            Data
          </label>
          <input
            type="date"
            name="entry_date"
            defaultValue={initialData?.entry_date ?? defaultDate ?? ''}
            required
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[0.65rem] uppercase tracking-wider text-zinc-500 mb-1">
            Horas
          </label>
          {/* Hidden field carries the raw display value for parseHoursInput on the server */}
          <input type="hidden" name="hours" value={hoursDisplay} />
          <input
            type="text"
            inputMode="decimal"
            placeholder="ex: 1.5 ou 1:30"
            value={hoursDisplay}
            onChange={(e) => setHoursDisplay(e.target.value)}
            required
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-[0.65rem] uppercase tracking-wider text-zinc-500 mb-1">
          Descrição
        </label>
        <input
          type="text"
          name="description"
          defaultValue={initialData?.description ?? ''}
          placeholder="O que foi feito?"
          required
          maxLength={500}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-[0.65rem] uppercase tracking-wider text-zinc-500 mb-1">
          Projeto
        </label>
        <select
          name="project_id"
          defaultValue={initialData?.project_id ?? ''}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
        >
          <option value="">— Overhead / interno —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[0.65rem] uppercase tracking-wider text-zinc-500 mb-1">
          Observações
        </label>
        <textarea
          name="notes"
          defaultValue={initialData?.notes ?? ''}
          rows={2}
          maxLength={1000}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors resize-none"
        />
      </div>

      {state && 'error' in state && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-widest rounded hover:bg-white transition-colors disabled:opacity-50"
      >
        {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar apontamento'}
      </button>
    </form>
  )
}
