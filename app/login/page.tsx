import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Acesso — GFA Projetos' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { erro } = await searchParams
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
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center" style={{ gap: 3 }}>
            {/* Red block — G large and fills it */}
            <div
              className="flex items-center justify-center overflow-hidden shrink-0"
              style={{ width: 54, height: 54, background: '#8B1A1A', borderRadius: 3 }}
            >
              <span
                className="text-white leading-none select-none"
                style={{ fontWeight: 900, fontSize: 50, marginLeft: -4 }}
              >G</span>
            </div>
            {/* FA — same height, black weight */}
            <span
              className="text-zinc-100 leading-none select-none"
              style={{ fontWeight: 900, fontSize: 48, letterSpacing: '-0.03em', lineHeight: 1 }}
            >FA</span>
          </div>
          <p
            className="uppercase text-zinc-500 mt-2 select-none"
            style={{ fontSize: '0.58rem', letterSpacing: '0.55em' }}
          >
            Projetos
          </p>
        </div>

        {/* Card */}
        <div className="border border-zinc-800 rounded-xl px-8 py-9 bg-zinc-900/40 backdrop-blur-sm">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-zinc-500 text-center mb-7">
            Acesso ao Sistema
          </p>
          {erro === 'link_invalido' && (
            <p className="text-sm text-red-300 text-center bg-red-950/40 border border-red-900/60 rounded-lg py-2.5 px-3 mb-5">
              Este link expirou ou já foi utilizado. Solicite um novo acesso ao administrador.
            </p>
          )}
          <LoginForm />
        </div>

        <p className="text-center text-[0.6rem] text-zinc-700 mt-8 tracking-wider">
          © {new Date().getFullYear()} GFA Projetos · Todos os direitos reservados
        </p>
      </div>
    </main>
  )
}
