import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Cinzel } from 'next/font/google'

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '600', '700'] })

export const metadata: Metadata = {
  title: 'GFA Projetos — Sistema de Gestão',
  description: 'Sistema interno de gestão de projetos, clientes e financeiro para o escritório GFA Projetos.',
}

const BRAND     = '#8B1A1A'
const BRAND_DIM = '#3D0A0A'

// ── Icons ────────────────────────────────────────────────────────
function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}
function IconFolder() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m19.5 0v.243a2.25 2.25 0 0 1-2.182 2.25H4.432a2.25 2.25 0 0 1-2.182-2.25V6.75" />
    </svg>
  )
}
function IconCurrency() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  )
}
function IconChart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}
function IconBrain() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  )
}
function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

const FEATURES = [
  {
    icon: <IconUsers />,
    title: 'Clientes',
    description: 'Cadastro completo de PF e PJ. CPF/CNPJ, endereço por CEP, histórico de projetos e controle de status.',
    span: '',
  },
  {
    icon: <IconFolder />,
    title: 'Projetos',
    description: 'Pipeline completo desde proposta até conclusão. Código automático GFA-YYYY-NNN, prazos, contratos e equipe.',
    span: '',
  },
  {
    icon: <IconCurrency />,
    title: 'Financeiro',
    description: 'Despesas por projeto ou overhead, categorizadas, com visão de rentabilidade e margem em tempo real.',
    span: 'lg:col-span-2',
  },
  {
    icon: <IconClock />,
    title: 'Apontamentos',
    description: 'Registro semanal de horas com fluxo de aprovação gerencial e visão de produtividade por colaborador.',
    span: 'lg:col-span-2',
  },
  {
    icon: <IconChart />,
    title: 'Relatórios',
    description: 'Dashboards com rentabilidade por projeto, despesas por categoria e exportação CSV para contabilidade.',
    span: '',
  },
  {
    icon: <IconBrain />,
    title: 'Assistente IA',
    description: 'Consulte legislação, normas e documentos do escritório com linguagem natural — respostas com fontes citadas.',
    span: '',
  },
]

