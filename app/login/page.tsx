import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Acesso — GFA Projetos',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logotipo */}
        <div className="text-center mb-10">
          <p className="text-[3.5rem] font-extralight leading-none tracking-tight text-zinc-100">
            GF
          </p>
          <p className="text-[0.6rem] uppercase tracking-[0.45em] text-zinc-500 mt-2">
            Projetos
          </p>
        </div>

        {/* Painel de login */}
        <div className="border border-zinc-800 rounded-lg px-8 py-9">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500 text-center mb-7">
            Acesso ao Sistema
          </p>
          <LoginForm />
        </div>

        <p className="text-center text-[0.65rem] text-zinc-700 mt-8 tracking-wide">
          © 2026 GFA Projetos
        </p>
      </div>
    </main>
  )
}
