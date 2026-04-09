import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { formatBRL, STATUS_LABELS, STATUS_COLORS, formatDateBR } from '@/lib/projects/format'
import type { ProjectStatus } from '@/lib/types/database'

export const metadata: Metadata = {
  title: 'Painel — GFA Projetos',
}

export default async function SistemaPage() {
  const profile = await getProfile()
  const supabase = await createClient()

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

  // Aggregate project stats
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

  const firstName = profile?.full_name?.split(' ')[0] ?? 'bem-vindo'

  const STATUS_ORDER: ProjectStatus[] = ['proposal', 'active', 'paused', 'completed', 'cancelled']

  return (
    <div className="p-8 max-w-6xl">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-xl font-light text-zinc-100">
          Olá, {firstName}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Link href="/sistema/clientes" className="border border-zinc-800 rounded-lg p-5 hover:border-zinc-600 transition-colors group">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Clientes ativos</p>
          <p className="text-3xl font-light text-zinc-100">{activeClients ?? 0}</p>
          <p className="text-xs text-zinc-600 mt-1">de {totalClients ?? 0} cadastrados</p>
        </Link>

        <Link href="/sistema/projetos" className="border border-zinc-800 rounded-lg p-5 hover:border-zinc-600 transition-colors group">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Projetos ativos</p>
          <p className="text-3xl font-light text-zinc-100">{statusCounts['active'] ?? 0}</p>
          <p className="text-xs text-zinc-600 mt-1">de {totalProjects ?? 0} no total</p>
        </Link>

        <div className="border border-zinc-800 rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Carteira ativa</p>
          <p className="text-2xl font-light text-zinc-100 leading-tight">{formatBRL(activeContractValue)}</p>
          <p className="text-xs text-zinc-600 mt-1">em projetos ativos</p>
        </div>

        <div className="border border-zinc-800 rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Carteira total</p>
          <p className="text-2xl font-light text-zinc-100 leading-tight">{formatBRL(totalContractValue)}</p>
          <p className="text-xs text-zinc-600 mt-1">todos os projetos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Project status breakdown */}
        <section className="border border-zinc-800 rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Projetos por status</h2>
          <div className="flex flex-col gap-3">
            {STATUS_ORDER.map((s) => {
              const count = statusCounts[s] ?? 0
              const pct = totalProjects ? Math.round((count / totalProjects) * 100) : 0
              return (
                <Link key={s} href={`/sistema/projetos?status=${s}`} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 text-[0.6rem] uppercase tracking-wider rounded border ${STATUS_COLORS[s]}`}>
                      {STATUS_LABELS[s]}
                    </span>
                    <span className="text-sm text-zinc-300">{count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-zinc-800">
                    <div
                      className="h-1 rounded-full bg-zinc-500 group-hover:bg-zinc-400 transition-colors"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Recent projects */}
        <section className="border border-zinc-800 rounded-lg p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500">Projetos recentes</h2>
            <Link href="/sistema/projetos" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Ver todos →
            </Link>
          </div>
          {!recentProjects || recentProjects.length === 0 ? (
            <p className="text-sm text-zinc-600">Nenhum projeto cadastrado.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-800">
              {recentProjects.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[0.6rem] font-mono text-zinc-600">{p.code}</span>
                      <span className={`px-1.5 py-0 text-[0.55rem] uppercase tracking-wider rounded border ${STATUS_COLORS[p.status as ProjectStatus]}`}>
                        {STATUS_LABELS[p.status as ProjectStatus]}
                      </span>
                    </div>
                    <Link
                      href={`/sistema/projetos/${p.id}`}
                      className="text-sm text-zinc-300 hover:text-white transition-colors truncate block"
                    >
                      {p.name}
                    </Link>
                  </div>
                  <div className="text-right shrink-0">
                    {p.contract_value > 0 && (
                      <p className="text-xs text-zinc-400">{formatBRL(p.contract_value)}</p>
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

      {/* Recent clients */}
      <section className="border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">Clientes recentes</h2>
          <Link href="/sistema/clientes" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
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
