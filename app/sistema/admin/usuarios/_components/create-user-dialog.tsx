'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createUser, type UserActionState } from '@/app/actions/users'
import { ROLE_LABELS } from '@/lib/auth/roles'
import type { Role } from '@/lib/types/database'

const ROLES: Role[] = ['admin', 'financial', 'manager', 'readonly']

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<UserActionState, FormData>(
    createUser,
    undefined
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state && 'success' in state) {
      formRef.current?.reset()
      setOpen(false)
    }
  }, [state])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-widest rounded hover:bg-white transition-colors"
      >
        Convidar usuário
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-md mx-4 p-7">
            <h2
              id="dialog-title"
              className="text-sm font-medium text-zinc-100 mb-6"
            >
              Convidar usuário
            </h2>

            <form ref={formRef} action={action} className="flex flex-col gap-4">
              {state && 'error' in state && (
                <p role="alert" className="text-sm text-red-400">
                  {state.error}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="full_name"
                  className="text-xs uppercase tracking-widest text-zinc-500"
                >
                  Nome completo
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-xs uppercase tracking-widest text-zinc-500"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="role"
                  className="text-xs uppercase tracking-widest text-zinc-500"
                >
                  Perfil de acesso
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  defaultValue="readonly"
                  className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 py-2 bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-widest rounded hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {pending ? 'Enviando...' : 'Convidar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
