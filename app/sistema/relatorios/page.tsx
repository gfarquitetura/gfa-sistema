import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { formatBRL } from '@/lib/projects/format'
import { minutesToDisplay } from '@/lib/timesheets/format'
import { PeriodoFiltro } from './_components/periodo-filtro'
import type { ExpenseCategory, Project, Profile } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Relatórios — GFA Projetos' }

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

function getPeriodRange(period: string): { from: string | null; to: string | null; label: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (period === 'last_month') {
    const from = new Date(y, m - 1, 1).toISOString().slice(0, 10)
    const to   = new Date(y, m, 0).toISOString().slice(0, 10)
    return { from, to, label: 'Último mês' }
  }
  if (period === 'year') {
    return { from: `${y}-01-01`, to: `${y}-12-31`, label: `${y}` }
  }
  if (period === 'all') {
    return { from: null, to: null, label: 'Todos os períodos' }
  }
  // default: current month
  const from = new Date(y, m, 1).toISOString().slice(0, 10)
  const to   = new Date(y, m + 1, 0).toISOString().slice(0, 10)
  return { from, to, label: 'Este mês' }
}

export default async function RelatoriosPage({ searchParams }: PageProps) {
  const [profile, sp] = await Promise.all([getProfile(), searchParams])
  if (!profile) redirect('/login')
  if (!hasPermission(profile.role, 'reports:read')) redirect('/sistema')

  const canSeeFinances   = hasPermission(profile.role, 'finances:read')
  const canSeeTimesheets = hasPermission(profile.role, 'timesheets:approve')

  const period = sp.period ?? 'month'
  const { from, to, label } = getPeriodRange(period)

  const supabase = await createClient()

  // ── Expense queries ────────────────────────────────────────
  let expenses: { project_id: string | null; category_id: string | null; amount: number }[] = []
  let categories: Pick<ExpenseCategory, 'id' | 'name'>[] = []
  let expenseProjects: Pick<Project, 'id' | 'code' | 'name' | 'contract_value'>[] = []

  if (canSeeFinances) {
    let expQ = supabase.from('expenses').select('project_id, category_id, amount')
    if (from) expQ = expQ.gte('expense_date', from)
    if (to)   expQ = expQ.lte('expense_date', to)

    const [expResult, catResult, projResult] = await Promise.all([
      expQ,
      supabase.from('expense_categories').select('id, name').eq('is_active', true).order('name'),
      supabase.from('projects').select('id, code, name, contract_value').order('code'),
    ])

    expenses        = expResult.data ?? []
    categories      = catResult.data ?? []
    expenseProjects = projResult.data ?? []
  }

  // ── Timesheet queries ──────────────────────────────────────
  let tsEntries: { profile_id: string; project_id: string | null; minutes: number }[] = []
  let tsProfiles: Pick<Profile, 'id' | 'full_name' | 'email'>[] = []
  let tsProjects: Pick<Project, 'id' | 'code' | 'name'>[] = []

  if (canSeeTimesheets) {
    let tsQ = supabase
      .from('timesheet_entries')
      .select('profile_id, project_id, minutes')
      .eq('status', 'approved')
    if (from) tsQ = tsQ.gte('entry_date', from)
    if (to)   tsQ = tsQ.lte('entry_date', to)

    const [tsResult, profilesResult, tsProjectsResult] = await Promise.all([
      tsQ,
      supabase.from('profiles').select('id, full_name, email').eq('is_active', true).order('full_name'),
      supabase.from('projects').select('id, code, name').order('code'),
    ])

    tsEntries  = tsResult.data ?? []
    tsProfiles = profilesResult.data ?? []
    tsProjects = tsProjectsResult.data ?? []
  }

  // ── Aggregations ───────────────────────────────────────────

  // Expenses by category
  const categoryMap  = new Map(categories.map((c) => [c.id, c.name]))
  const byCategoryAmt = new Map<string, number>()
  for (const e of expenses) {
    const key = e.category_id ?? '__none__'
    byCategoryAmt.set(key, (byCategoryAmt.get(key) ?? 0) + e.amount)
  }
  const expensesByCategory = Array.from(byCategoryAmt.entries())
    .map(([id, amount]) => ({ id, name: categoryMap.get(id) ?? 'Sem categoria', amount }))
    .sort((a, b) => b.amount - a.amount)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  // Expenses by project
  const byProjectAmt = new Map<string, number>()
  for (const e of expenses) {
    const key = e.project_id ?? '__overhead__'
    byProjectAmt.set(key, (byProjectAmt.get(key) ?? 0) + e.amount)
  }
  const projectExpMap = new Map(expenseProjects.map((p) => [p.id, p]))
  const expensesByProject = Array.from(byProjectAmt.entries())
    .map(([id, amount]) => ({
      id,
      code: projectExpMap.get(id)?.code ?? '—',
      name: id === '__overhead__' ? 'Overhead / interno' : (projectExpMap.get(id)?.name ?? 'Projeto removido'),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)

  // Project profitability (all projects with expenses in period)
  const allProjectIds = expenseProjects.map((p) => p.id)
  const profitability = allProjectIds
    .map((id) => {
      const p = projectExpMap.get(id)!
      const exp = byProjectAmt.get(id) ?? 0
      const margin = p.contract_value - exp
      const pct = p.contract_value > 0 ? Math.round((margin / p.contract_value) * 100) : null
      return { ...p, expenses: exp, margin, pct }
    })
    .filter((p) => p.contract_value > 0 || p.expenses > 0)
    .sort((a, b) => b.contract_value - a.contract_value)

  // Hours by person
  const profileMinutes = new Map<string, number>()
  for (const e of tsEntries) {
    profileMinutes.set(e.profile_id, (profileMinutes.get(e.profile_id) ?? 0) + e.minutes)
  }
  const profileNameMap = new Map(tsProfiles.map((p) => [p.id, p.full_name || p.email]))
  const hoursByPerson = Array.from(profileMinutes.entries())
    .map(([id, minutes]) => ({ id, name: profileNameMap.get(id) ?? 'Desconhecido', minutes }))
    .sort((a, b) => b.minutes - a.minutes)

  // Hours by project
  const projectMinutes = new Map<string, number>()
  for (const e of tsEntries) {
    const key = e.project_id ?? '__overhead__'
    projectMinutes.set(key, (projectMinutes.get(key) ?? 0) + e.minutes)
  }
  const tsProjectNameMap = new Map(tsProjects.map((p) => [p.id, { code: p.code, name: p.name }]))
  const hoursByProject = Array.from(projectMinutes.entries())
    .map(([id, minutes]) => ({
      id,
      code: tsProjectNameMap.get(id)?.code ?? '—',
      name: id === '__overhead__' ? 'Overhead / interno' : (tsProjectNameMap.get(id)?.name ?? 'Projeto removido'),
      minutes,
    }))
    .sort((a, b) => b.minutes - a.minutes)

  const totalHours = tsEntries.reduce((s, e) => s + e.minutes, 0)
  const maxCatAmt  = expensesByCategory[0]?.amount ?? 1
  const maxPersonMin = hoursByPerson[0]?.minutes ?? 1

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-light text-zinc-100">Relatórios</h1>
          <p className="text-sm text-zinc-500 mt-1">{label}</p>
        </div>
        {canSeeFinances && (
          <a
            href={`/api/relatorios/export?period=${period}`}
            className="px-4 py-2 border border-zinc-700 text-zinc-300 text-xs uppercase tracking-widest rounded hover:border-zinc-500 hover:text-zinc-100 transition-colors"
          >
            Exportar CSV
          </a>
        )}
      </div>

      {/* Period filter */}
      <div className="mb-8">
        <PeriodoFiltro />
      </div>

      {canSeeFinances && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-zinc-800 rounded-lg p-5">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Total de despesas</p>
              <p className="text-2xl font-light text-zinc-100">{formatBRL(totalExpenses)}</p>
            </div>
            <div className="border border-zinc-800 rounded-lg p-5">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Categorias</p>
              <p className="text-2xl font-light text-zinc-100">{expensesByCategory.length}</p>
            </div>
            <div className="border border-zinc-800 rounded-lg p-5">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Projetos c/ despesas</p>
              <p className="text-2xl font-light text-zinc-100">
                {expensesByProject.filter((p) => p.id !== '__overhead__').length}
              </p>
            </div>
          </div>

          {/* Expenses by category */}
          <section className="border border-zinc-800 rounded-lg p-5 mb-8">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Despesas por categoria</h2>
            {expensesByCategory.length === 0 ? (
              <p className="text-sm text-zinc-600">Nenhuma despesa no período.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {expensesByCategory.map((c) => {
                  const pct = totalExpenses > 0 ? Math.round((c.amount / totalExpenses) * 100) : 0
                  const barPct = Math.round((c.amount / maxCatAmt) * 100)
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-zinc-300">{c.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-600">{pct}%</span>
                          <span className="text-sm text-zinc-400 tabular-nums w-28 text-right">
                            {formatBRL(c.amount)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-zinc-800">
                        <div className="h-1 rounded-full bg-zinc-500" style={{ width: `${barPct}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-between pt-3 border-t border-zinc-800 mt-1">
                  <span className="text-xs uppercase tracking-wider text-zinc-500">Total</span>
                  <span className="text-sm font-medium text-zinc-300 tabular-nums">{formatBRL(totalExpenses)}</span>
                </div>
              </div>
            )}
          </section>

          {/* Expenses by project */}
          <section className="border border-zinc-800 rounded-lg p-5 mb-8">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Despesas por projeto</h2>
            {expensesByProject.length === 0 ? (
              <p className="text-sm text-zinc-600">Nenhuma despesa no período.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium">Projeto</th>
                    <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium text-right">Despesas</th>
                    <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium text-right w-16">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {expensesByProject.map((p) => {
                    const pct = totalExpenses > 0 ? Math.round((p.amount / totalExpenses) * 100) : 0
                    return (
                      <tr key={p.id}>
                        <td className="py-3 pr-4">
                          {p.id !== '__overhead__' ? (
                            <span>
                              <span className="text-[0.65rem] font-mono text-zinc-600 mr-2">{p.code}</span>
                              <span className="text-sm text-zinc-300">{p.name}</span>
                            </span>
                          ) : (
                            <span className="text-sm text-zinc-500 italic">{p.name}</span>
                          )}
                        </td>
                        <td className="py-3 text-right text-sm text-zinc-400 tabular-nums">{formatBRL(p.amount)}</td>
                        <td className="py-3 text-right text-xs text-zinc-600">{pct}%</td>
                      </tr>
                    )
                  })}
                  <tr className="border-t border-zinc-700">
                    <td className="pt-3 text-xs uppercase tracking-wider text-zinc-500">Total</td>
                    <td className="pt-3 text-right text-sm font-medium text-zinc-300 tabular-nums">{formatBRL(totalExpenses)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            )}
          </section>

          {/* Project profitability */}
          {profitability.length > 0 && (
            <section className="border border-zinc-800 rounded-lg p-5 mb-8">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Rentabilidade por projeto</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium">Projeto</th>
                      <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium text-right">Receita</th>
                      <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium text-right">Despesas</th>
                      <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium text-right">Margem</th>
                      <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium text-right w-16">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {profitability.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 pr-4">
                          <span className="text-[0.65rem] font-mono text-zinc-600 mr-2">{p.code}</span>
                          <span className="text-sm text-zinc-300">{p.name}</span>
                        </td>
                        <td className="py-3 text-right text-sm text-zinc-400 tabular-nums">
                          {p.contract_value > 0 ? formatBRL(p.contract_value) : '—'}
                        </td>
                        <td className="py-3 text-right text-sm text-zinc-400 tabular-nums">
                          {p.expenses > 0 ? formatBRL(p.expenses) : '—'}
                        </td>
                        <td className={`py-3 text-right text-sm tabular-nums font-medium ${p.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {p.contract_value > 0 ? formatBRL(p.margin) : '—'}
                        </td>
                        <td className={`py-3 text-right text-xs ${p.margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {p.pct !== null ? `${p.pct}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {canSeeTimesheets && (
        <>
          {/* Hours summary */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border border-zinc-800 rounded-lg p-5">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Total de horas aprovadas</p>
              <p className="text-2xl font-light text-zinc-100">{minutesToDisplay(totalHours)}</p>
            </div>
            <div className="border border-zinc-800 rounded-lg p-5">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Colaboradores ativos</p>
              <p className="text-2xl font-light text-zinc-100">{hoursByPerson.length}</p>
            </div>
          </div>

          {/* Hours by person */}
          <section className="border border-zinc-800 rounded-lg p-5 mb-8">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Horas por colaborador</h2>
            {hoursByPerson.length === 0 ? (
              <p className="text-sm text-zinc-600">Nenhum apontamento aprovado no período.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {hoursByPerson.map(({ id, name, minutes }) => {
                  const barPct = Math.round((minutes / maxPersonMin) * 100)
                  return (
                    <div key={id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-zinc-300 truncate max-w-[60%]">{name}</span>
                        <span className="text-sm text-zinc-400 font-mono">{minutesToDisplay(minutes)}</span>
                      </div>
                      <div className="h-1 rounded-full bg-zinc-800">
                        <div className="h-1 rounded-full bg-zinc-500" style={{ width: `${barPct}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-between pt-3 border-t border-zinc-800 mt-1">
                  <span className="text-xs uppercase tracking-wider text-zinc-500">Total</span>
                  <span className="text-sm font-medium text-zinc-300 font-mono">{minutesToDisplay(totalHours)}</span>
                </div>
              </div>
            )}
          </section>

          {/* Hours by project */}
          {hoursByProject.length > 0 && (
            <section className="border border-zinc-800 rounded-lg p-5">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Horas por projeto</h2>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium">Projeto</th>
                    <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium text-right">Horas</th>
                    <th className="pb-3 text-[0.65rem] uppercase tracking-wider text-zinc-600 font-medium text-right w-16">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {hoursByProject.map((p) => {
                    const pct = totalHours > 0 ? Math.round((p.minutes / totalHours) * 100) : 0
                    return (
                      <tr key={p.id}>
                        <td className="py-3 pr-4">
                          {p.id !== '__overhead__' ? (
                            <span>
                              <span className="text-[0.65rem] font-mono text-zinc-600 mr-2">{p.code}</span>
                              <span className="text-sm text-zinc-300">{p.name}</span>
                            </span>
                          ) : (
                            <span className="text-sm text-zinc-500 italic">{p.name}</span>
                          )}
                        </td>
                        <td className="py-3 text-right text-sm text-zinc-400 font-mono">{minutesToDisplay(p.minutes)}</td>
                        <td className="py-3 text-right text-xs text-zinc-600">{pct}%</td>
                      </tr>
                    )
                  })}
                  <tr className="border-t border-zinc-700">
                    <td className="pt-3 text-xs uppercase tracking-wider text-zinc-500">Total</td>
                    <td className="pt-3 text-right text-sm font-medium text-zinc-300 font-mono">{minutesToDisplay(totalHours)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  )
}
