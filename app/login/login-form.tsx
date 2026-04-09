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
        <p role="alert" className="text-sm text-red-300 text-center bg-red-950/40 border border-red-900/60 rounded-lg py-2.5 px-3 -mt-1">
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
          className="bg-zinc-950/80 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 text-sm placeholder:text-zinc-700 transition-colors"
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
          className="bg-zinc-950/80 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 text-sm transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary mt-2"
      >
        {pending ? 'Aguarde…' : 'Entrar'}
      </button>
    </form>
  )
}
