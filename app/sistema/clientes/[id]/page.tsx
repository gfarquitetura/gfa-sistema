import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { formatDocument, formatPhone, formatCep } from '@/lib/clients/format'
import { ClientStatusButton } from '../_components/client-status-button'
import { ProjectsSection } from './_components/projects-section'
import { AuditTrail } from './_components/audit-trail'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('clients').select('name').eq('id', id).single()
  return { title: data ? `${data.name} — GFA Projetos` : 'Cliente' }
}

export default async function ClienteDetailPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getProfile()
  const supabase = await createClient()

  const [clientResult, auditResult] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase
      .from('audit_logs')
      .select('*')
      .eq('entity', 'client')
      .eq('entity_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!clientResult.data) notFound()
  const client = clientResult.data
  const canManage = !!profile && hasPermission(profile.role, 'clients:manage')

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link
            href="/sistema/clientes"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-3 block"
          >
            ← Clientes
          </Link>
          <h1 className="text-xl font-light text-zinc-100">{client.name}</h1>
          {client.trade_name && (
            <p className="text-sm text-zinc-500 mt-0.5">{client.trade_name}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-mono text-zinc-400">
              {formatDocument(client.document_number, client.document_type)}
            </span>
            <span
              className={`px-2 py-0.5 text-[0.6rem] uppercase tracking-wider rounded border ${
                client.is_active
                  ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700'
              }`}
            >
              {client.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-3">
            <ClientStatusButton clientId={client.id} isActive={client.is_active} />
            <Link
              href={`/sistema/clientes/${client.id}/editar`}
              className="btn-primary"
            >
              Editar
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Contato */}
        <section className="border border-zinc-800 rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Contato</h2>
          <dl className="flex flex-col gap-3">
            {client.email && (
              <div>
                <dt className="text-[0.65rem] uppercase tracking-wider text-zinc-600">E-mail</dt>
                <dd className="text-sm text-zinc-300 mt-0.5">{client.email}</dd>
              </div>
            )}
            {client.phone && (
              <div>
                <dt className="text-[0.65rem] uppercase tracking-wider text-zinc-600">Telefone</dt>
                <dd className="text-sm text-zinc-300 mt-0.5">{formatPhone(client.phone)}</dd>
              </div>
            )}
            {!client.email && !client.phone && (
              <p className="text-sm text-zinc-600">Nenhum contato cadastrado.</p>
            )}
          </dl>
        </section>

        {/* Endereço */}
        <section className="border border-zinc-800 rounded-lg p-5">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Endereço</h2>
          {client.logradouro ? (
            <dl className="flex flex-col gap-3">
              <div>
                <dt className="text-[0.65rem] uppercase tracking-wider text-zinc-600">Logradouro</dt>
                <dd className="text-sm text-zinc-300 mt-0.5">
                  {client.logradouro}
                  {client.numero ? `, ${client.numero}` : ''}
                  {client.complemento ? ` — ${client.complemento}` : ''}
                </dd>
              </div>
              {client.bairro && (
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-wider text-zinc-600">Bairro</dt>
                  <dd className="text-sm text-zinc-300 mt-0.5">{client.bairro}</dd>
                </div>
              )}
              {(client.cidade || client.estado) && (
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-wider text-zinc-600">Cidade / UF</dt>
                  <dd className="text-sm text-zinc-300 mt-0.5">
                    {[client.cidade, client.estado].filter(Boolean).join(' / ')}
                  </dd>
                </div>
              )}
              {client.cep && (
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-wider text-zinc-600">CEP</dt>
                  <dd className="text-sm text-zinc-300 mt-0.5">{formatCep(client.cep)}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-zinc-600">Nenhum endereço cadastrado.</p>
          )}
        </section>
      </div>

      {/* Notes */}
      {client.notes && (
        <section className="border border-zinc-800 rounded-lg p-5 mb-10">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Observações</h2>
          <p className="text-sm text-zinc-400 whitespace-pre-wrap">{client.notes}</p>
        </section>
      )}

      {/* Projects — Phase 3 stub */}
      <div className="border border-zinc-800 rounded-lg p-5 mb-10">
        <ProjectsSection clientId={client.id} />
      </div>

      {/* Audit trail */}
      <div className="border border-zinc-800 rounded-lg p-5">
        <AuditTrail entries={auditResult.data ?? []} />
      </div>
    </div>
  )
}
