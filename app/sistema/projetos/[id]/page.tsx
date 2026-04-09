import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import {
  formatBRL, formatDateBR,
  STATUS_LABELS, STATUS_COLORS,
} from '@/lib/projects/format'
import { StatusButton } from '../_components/status-button'
import { TeamSection } from '../_components/team-section'
import { AuditTrail } from '@/app/sistema/clientes/[id]/_components/audit-trail'
import type { Project, ProjectStatus } from '@/lib/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('name, code').eq('id', id).single()
  return { title: data ? `${data.code} — ${data.name} — GFA Projetos` : 'Projeto' }
}

export default async function ProjetoDetailPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getProfile()
  const supabase = await createClient()

  const [projectResult, membersResult, staffResult, auditResult] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase
      .from('project_members')
      .select('*, profiles(full_name, email)')
      .eq('project_id', id)
      .order('joined_at'),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('audit_logs')
      .select('*')
      .eq('entity', 'project')
      .eq('entity_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!projectResult.data) notFound()
  const project = projectResult.data as Project

  // Fetch client separately to avoid join type inference issues
  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', project.client_id)
    .single()

  const canManage = !!profile && hasPermission(profile.role, 'projects:manage')
  const status = project.status as ProjectStatus

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/sistema/projetos" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-3 block">
            ← Projetos
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-mono text-zinc-500">{project.code}</span>
            <span className={`px-2 py-0.5 text-[0.6rem] uppercase tracking-wider rounded border ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <h1 className="text-xl font-light text-zinc-100">{project.name}</h1>
          {client && (
            <Link
              href={`/sistema/clientes/${client.id}`}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors mt-0.5 block"
            >
              {client.name}
            </Link>
          )}
        </div>
        {canManage && (
          <Link
            href={`/sistema/projetos/${id}/editar`}
            className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-widest rounded hover:bg-white transition-colors"
          >
            Editar
          </Link>
        )}
      </div>

      {/* Status transitions */}
      {canManage && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-zinc-600 mb-2">Alterar status</p>
          <StatusButton projectId={id} currentStatus={status} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Contract */}
        <section className="border border-zinc-800 rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Contrato</h2>
          <dl className="flex flex-col gap-3">
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-zinc-600">Valor</dt>
              <dd className="text-sm text-zinc-300 mt-0.5">
                {project.contract_value > 0 ? formatBRL(project.contract_value) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wider text-zinc-600">Prazo</dt>
              <dd className="text-sm text-zinc-300 mt-0.5">{formatDateBR(project.deadline)}</dd>
            </div>
            {project.start_date && (
              <div>
                <dt className="text-[0.65rem] uppercase tracking-wider text-zinc-600">Início</dt>
                <dd className="text-sm text-zinc-300 mt-0.5">{formatDateBR(project.start_date)}</dd>
              </div>
            )}
            {project.end_date && (
              <div>
                <dt className="text-[0.65rem] uppercase tracking-wider text-zinc-600">Conclusão</dt>
                <dd className="text-sm text-zinc-300 mt-0.5">{formatDateBR(project.end_date)}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* Description */}
        {project.description && (
          <section className="border border-zinc-800 rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Escopo</h2>
            <p className="text-sm text-zinc-400 whitespace-pre-wrap">{project.description}</p>
          </section>
        )}
      </div>

      {/* Team */}
      <div className="border border-zinc-800 rounded-lg p-5 mb-8">
        <TeamSection
          projectId={id}
          members={(membersResult.data as any) ?? []}
          allStaff={staffResult.data ?? []}
          canManage={canManage}
        />
      </div>

      {/* Financials — Phase 4 stub */}
      <div className="border border-zinc-800 rounded-lg p-5 mb-8">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Financeiro</h2>
        <p className="text-sm text-zinc-600">
          Resumo financeiro disponível na fase 4.{' '}
          <span className="text-zinc-700 text-xs">(em breve)</span>
        </p>
      </div>

      {/* Notes */}
      {project.notes && (
        <div className="border border-zinc-800 rounded-lg p-5 mb-8">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Observações</h2>
          <p className="text-sm text-zinc-400 whitespace-pre-wrap">{project.notes}</p>
        </div>
      )}

      {/* Audit */}
      <div className="border border-zinc-800 rounded-lg p-5">
        <AuditTrail entries={auditResult.data ?? []} />
      </div>
    </div>
  )
}
