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
        <p role="alert" className="text-sm text-red-400 text-center -mt-1 bg-red-950/30 border border-red-900/50 rounded-lg py-2.5 px-3">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs uppercase tracking-widest text-zinc-500">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="bg-zinc-950/80 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 text-sm placeholder:text-zinc-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs uppercase tracking-widest text-zinc-500">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="bg-zinc-950/80 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-widest py-3.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-950/50"
      >
        {pending ? 'Aguarde…' : 'Entrar'}
      </button>
    </form>
  )
}
