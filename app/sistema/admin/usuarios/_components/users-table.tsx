'use client'

import { useActionState, useState } from 'react'
import { changeUserRole, resendInvite, toggleUserStatus, deleteUser, type UserActionState } from '@/app/actions/users'
import { ROLE_LABELS } from '@/lib/auth/roles'
import type { Profile, Role } from '@/lib/types/database'

const ROLES: Role[] = ['admin', 'financial', 'manager', 'readonly']

// ============================================================
// Role badge
// ============================================================
const ROLE_COLORS: Record<Role, string> = {
  admin:     'bg-violet-900/50 text-violet-300 border-violet-800',
  financial: 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
  manager:   'bg-blue-900/50 text-blue-300 border-blue-800',
  readonly:  'bg-zinc-800 text-zinc-400 border-zinc-700',
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`px-2 py-0.5 text-[0.65rem] uppercase tracking-wider rounded border ${ROLE_COLORS[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  )
}

// ============================================================
// Single row with inline role change and status toggle
// ============================================================
function UserRow({ user, currentUserId }: { user: Profile; currentUserId: string }) {
  const [roleState, roleAction, rolePending] = useActionState<UserActionState, FormData>(
    changeUserRole,
    undefined
  )
  const [statusState, statusAction, statusPending] = useActionState<UserActionState, FormData>(
    toggleUserStatus,
    undefined
  )
  const [inviteState, inviteAction, invitePending] = useActionState<UserActionState, FormData>(
    resendInvite,
    undefined
  )
  const [deleteState, deleteAction, deletePending] = useActionState<UserActionState, FormData>(
    deleteUser,
    undefined
  )
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const isSelf = user.id === currentUserId

  return (
    <tr className="border-t border-zinc-800 group">
      <td className="px-4 py-3.5">
        <p className="text-sm text-zinc-200">{user.full_name || '—'}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
      </td>

      {/* Role select */}
      <td className="px-4 py-3.5">
        <form action={roleAction}>
          <input type="hidden" name="user_id" value={user.id} />
          <select
            name="role"
            defaultValue={user.role}
            disabled={rolePending || isSelf}
            onChange={(e) => {
              e.currentTarget.form?.requestSubmit()
            }}
            className="bg-transparent border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="bg-zinc-900">
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          {roleState && 'error' in roleState && (
            <p className="text-xs text-red-400 mt-1">{roleState.error}</p>
          )}
        </form>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <span
          className={`px-2 py-0.5 text-[0.65rem] uppercase tracking-wider rounded border ${
            user.is_active
              ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800'
              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
          }`}
        >
          {user.is_active ? 'Ativo' : 'Inativo'}
        </span>
      </td>

      {/* Joined */}
      <td className="px-4 py-3.5 text-xs text-zinc-500">
        {new Date(user.created_at).toLocaleDateString('pt-BR')}
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5 text-right">
        <div className="flex flex-col items-end gap-1.5">
          {/* Resend invite */}
          <form action={inviteAction}>
            <input type="hidden" name="email" value={user.email} />
            <button
              type="submit"
              disabled={invitePending}
              className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {invitePending ? '...' : 'Reenviar convite'}
            </button>
          </form>
          {inviteState && 'success' in inviteState && (
            <p className="text-xs text-emerald-400">{inviteState.success}</p>
          )}
          {inviteState && 'error' in inviteState && (
            <p className="text-xs text-red-400">{inviteState.error}</p>
          )}

          {/* Activate / deactivate */}
          {!isSelf && (
            <form action={statusAction}>
              <input type="hidden" name="user_id" value={user.id} />
              <input type="hidden" name="is_active" value={String(user.is_active)} />
              <button
                type="submit"
                disabled={statusPending}
                className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-40 cursor-pointer"
              >
                {statusPending ? '...' : user.is_active ? 'Desativar' : 'Reativar'}
              </button>
              {statusState && 'error' in statusState && (
                <p className="text-xs text-red-400 mt-1">{statusState.error}</p>
              )}
            </form>
          )}

          {/* Delete */}
          {!isSelf && (
            confirmingDelete ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-zinc-400">Confirmar?</span>
                <form action={deleteAction} onSubmit={() => setConfirmingDelete(false)}>
                  <input type="hidden" name="user_id" value={user.id} />
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="text-xs text-red-500 hover:text-red-400 transition-colors disabled:opacity-40 cursor-pointer font-medium"
                  >
                    Sim, remover
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-xs text-zinc-600 hover:text-red-500 transition-colors cursor-pointer"
              >
                Remover
              </button>
            )
          )}
          {deleteState && 'error' in deleteState && (
            <p className="text-xs text-red-400">{deleteState.error}</p>
          )}
        </div>
      </td>
    </tr>
  )
}

// ============================================================
// Full table
// ============================================================
interface UsersTableProps {
  users: Profile[]
  currentUserId: string
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">
        Nenhum usuário cadastrado.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left">
        <thead className="bg-zinc-950">
          <tr>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">Usuário</th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">Perfil</th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">Status</th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">Desde</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="bg-zinc-900">
          {users.map((user) => (
            <UserRow key={user.id} user={user} currentUserId={currentUserId} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
