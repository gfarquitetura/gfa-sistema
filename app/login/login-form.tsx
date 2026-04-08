'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/app/actions/auth'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  )

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error && (
        <p role="alert" className="text-sm text-red-400 text-center -mt-1">
          {state.error}
        </p>
      )}

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
          autoComplete="email"
          className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded px-4 py-3 text-sm placeholder:text-zinc-700 focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-xs uppercase tracking-widest text-zinc-500"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-widest py-3.5 rounded hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? 'Aguarde...' : 'Entrar'}
      </button>
    </form>
  )
}
