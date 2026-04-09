import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Acesso — GFA Projetos' }

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">

      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 38%, rgba(139,26,26,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm">

        {/* Brand mark */}
        <div className="flex flex-col items-center mb-10 gap-2">
          <div className="flex items-center gap-0">
            {/* Red block with G — mirrors the logo */}
            <div
              className="flex items-center justify-center rounded-sm"
              style={{ width: 52, height: 52, background: '#8B1A1A' }}
            >
              <span className="text-white font-bold text-3xl leading-none tracking-tight select-none">
                G
              </span>
            </div>
            <span
              className="font-bold text-zinc-100 leading-none tracking-tight select-none"
              style={{ fontSize: 52, lineHeight: 1 }}
            >
              FA
            </span>
          </div>
          <p className="text-[0.6rem] uppercase tracking-[0.5em] text-zinc-600">
            Projetos
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
