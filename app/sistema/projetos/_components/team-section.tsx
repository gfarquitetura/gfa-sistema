'use client'

import { useActionState } from 'react'
import { addProjectMember, removeProjectMember, type ProjectActionState } from '@/app/actions/projects'
import type { ProjectMember, Profile } from '@/lib/types/database'

type MemberWithProfile = ProjectMember & {
  profiles: Pick<Profile, 'full_name' | 'email'> | null
}

interface TeamSectionProps {
  projectId: string
  members: MemberWithProfile[]
  allStaff: Pick<Profile, 'id' | 'full_name' | 'email'>[]
  canManage: boolean
}

const MEMBER_ROLE_LABELS = {
  responsible:  'Responsável',
  collaborator: 'Colaborador',
}

function RemoveMemberButton({ projectId, memberId }: { projectId: string; memberId: string }) {
  const [, action, pending] = useActionState<ProjectActionState, FormData>(
    removeProjectMember,
    undefined
  )
  return (
    <form action={action}>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="member_id" value={memberId} />
      <button
        type="submit" disabled={pending}
        className="text-xs text-zinc-700 hover:text-red-400 transition-colors disabled:opacity-40"
      >
        {pending ? '...' : 'Remover'}
      </button>
    </form>
  )
}

function AddMemberForm({
  projectId,
  allStaff,
  existingIds,
}: {
  projectId: string
  allStaff: Pick<Profile, 'id' | 'full_name' | 'email'>[]
  existingIds: string[]
}) {
  const [state, action, pending] = useActionState<ProjectActionState, FormData>(
    addProjectMember,
    undefined
  )
  const available = allStaff.filter((s) => !existingIds.includes(s.id))

  if (available.length === 0) return null

  return (
    <form action={action} className="flex gap-2 mt-4">
      <input type="hidden" name="project_id" value={projectId} />
      <select
        name="profile_id"
        required
        className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
      >
        <option value="">Selecionar membro...</option>
        {available.map((s) => (
          <option key={s.id} value={s.id} className="bg-zinc-900">
            {s.full_name || s.email}
          </option>
        ))}
      </select>
      <select
        name="member_role"
        defaultValue="collaborator"
        className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
      >
        <option value="collaborator" className="bg-zinc-900">Colaborador</option>
        <option value="responsible" className="bg-zinc-900">Responsável</option>
      </select>
      <button
        type="submit" disabled={pending}
        className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs rounded hover:bg-zinc-700 transition-colors disabled:opacity-40"
      >
        {pending ? '...' : 'Adicionar'}
      </button>
      {state && 'error' in state && (
        <p className="text-xs text-red-400 self-center">{state.error}</p>
      )}
    </form>
  )
}

export function TeamSection({ projectId, members, allStaff, canManage }: TeamSectionProps) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Equipe</h2>
      {members.length === 0 ? (
        <p className="text-sm text-zinc-600">Nenhum membro atribuído.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-800">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm text-zinc-300">{m.profiles?.full_name || m.profiles?.email || '—'}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{MEMBER_ROLE_LABELS[m.member_role]}</p>
              </div>
              {canManage && (
                <RemoveMemberButton projectId={projectId} memberId={m.id} />
              )}
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <AddMemberForm
          projectId={projectId}
          allStaff={allStaff}
          existingIds={members.map((m) => m.profile_id)}
        />
      )}
    </section>
  )
}