const STATS = [
  { value: '6',     label: 'Módulos integrados' },
  { value: 'RLS',   label: 'Segurança por linha' },
  { value: '100%',  label: 'Multi-usuário' },
  { value: 'IA',    label: 'Assistente legislativo' },
]

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  if (params.code || params.token_hash) {
    const qs = new URLSearchParams(
      Object.entries(params).filter((e): e is [string, string] => e[1] !== undefined)
    ).toString()
    redirect(`/auth/callback?${qs}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/40 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center overflow-hidden shrink-0"
              style={{ width: 28, height: 28, background: BRAND, borderRadius: 3 }}
            >
              <span className="text-white leading-none select-none" style={{ fontWeight: 900, fontSize: 24, marginLeft: -2 }}>G</span>
            </div>
            <span className="text-zinc-100 leading-none select-none" style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>FA</span>
            <span className="hidden sm:block text-zinc-600 text-[0.55rem] uppercase tracking-[0.4em] select-none ml-1">Projetos</span>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest text-white transition-all duration-150 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-red-800"
            style={{ background: BRAND }}
          >
            Acessar
          </Link>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16 overflow-hidden">

          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
            aria-hidden="true"
          />

          {/* Brand glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-225 h-150 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center top, ${BRAND}28 0%, transparent 60%)` }}
            aria-hidden="true"
          />

          {/* Thin horizontal architectural lines */}
          <div className="absolute inset-x-0 top-1/3 h-px bg-zinc-800/30" aria-hidden="true" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-zinc-800/20" aria-hidden="true" />

          {/* GFA watermark */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
            aria-hidden="true"
          >
            <span
              className={`${cinzel.className} font-bold text-zinc-900 leading-none`}
              style={{ fontSize: 'clamp(12rem, 30vw, 28rem)', letterSpacing: '-0.05em', opacity: 0.35 }}
            >
              GFA
            </span>
          </div>

          {/* Content */}
          <div className="relative text-center max-w-4xl mx-auto">

            {/* Pill */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-10 border"
              style={{ borderColor: `${BRAND}50`, background: `${BRAND}15`, color: '#fca5a5' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#fca5a5' }} />
              Sistema interno · GFA Projetos
            </div>

            <h1
              className={`${cinzel.className} text-zinc-50 mb-6`}
              style={{
                fontSize: 'clamp(2.4rem, 6vw, 5rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              Gestão completa<br />
              <span style={{ color: BRAND }}>do escritório</span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
              Clientes, projetos, financeiro, horas e inteligência artificial — tudo integrado em um único sistema.
            </p>

            <Link
              href="/login"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:gap-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-red-800"
              style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #6B1111 100%)`, boxShadow: `0 8px 32px ${BRAND}40` }}
            >
              Acessar o sistema
              <IconArrow />
            </Link>
          </div>

          {/* Bottom fade */}
          <div
            className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, #09090b)' }}
            aria-hidden="true"
          />
        </section>

        {/* ── Stats strip ────────────────────────────────────────── */}
        <div className="border-y border-zinc-800/50 bg-zinc-900/20 py-10 px-6">
          <div className="mx-auto max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p
                  className={`${cinzel.className} text-3xl font-semibold text-zinc-50 tabular-nums`}
                  style={{ letterSpacing: '-0.03em' }}
                >
                  {s.value}
                </p>
                <p className="text-[0.65rem] text-zinc-600 mt-1.5 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Features bento grid ────────────────────────────────── */}
        <section className="py-28 px-6" aria-labelledby="features-heading">
          <div className="mx-auto max-w-6xl">

            <div className="text-center mb-16">
              <p className="text-[0.6rem] uppercase tracking-[0.4em] text-zinc-600 mb-4">Módulos</p>
              <h2
                id="features-heading"
                className={`${cinzel.className} text-3xl sm:text-4xl text-zinc-50`}
                style={{ fontWeight: 600, letterSpacing: '-0.02em' }}
              >
                Tudo que o escritório precisa
              </h2>
              <div className="mt-4 mx-auto w-12 h-0.5" style={{ background: BRAND }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={`group relative border border-zinc-800 rounded-2xl p-6 bg-zinc-900/20 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all duration-200 overflow-hidden ${f.span}`}
                >
                  {/* Top accent line on hover */}
                  <div
                    className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: `linear-gradient(90deg, transparent, ${BRAND}, transparent)` }}
                    aria-hidden="true"
                  />

                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 shrink-0 transition-colors duration-200"
                    style={{ background: BRAND_DIM, color: '#f87171' }}
                  >
                    {f.icon}
                  </div>

                  <h3 className="text-sm font-semibold text-zinc-100 mb-2 tracking-wide">{f.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA banner ─────────────────────────────────────────── */}
        <section className="py-24 px-6 border-t border-zinc-800/40">
          <div className="mx-auto max-w-3xl">
            <div
              className="relative rounded-3xl border border-zinc-800 px-10 py-16 text-center overflow-hidden"
              style={{ background: 'linear-gradient(160deg, #111111 0%, #1a0505 100%)' }}
            >
              {/* Top shimmer */}
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent 0%, ${BRAND}90 50%, transparent 100%)` }}
                aria-hidden="true"
              />
              {/* Radial glow */}
              <div
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{ background: `radial-gradient(ellipse at 50% -10%, ${BRAND} 0%, transparent 55%)` }}
                aria-hidden="true"
              />

              <div className="relative">
                <p className="text-[0.6rem] uppercase tracking-[0.4em] text-zinc-600 mb-4">Acesso restrito</p>
                <h2
                  className={`${cinzel.className} text-2xl sm:text-3xl text-zinc-50 mb-4`}
                  style={{ fontWeight: 600, letterSpacing: '-0.02em' }}
                >
                  Pronto para começar?
                </h2>
                <p className="text-zinc-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                  Entre com as credenciais fornecidas pelo administrador do escritório.
                </p>
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:gap-4"
                  style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #6B1111 100%)`, boxShadow: `0 8px 32px ${BRAND}40` }}
                >
                  Acessar o sistema
                  <IconArrow />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/40 py-8 px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center overflow-hidden shrink-0"
              style={{ width: 20, height: 20, background: BRAND, borderRadius: 2 }}
            >
              <span className="text-white leading-none select-none" style={{ fontWeight: 900, fontSize: 16, marginLeft: -1 }}>G</span>
            </div>
            <span className="text-zinc-100 leading-none select-none" style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>FA</span>
            <span className="text-zinc-700 text-[0.5rem] uppercase tracking-[0.4em] select-none ml-1">Projetos</span>
          </div>
          <p className="text-xs text-zinc-700">© {new Date().getFullYear()} GFA Projetos · Sistema interno</p>
        </div>
      </footer>

    </div>
  )
}
