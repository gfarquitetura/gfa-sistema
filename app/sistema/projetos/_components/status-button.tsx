'use client'

import { useActionState } from 'react'
import { changeProjectStatus, type ProjectActionState } from '@/app/actions/projects'
import { STATUS_LABELS, VALID_TRANSITIONS } from '@/lib/projects/format'
import type { ProjectStatus } from '@/lib/types/database'

interface StatusButtonProps {
  projectId: string
  currentStatus: ProjectStatus
}

export function StatusButton({ projectId, currentStatus }: StatusButtonProps) {
  const [state, action, pending] = useActionState<ProjectActionState, FormData>(
    changeProjectStatus,
    undefined
  )

  const transitions = VALID_TRANSITIONS[currentStatus]
  if (transitions.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {transitions.map((next) => (
          <form key={next} action={action}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="status" value={next} />
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1.5 text-xs border border-zinc-700 rounded text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors disabled:opacity-40"
            >
              {pending ? '...' : `→ ${STATUS_LABELS[next]}`}
            </button>
          </form>
        ))}
      </div>
      {state && 'error' in state && (
        <p className="text-xs text-red-400">{state.error}</p>
      )}
    </div>
  )
}
