import type { AuditLog } from '@/lib/types/database'

const ACTION_LABELS: Record<string, string> = {
  'client.created':     'Cadastrado',
  'client.updated':     'Atualizado',
  'client.deactivated': 'Arquivado',
  'client.reactivated': 'Reativado',
  'client.deleted':     'Excluído',
}

interface AuditTrailProps {
  entries: AuditLog[]
}

export function AuditTrail({ entries }: AuditTrailProps) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
        Histórico de alterações
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-zinc-600">Nenhum registro encontrado.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 text-xs">
              <span className="text-zinc-600 whitespace-nowrap mt-0.5">
                {new Date(entry.created_at).toLocaleString('pt-BR')}
              </span>
              <span className="text-zinc-400">
                {ACTION_LABELS[entry.action] ?? entry.action}
              </span>
              {entry.user_email && (
                <span className="text-zinc-600">por {entry.user_email}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
