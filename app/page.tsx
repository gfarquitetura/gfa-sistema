import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'GFA Projetos — Gestão para Escritórios de Arquitetura',
  description: 'Sistema completo de gestão de clientes, projetos, financeiro e apontamentos de horas para escritórios de arquitetura.',
}

const BRAND = '#8B1A1A'
const BRAND_DIM = '#3D0A0A'

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function IconFolder() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
  )
}
function IconCurrency() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  )
}
function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}
function IconArrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}
function IconCheck() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

const features = [
  {
    icon: <IconUsers />,
    title: 'Gestão de Clientes',
    description: 'Cadastro de PF e PJ com CPF/CNPJ, endereço por CEP, histórico de projetos e controle de status ativo/inativo.',
  },
  {
    icon: <IconFolder />,
    title: 'Controle de Projetos',
    description: 'Pipeline desde proposta até conclusão. Código automático GFA-YYYY-NNN, prazos, contrato e equipe responsável.',
  },
  {
    icon: <IconCurrency />,
    title: 'Financeiro',
    description: 'Despesas por projeto ou overhead, categorizadas, com visão de rentabilidade e margem em tempo real.',
  },
  {
    icon: <IconClock />,
    title: 'Apontamentos de Horas',
    description: 'Registro semanal por projeto com fluxo de aprovação e relatório de produtividade por colaborador.',
  },
  {
    icon: <IconChart />,
    title: 'Relatórios Executivos',
    description: 'Dashboards com rentabilidade por projeto, despesas por categoria, horas por pessoa e exportação CSV.',
  },
  {
    icon: <IconShield />,
    title: 'Controle de Acesso',
    description: 'Perfis Admin, Gerente, Financeiro e Leitura. Cada nível visualiza e edita apenas o que precisa.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Cadastre clientes e projetos',
    body: 'Importe dados existentes ou comece do zero. O sistema gera códigos de projeto automaticamente por ano.',
  },
  {
    n: '02',
    title: 'Registre despesas e horas',
    body: 'Cada colaborador aponta suas horas semanalmente. Despesas são alocadas a projetos ou ao overhead do escritório.',
  },
  {
    n: '03',
    title: 'Acompanhe a rentabilidade',
    body: 'O painel executivo mostra margem por projeto, horas aprovadas no mês e a saúde financeira geral.',
  },
]

const benefits = [
  'Sem planilhas desatualizadas',
  'Acesso de qualquer dispositivo',
  'Dados seguros com Supabase',
  'Aprovação de horas rastreável',
  'Exportação CSV para contabilidade',
  'Permissões por função de cargo',
]

