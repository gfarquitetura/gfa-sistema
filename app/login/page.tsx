import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Acesso — GFA Projetos' }

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">

      {/* Subtle radial glow behind card */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(59,130,246,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-semibold tracking-tight text-zinc-100">GFA</span>
            <span className="text-4xl font-extralight tracking-tight text-zinc-500">Projetos</span>
          </div>
          <p className="text-[0.6rem] uppercase tracking-[0.45em] text-zinc-600">
            Sistema de Gestão
          </p>
        </div>

        {/* Card */}
        <div className="border border-zinc-800 rounded-xl px-8 py-9 bg-zinc-900/40 backdrop-blur-sm">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500 text-center mb-7">
            Acesso ao Sistema
          </p>
          <LoginForm />
        </div>

        <p className="text-center text-[0.6rem] text-zinc-700 mt-8 tracking-wider">
          © {new Date().getFullYear()} GFA Projetos · Todos os direitos reservados
        </p>
      </div>
    </main>
  )
}
