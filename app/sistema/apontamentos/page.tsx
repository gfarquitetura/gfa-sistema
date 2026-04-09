import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import {
  toISOWeek, weekBounds, DAY_LABELS, minutesToDisplay, formatDayBR,
} from '@/lib/timesheets/format'
import { WeekNav } from './_components/week-nav'
import { EntryRow } from './_components/entry-row'
import { AddEntryDialog } from './_components/add-entry-dialog'
import { BulkSubmitButton } from './_components/bulk-submit-button'
import type { TimesheetEntry, Project } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Apontamentos — GFA Projetos' }

interface PageProps {
  searchParams: Promise<{ week?: string }>
}

export default async function ApontamentosPage({ searchParams }: PageProps) {
  const [profile, sp] = await Promise.all([getProfile(), searchParams])
  if (!profile) redirect('/login')

  const canSubmit  = hasPermission(profile.role, 'timesheets:submit')
  const canApprove = hasPermission(profile.role, 'timesheets:approve')

  // Resolve and validate week param
  const today = new Date()
  const currentWeek = toISOWeek(today)
  const week = sp.week && /^\d{4}-W\d{2}$/.test(sp.week) ? sp.week : currentWeek
  const [weekStart, weekEnd] = weekBounds(week)

  const supabase = await createClient()

  const [entriesResult, projectsResult] = await Promise.all([
    supabase
      .from('timesheet_entries')
      .select('*')
      .eq('profile_id', profile.id)
      .gte('entry_date', weekStart)
      .lte('entry_date', weekEnd)
      .order('entry_date', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('projects')
      .select('id, code, name')
      .in('status', ['proposal', 'active', 'paused'])
      .order('code'),
  ])

  const entries  = (entriesResult.data ?? []) as TimesheetEntry[]
  const projects = (projectsResult.data ?? []) as Pick<Project, 'id' | 'code' | 'name'>[]

  const projectMap = new Map(projects.map((p) => [p.id, p]))

  // Build day grid (Mon–Sun), pre-populated so empty days always render
  const allDays: string[] = []
  const byDay = new Map<string, TimesheetEntry[]>()
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + i)
    const iso = d.toISOString().slice(0, 10)
    allDays.push(iso)
    byDay.set(iso, [])
  }
  for (const e of entries) {
    byDay.get(e.entry_date)?.push(e)
  }

  const totalMinutes = entries.reduce((s, e) => s + e.minutes, 0)
  const draftIds = entries.filter((e) => e.status === 'draft').map((e) => e.id)

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-light text-zinc-100">Apontamentos</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {totalMinutes > 0 ? minutesToDisplay(totalMinutes) : '0min'} registrados nesta semana
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canApprove && (
            <Link
              href="/sistema/apontamentos/aprovacoes"
              className="px-4 py-2 border border-zinc-700 text-zinc-300 text-xs uppercase tracking-widest rounded hover:border-zinc-500 hover:text-zinc-100 transition-colors"
            >
              Aprovações
            </Link>
          )}
          {canSubmit && (
            <AddEntryDialog
              projects={projects}
              defaultDate={today.toISOString().slice(0, 10)}
            />
          )}
        </div>
      </div>

      {/* Week navigation */}
      <WeekNav currentWeek={week} />

      {/* Status summary */}
      <div className="flex gap-5 mb-6 text-xs text-zinc-600">
        <span>{entries.filter((e) => e.status === 'draft').length} rascunho(s)</span>
        <span>{entries.filter((e) => e.status === 'submitted').length} aguardando aprovação</span>
        <span>{entries.filter((e) => e.status === 'approved').length} aprovado(s)</span>
        {entries.some((e) => e.status === 'rejected') && (
          <span className="text-red-500">
            {entries.filter((e) => e.status === 'rejected').length} rejeitado(s)
          </span>
        )}
      </div>

      {/* Bulk submit */}
      {canSubmit && draftIds.length > 0 && (
        <BulkSubmitButton draftIds={draftIds} />
      )}

      {/* Day grid */}
      <div className="flex flex-col gap-6">
        {allDays.map((iso, i) => {
          const dayEntries = byDay.get(iso) ?? []
          const dayMinutes = dayEntries.reduce((s, e) => s + e.minutes, 0)

          return (
            <section key={iso}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs uppercase tracking-widest text-zinc-500">
                  {DAY_LABELS[i]}{' '}
                  <span className="text-zinc-700 normal-case tracking-normal">
                    {formatDayBR(iso)}
                  </span>
                </h2>
                {dayMinutes > 0 && (
                  <span className="text-xs text-zinc-600">{minutesToDisplay(dayMinutes)}</span>
                )}
              </div>

              {dayEntries.length === 0 ? (
                <p className="text-xs text-zinc-800 py-2">Sem apontamentos.</p>
              ) : (
                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                  {dayEntries.map((e) => (
                    <EntryRow
                      key={e.id}
                      entry={e}
                      project={e.project_id ? (projectMap.get(e.project_id) ?? null) : null}
                      projects={projects}
                      canEdit={canSubmit}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
