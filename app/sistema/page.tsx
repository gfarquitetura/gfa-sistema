import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { formatBRL, STATUS_LABELS, STATUS_COLORS, formatDateBR } from '@/lib/projects/format'
import { minutesToDisplay } from '@/lib/timesheets/format'
import type { ProjectStatus } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Painel — GFA Projetos' }

export default async function SistemaPage() {
  const profile = await getProfile()
  const supabase = await createClient()

  const canSeeFinances   = !!profile && hasPermission(profile.role, 'finances:read')
  const canSeeTimesheets = !!profile && hasPermission(profile.role, 'timesheets:approve')

  // ── Core queries (always loaded) ──────────────────────────
  const [
    { count: totalClients },
    { count: activeClients },
    { count: totalProjects },
    { data: projectsByStatus },
    { data: recentProjects },
    { data: recentClients },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('status, contract_value'),
    supabase
      .from('projects')
      .select('id, code, name, status, contract_value, deadline')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('clients')
      .select('id, name, cidade, estado, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // ── Financial queries (role-gated) ────────────────────────
  let totalExpenses     = 0
  let projectExpenseMap = new Map<string, number>()
  let activeProjects: { id: string; code: string; name: string; contract_value: number }[] = []
  let pendingApprovals  = 0

  if (canSeeFinances) {
    const [expensesResult, activeProjectsResult] = await Promise.all([
      supabase.from('expenses').select('project_id, amount'),
      supabase
        .from('projects')
        .select('id, code, name, contract_value')
        .eq('status', 'active')
        .order('contract_value', { ascending: false })
        .limit(8),
    ])

    const expenses = expensesResult.data ?? []
    totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    for (const e of expenses) {
      if (e.project_id) {
        projectExpenseMap.set(e.project_id, (projectExpenseMap.get(e.project_id) ?? 0) + e.amount)
      }
    }
    activeProjects = activeProjectsResult.data ?? []
  }

  if (canSeeTimesheets) {
    const { count } = await supabase
      .from('timesheet_entries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')
    pendingApprovals = count ?? 0
  }

  // ── Timesheet hours this month ────────────────────────────
  let teamHours: { profile_id: string; minutes: number }[] = []
  let profileMap = new Map<string, string>()

  if (canSeeTimesheets) {
    const today = new Date()
    const monthStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1))
      .toISOString()
      .slice(0, 10)

    const [hoursResult, profilesResult] = await Promise.all([
      supabase
        .from('timesheet_entries')
        .select('profile_id, minutes')
        .eq('status', 'approved')
        .gte('entry_date', monthStart),
      supabase.from('profiles').select('id, full_name, email').eq('is_active', true),
    ])

    // Aggregate minutes per person
    const minutesByProfile = new Map<string, number>()
    for (const e of hoursResult.data ?? []) {
      minutesByProfile.set(e.profile_id, (minutesByProfile.get(e.profile_id) ?? 0) + e.minutes)
    }
    teamHours = Array.from(minutesByProfile.entries())
      .map(([profile_id, minutes]) => ({ profile_id, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 8)

    for (const p of profilesResult.data ?? []) {
      profileMap.set(p.id, p.full_name || p.email)
    }
  }

  // ── Derived stats ─────────────────────────────────────────
  const statusCounts = (projectsByStatus ?? []).reduce<Record<string, number>>(
    (acc, p) => { acc[p.status] = (acc[p.status] ?? 0) + 1; return acc },
    {}
  )
  const totalContractValue = (projectsByStatus ?? []).reduce(
    (sum, p) => sum + (p.contract_value ?? 0), 0
  )
  const activeContractValue = (projectsByStatus ?? [])
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + (p.contract_value ?? 0), 0)

  // Profitability: active projects sorted by margin %
  const profitability = activeProjects
    .map((p) => {
      const expenses = projectExpenseMap.get(p.id) ?? 0
      const margin = p.contract_value - expenses
      const pct = p.contract_value > 0 ? Math.round((margin / p.contract_value) * 100) : null
      return { ...p, expenses, margin, pct }
    })
    .sort((a, b) => (b.pct ?? -999) - (a.pct ?? -999))

  const overallMargin = activeContractValue - (
    activeProjects.reduce((s, p) => s + (projectExpenseMap.get(p.id) ?? 0), 0)
  )

  const firstName = profile?.full_name?.split(' ')[0] ?? 'bem-vindo'
  const STATUS_ORDER: ProjectStatus[] = ['proposal', 'active', 'paused', 'completed', 'cancelled']
  const maxTeamMinutes = teamHours[0]?.minutes ?? 1

  const BRAND = '#8B1A1A'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="p-8 max-w-6xl">

      {/* Greeting */}
      <div className="mb-8 pb-6 border-b border-zinc-800/60">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">{greeting}, {firstName}</h1>
        <p className="text-sm text-zinc-500 mt-1 capitalize">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {([
          {
            href: '/sistema/clientes',
            label: 'Clientes ativos',
            value: String(activeClients ?? 0),
            sub: `de ${totalClients ?? 0} cadastrados`,
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            ),
          },
          {
            href: '/sistema/projetos',
            label: 'Projetos ativos',
            value: String(statusCounts['active'] ?? 0),
            sub: `de ${totalProjects ?? 0} no total`,
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m19.5 0v.243a2.25 2.25 0 0 1-2.182 2.25H4.432a2.25 2.25 0 0 1-2.182-2.25V6.75" />
              </svg>
            ),
          },
        ] as const).map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative border border-zinc-800 rounded-xl p-5 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-0.5 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: BRAND }} />
            <div className="flex items-start justify-between mb-3">
              <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500">{card.label}</p>
              <span className="text-zinc-700 group-hover:text-zinc-500 transition-colors">{card.icon}</span>
            </div>
            <p className="text-3xl font-semibold text-zinc-100 tabular-nums">{card.value}</p>
            <p className="text-xs text-zinc-600 mt-1">{card.sub}</p>
          </Link>
        ))}

        <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/30">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500">Carteira ativa</p>
            <svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
          </div>
          <p className="text-2xl font-semibold text-zinc-100 leading-tight tabular-nums">{formatBRL(activeContractValue)}</p>
          <p className="text-xs text-zinc-600 mt-1">em projetos ativos</p>
        </div>

        {canSeeFinances ? (
          <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/30">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500">Margem ativa</p>
              <svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            </div>
            <p className={`text-2xl font-semibold leading-tight tabular-nums ${overallMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatBRL(overallMargin)}
            </p>
            <p className="text-xs text-zinc-600 mt-1">receita − despesas</p>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/30">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500">Carteira total</p>
              <svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <p className="text-2xl font-semibold text-zinc-100 leading-tight tabular-nums">{formatBRL(totalContractValue)}</p>
            <p className="text-xs text-zinc-600 mt-1">todos os projetos</p>
          </div>
        )}
      </div>

      {/* Financial health */}
      {canSeeFinances && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Link href="/sistema/financeiro" className="group border border-zinc-800 rounded-xl p-5 bg-zinc-900/30 hover:border-zinc-700 transition-all">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500">Total de despesas</p>
              <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
              </svg>
            </div>
            <p className="text-2xl font-semibold text-zinc-100 tabular-nums">{formatBRL(totalExpenses)}</p>
            <p className="text-xs text-zinc-600 mt-1">todos os registros</p>
          </Link>

          <div className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/30">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500">Receita ativa</p>
              <svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-2xl font-semibold text-zinc-100 tabular-nums">{formatBRL(activeContractValue)}</p>
            <p className="text-xs text-zinc-600 mt-1">contratos em andamento</p>
          </div>

          {canSeeTimesheets && (
            <Link
              href={pendingApprovals > 0 ? '/sistema/apontamentos/aprovacoes' : '/sistema/apontamentos'}
              className="group border border-zinc-800 rounded-xl p-5 bg-zinc-900/30 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-[0.65rem] uppercase tracking-widest text-zinc-500">Aprovações pendentes</p>
                <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className={`text-2xl font-semibold tabular-nums ${pendingApprovals > 0 ? 'text-yellow-400' : 'text-zinc-100'}`}>
                {pendingApprovals}
              </p>
              <p className="text-xs text-zinc-600 mt-1">apontamentos aguardando</p>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Project status breakdown */}
        <section className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/30">
          <h2 className="text-[0.65rem] uppercase tracking-widest text-zinc-500 mb-5 font-medium">Projetos por status</h2>
          <div className="flex flex-col gap-3">
            {STATUS_ORDER.map((s) => {
              const count = statusCounts[s] ?? 0
              const pct = totalProjects ? Math.round((count / totalProjects) * 100) : 0
              return (
                <Link key={s} href={`/sistema/projetos?status=${s}`} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-2 py-0.5 text-[0.6rem] uppercase tracking-wider rounded border ${STATUS_COLORS[s]}`}>
                      {STATUS_LABELS[s]}
                    </span>
                    <span className="text-sm text-zinc-300 tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: s === 'active' ? BRAND : '#52525b',
                      }}
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Recent projects */}
        <section className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/30 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-medium">Projetos recentes</h2>
            <Link href="/sistema/projetos" className="text-xs transition-colors hover:opacity-80" style={{ color: BRAND }}>
              Ver todos →
            </Link>
          </div>
          {!recentProjects || recentProjects.length === 0 ? (
            <p className="text-sm text-zinc-600">Nenhum projeto cadastrado.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-800/70">
              {recentProjects.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-4 group">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[0.6rem] font-mono text-zinc-600">{p.code}</span>
                      <span className={`px-1.5 py-0 text-[0.55rem] uppercase tracking-wider rounded border ${STATUS_COLORS[p.status as ProjectStatus]}`}>
                        {STATUS_LABELS[p.status as ProjectStatus]}
                      </span>
                    </div>
                    <Link
                      href={`/sistema/projetos/${p.id}`}
                      className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate block"
                    >
                      {p.name}
                    </Link>
                  </div>
                  <div className="text-right shrink-0">
                    {p.contract_value > 0 && (
                      <p className="text-xs text-zinc-400 tabular-nums">{formatBRL(p.contract_value)}</p>
                    )}
                    {p.deadline && (
                      <p className="text-[0.65rem] text-zinc-600 mt-0.5">{formatDateBR(p.deadline)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Project profitability */}
      {canSeeFinances && profitability.length > 0 && (
        <section className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/30 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-medium">Rentabilidade — projetos ativos</h2>
            <Link href="/sistema/projetos?status=active" className="text-xs transition-colors hover:opacity-80" style={{ color: BRAND }}>
              Ver projetos →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium">Projeto</th>
                  <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium text-right">Receita</th>
                  <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium text-right">Despesas</th>
                  <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium text-right">Margem</th>
                  <th className="pb-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {profitability.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800/60 last:border-0">
                    <td className="py-3 pr-4">
                      <Link href={`/sistema/projetos/${p.id}`} className="hover:text-white transition-colors">
                        <span className="text-[0.65rem] font-mono text-zinc-600 mr-2">{p.code}</span>
                        <span className="text-sm text-zinc-300">{p.name}</span>
                      </Link>
                    </td>
                    <td className="py-3 text-right text-sm text-zinc-400 tabular-nums">
                      {p.contract_value > 0 ? formatBRL(p.contract_value) : '—'}
                    </td>
                    <td className="py-3 text-right text-sm text-zinc-400 tabular-nums">
                      {p.expenses > 0 ? formatBRL(p.expenses) : '—'}
                    </td>
                    <td className={`py-3 text-right text-sm tabular-nums font-medium ${p.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {p.contract_value > 0 ? (
                        <>
                          {formatBRL(p.margin)}
                          {p.pct !== null && <span className="text-xs ml-1 opacity-60">({p.pct}%)</span>}
                        </>
                      ) : '—'}
                    </td>
                    <td className="py-3 pl-4 w-28">
                      {p.contract_value > 0 && p.expenses > 0 && (
                        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.margin >= 0 ? 'bg-emerald-700' : 'bg-red-800'}`}
                            style={{ width: `${Math.min(100, Math.max(0, (p.expenses / p.contract_value) * 100))}%` }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Team hours this month */}
      {canSeeTimesheets && teamHours.length > 0 && (
        <section className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/30 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-medium">
              Horas aprovadas — {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <Link href="/sistema/apontamentos/aprovacoes" className="text-xs transition-colors hover:opacity-80" style={{ color: BRAND }}>
              Aprovações →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {teamHours.map(({ profile_id, minutes }) => {
              const name = profileMap.get(profile_id) ?? 'Desconhecido'
              const pct = Math.round((minutes / maxTeamMinutes) * 100)
              return (
                <div key={profile_id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-zinc-300 truncate max-w-[60%]">{name}</span>
                    <span className="text-xs text-zinc-500 font-mono">{minutesToDisplay(minutes)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-zinc-800">
                    <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: BRAND }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recent clients */}
      <section className="border border-zinc-800 rounded-xl p-5 bg-zinc-900/30">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[0.65rem] uppercase tracking-widest text-zinc-500 font-medium">Clientes recentes</h2>
          <Link href="/sistema/clientes" className="text-xs transition-colors hover:opacity-80" style={{ color: BRAND }}>
            Ver todos →
          </Link>
        </div>
        {!recentClients || recentClients.length === 0 ? (
          <p className="text-sm text-zinc-600">Nenhum cliente cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {recentClients.map((c) => (
              <Link
                key={c.id}
                href={`/sistema/clientes/${c.id}`}
                className="border border-zinc-800 rounded p-3 hover:border-zinc-600 transition-colors"
              >
                <p className="text-sm text-zinc-300 font-medium truncate">{c.name}</p>
                {(c.cidade || c.estado) && (
                  <p className="text-xs text-zinc-600 mt-1 truncate">
                    {[c.cidade, c.estado].filter(Boolean).join(' / ')}
                  </p>
                )}
                <p className="text-[0.6rem] text-zinc-700 mt-2">
                  {new Date(c.created_at).toLocaleDateString('pt-BR')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
