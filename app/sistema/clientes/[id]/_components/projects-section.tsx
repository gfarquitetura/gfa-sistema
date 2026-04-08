import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { STATUS_LABELS, STATUS_COLORS, formatBRL } from '@/lib/projects/format'
import type { ProjectStatus } from '@/lib/types/database'

interface ProjectsSectionProps {
  clientId: string
}

export async function ProjectsSection({ clientId }: ProjectsSectionProps) {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('id, code, name, status, contract_value, deadline')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Projetos</h2>
      {!projects || projects.length === 0 ? (
        <p className="text-sm text-zinc-600">Nenhum projeto vinculado.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-800">
          {projects.map((p) => (
            <li key={p.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-600">{p.code}</span>
                  <span className={`px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider rounded border ${STATUS_COLORS[p.status as ProjectStatus]}`}>
                    {STATUS_LABELS[p.status as ProjectStatus]}
                  </span>
                </div>
                <Link
                  href={`/sistema/projetos/${p.id}`}
                  className="text-sm text-zinc-300 hover:text-white transition-colors mt-0.5 block"
                >
                  {p.name}
                </Link>
              </div>
              <div className="text-right shrink-0">
                {p.contract_value > 0 && (
                  <p className="text-xs text-zinc-400">{formatBRL(p.contract_value)}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
