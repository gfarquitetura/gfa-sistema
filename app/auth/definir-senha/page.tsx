'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function DefinirSenhaPage() {
  const router  = useRouter()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState<string | null>(null)
  const [pending,   setPending]   = useState(false)
  const [done,      setDone]      = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setPending(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }

      setDone(true)
      setTimeout(() => router.replace('/sistema'), 1500)
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 38%, rgba(139,26,26,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center" style={{ gap: 3 }}>
            <div
              className="flex items-center justify-center overflow-hidden shrink-0"
              style={{ width: 54, height: 54, background: '#8B1A1A', borderRadius: 3 }}
            >
              <span className="text-white leading-none select-none"
                style={{ fontWeight: 900, fontSize: 50, marginLeft: -4 }}>G</span>
            </div>
            <span className="text-zinc-100 leading-none select-none"
              style={{ fontWeight: 900, fontSize: 48, letterSpacing: '-0.03em', lineHeight: 1 }}>FA</span>
          </div>
          <p className="uppercase text-zinc-500 mt-2 select-none"
            style={{ fontSize: '0.58rem', letterSpacing: '0.55em' }}>Projetos</p>
        </div>

        {/* Card */}
        <div className="border border-zinc-800 rounded-xl px-8 py-9 bg-zinc-900/40 backdrop-blur-sm">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500 text-center mb-2">
            Definir senha
          </p>
          <p className="text-xs text-zinc-500 text-center mb-7">
            Crie uma senha para acessar o sistema.
          </p>

          {done ? (
            <p className="text-sm text-emerald-400 text-center">
              Senha definida! Redirecionando…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <p role="alert" className="text-sm text-red-300 text-center bg-red-950/40 border border-red-900/60 rounded-lg py-2.5 px-3 -mt-1">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs uppercase tracking-widest text-zinc-500">
                  Nova senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="bg-zinc-950/80 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 text-sm placeholder:text-zinc-700 transition-colors focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-xs uppercase tracking-widest text-zinc-500">
                  Confirmar senha
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="bg-zinc-950/80 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 text-sm placeholder:text-zinc-700 transition-colors focus:outline-none focus:border-zinc-600"
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="btn-primary mt-2"
              >
                {pending ? 'Salvando…' : 'Definir senha e entrar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
