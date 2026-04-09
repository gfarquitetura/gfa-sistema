import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { minutesToDisplay } from '@/lib/timesheets/format'
import { AprovacoesFiltros } from './_components/aprovacoes-filtros'
import { ApprovalRow } from './_components/approval-row'
import type { TimesheetEntry, Profile, Project } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Aprovações — Apontamentos — GFA Projetos' }

const PAGE_SIZE = 50

interface PageProps {
  searchParams: Promise<{ person?: string; project?: string; page?: string }>
}

export default async function AprovacoesPage({ searchParams }: PageProps) {
  const [profile, sp] = await Promise.all([getProfile(), searchParams])
  if (!profile) redirect('/login')
  if (!hasPermission(profile.role, 'timesheets:approve')) redirect('/sistema/apontamentos')

  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = supabase
    .from('timesheet_entries')
    .select('*', { count: 'exact' })
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: true })
    .range(from, from + PAGE_SIZE - 1)

  if (sp.person)  query = query.eq('profile_id', sp.person)
  if (sp.project && sp.project !== '__overhead__') query = query.eq('project_id', sp.project)
  if (sp.project === '__overhead__') query = query.is('project_id', null)

  const [entriesResult, profilesResult, projectsResult] = await Promise.all([
    query,
    supabase.from('profiles').select('id, full_name, email').eq('is_active', true).order('full_name'),
    supabase.from('projects').select('id, code, name').in('status', ['proposal', 'active', 'paused']).order('code'),
  ])

  const entries  = (entriesResult.data ?? []) as TimesheetEntry[]
  const count    = entriesResult.count ?? 0
  const totalPages = Math.ceil(count / PAGE_SIZE)
  const profiles = (profilesResult.data ?? []) as Pick<Profile, 'id' | 'full_name' | 'email'>[]
  const projects = (projectsResult.data ?? []) as Pick<Project, 'id' | 'code' | 'name'>[]

  const profileMap = new Map(profiles.map((p) => [p.id, p]))
  const projectMap = new Map(projects.map((p) => [p.id, p]))

  // Group entries by profile for per-person sections
  const grouped = new Map<string, TimesheetEntry[]>()
  for (const e of entries) {
    if (!grouped.has(e.profile_id)) grouped.set(e.profile_id, [])
    grouped.get(e.profile_id)!.push(e)
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/sistema/apontamentos"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-3 block"
          >
            ← Meus apontamentos
          </Link>
          <h1 className="text-xl font-light text-zinc-100">Aprovações</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {count} apontamento{count !== 1 ? 's' : ''} aguardando revisão
          </p>
        </div>
      </div>

      {/* Filters */}
      <AprovacoesFiltros profiles={profiles} projects={projects} total={count} />

      {/* Entries */}
      {grouped.size === 0 ? (
        <p className="text-sm text-zinc-500 py-16 text-center">
          Nenhum apontamento aguardando aprovação.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {Array.from(grouped.entries()).map(([profileId, personEntries]) => {
            const person = profileMap.get(profileId)
            const totalMinutes = personEntries.reduce((s, e) => s + e.minutes, 0)

            return (
              <section key={profileId}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-zinc-300">
                    {person?.full_name || person?.email || 'Usuário desconhecido'}
                  </h2>
                  <span className="text-xs text-zinc-600">
                    {personEntries.length} entrada{personEntries.length !== 1 ? 's' : ''} ·{' '}
                    {minutesToDisplay(totalMinutes)}
                  </span>
                </div>
                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                  {personEntries.map((e) => (
                    <ApprovalRow
                      key={e.id}
                      entry={e}
                      project={e.project_id ? (projectMap.get(e.project_id) ?? null) : null}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-xs text-zinc-500">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/sistema/apontamentos/aprovacoes?${new URLSearchParams({ ...sp, page: String(page - 1) }).toString()}`}
                className="px-3 py-1.5 text-xs border border-zinc-800 rounded text-zinc-400 hover:border-zinc-600 transition-colors"
              >
                Anterior
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/sistema/apontamentos/aprovacoes?${new URLSearchParams({ ...sp, page: String(page + 1) }).toString()}`}
                className="px-3 py-1.5 text-xs border border-zinc-800 rounded text-zinc-400 hover:border-zinc-600 transition-colors"
              >
                Próxima
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