// ── Logo mark shared between nav and footer ───────────────────
function LogoMark({ size = 28 }: { size?: number }) {
  const fontSize = Math.round(size * 0.86)
  return (
    <div className="flex items-center" style={{ gap: 2 }}>
      <div
        className="flex items-center justify-center overflow-hidden shrink-0"
        style={{ width: size, height: size, background: BRAND, borderRadius: 2 }}
      >
        <span
          className="text-white leading-none select-none"
          style={{ fontWeight: 900, fontSize, marginLeft: -Math.round(size * 0.07) }}
        >
          G
        </span>
      </div>
      <span
        className="text-zinc-100 leading-none select-none"
        style={{ fontWeight: 900, fontSize: size - 2, letterSpacing: '-0.02em' }}
      >
        FA
      </span>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100"
      style={{ fontFamily: 'var(--font-jakarta), var(--font-geist-sans), sans-serif' }}
    >
      {/* ── Navbar ─────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/40">
        <nav className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark size={26} />
            <span
              className="text-zinc-600 text-[0.55rem] uppercase tracking-[0.4em] select-none hidden sm:block"
              style={{ marginTop: 1 }}
            >
              Projetos
            </span>
          </div>

          <Link
            href="/login"
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-red-900"
            style={{ background: BRAND }}
          >
            Acessar sistema
          </Link>
        </nav>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────── */}
        <section className="relative pt-40 pb-28 px-6 overflow-hidden">
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          {/* Brand glow from top */}
          <div
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center top, ${BRAND}35 0%, transparent 65%)`,
            }}
          />

          <div className="relative mx-auto max-w-4xl text-center">
            {/* Pill badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8 border"
              style={{ borderColor: `${BRAND}44`, background: `${BRAND}18`, color: '#ef9a9a' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#ef9a9a', boxShadow: '0 0 6px #ef9a9a' }}
              />
              Sistema exclusivo para escritórios de arquitetura
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold text-zinc-50 mb-6"
              style={{ lineHeight: 1.08, letterSpacing: '-0.035em' }}
            >
              Gestão completa para<br />
              <span style={{ color: BRAND }}>escritórios de arquitetura</span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10" style={{ lineHeight: 1.65 }}>
              Centralize clientes, projetos, finanças e apontamentos de horas.
              Veja a rentabilidade real de cada projeto — sem planilhas.
            </p>

            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-red-900"
              style={{ background: BRAND }}
            >
              Acessar o sistema
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                <IconArrow />
              </span>
            </Link>
          </div>
        </section>

        {/* ── Stats strip ────────────────────────────── */}
        <div className="border-y border-zinc-800/60 bg-zinc-900/20 py-12 px-6">
          <div className="mx-auto max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {([
              { value: '6', label: 'Módulos integrados' },
              { value: '100%', label: 'Multi-usuário' },
              { value: 'RLS', label: 'Segurança por linha' },
              { value: 'CSV', label: 'Exportação contábil' },
            ] as const).map((s) => (
              <div key={s.label}>
                <p
                  className="text-3xl font-extrabold text-zinc-50 tabular-nums"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  {s.value}
                </p>
                <p className="text-xs text-zinc-500 mt-1.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Features grid ──────────────────────────── */}
        <section className="py-28 px-6" aria-labelledby="features-heading">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-14">
              <p className="text-[0.65rem] uppercase tracking-[0.35em] text-zinc-600 mb-3">Módulos</p>
              <h2
                id="features-heading"
                className="text-3xl font-bold text-zinc-50"
                style={{ letterSpacing: '-0.025em' }}
              >
                Tudo que seu escritório precisa
              </h2>
              <p className="text-zinc-500 mt-3 max-w-md mx-auto text-sm leading-relaxed">
                Cada módulo foi desenhado para o fluxo real de um escritório de arquitetura.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group relative border border-zinc-800 rounded-2xl p-6 bg-zinc-900/25 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all duration-200 overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 w-0.5 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: BRAND }}
                  />
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-4 shrink-0"
                    style={{ background: BRAND_DIM, color: '#ef9a9a' }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────── */}
        <section className="py-24 px-6 border-t border-zinc-800/50" aria-labelledby="how-heading">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-14">
              <p className="text-[0.65rem] uppercase tracking-[0.35em] text-zinc-600 mb-3">Como funciona</p>
              <h2
                id="how-heading"
                className="text-3xl font-bold text-zinc-50"
                style={{ letterSpacing: '-0.025em' }}
              >
                Simples de usar, poderoso por dentro
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((s) => (
                <div key={s.n} className="flex items-start gap-5">
                  <span
                    className="text-5xl font-black leading-none shrink-0 tabular-nums"
                    style={{ color: `${BRAND}50`, letterSpacing: '-0.05em' }}
                  >
                    {s.n}
                  </span>
                  <div className="pt-1">
                    <h3 className="text-sm font-semibold text-zinc-100 mb-2">{s.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Benefits ───────────────────────────────── */}
        <section className="py-24 px-6 border-t border-zinc-800/50" aria-labelledby="benefits-heading">
          <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.35em] text-zinc-600 mb-3">Diferenciais</p>
              <h2
                id="benefits-heading"
                className="text-3xl font-bold text-zinc-50 mb-5"
                style={{ letterSpacing: '-0.025em' }}
              >
                Feito para a realidade do escritório
              </h2>
              <p className="text-zinc-400 leading-relaxed text-sm mb-8">
                Esqueça sistemas genéricos. O GFA Projetos foi construído especificamente para escritórios de arquitetura — com os campos, fluxos e relatórios que você realmente usa.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-85"
                style={{ background: BRAND }}
              >
                Acessar agora <IconArrow />
              </Link>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: BRAND_DIM, color: '#ef9a9a' }}
                  >
                    <IconCheck />
                  </span>
                  <span className="text-sm text-zinc-300">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────── */}
        <section className="py-24 px-6 border-t border-zinc-800/50">
          <div className="mx-auto max-w-2xl text-center">
            <div
              className="rounded-2xl border border-zinc-800 px-10 py-14 relative overflow-hidden"
              style={{ background: 'linear-gradient(160deg, #111111 0%, #1c0606 100%)' }}
            >
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${BRAND}80, transparent)` }}
              />
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{ background: `radial-gradient(ellipse at 50% -20%, ${BRAND} 0%, transparent 60%)` }}
              />
              <div className="relative">
                <h2
                  className="text-3xl font-bold text-zinc-50 mb-4"
                  style={{ letterSpacing: '-0.025em' }}
                >
                  Pronto para organizar seu escritório?
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                  Acesse com sua conta GFA Projetos e comece a gerir clientes, projetos e finanças em minutos.
                </p>
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-red-900"
                  style={{ background: BRAND }}
                >
                  Acessar o sistema
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                    <IconArrow />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="border-t border-zinc-800/50 py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LogoMark size={20} />
            <span className="text-zinc-600 text-[0.55rem] uppercase tracking-[0.35em] select-none">Projetos</span>
          </div>
          <p className="text-xs text-zinc-700">Sistema interno — GF Arquitetura</p>
        </div>
      </footer>
    </div>
  )
}
