'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDocument, formatPhone } from '@/lib/clients/format'
import { ClientStatusButton } from './client-status-button'
import type { Client } from '@/lib/types/database'

type SortKey = 'name' | 'cidade' | 'created_at'

interface ClientsTableProps {
  clients: Client[]
  canManage: boolean
}

export function ClientsTable({ clients, canManage }: ClientsTableProps) {
  const router = useRouter()
  const params = useSearchParams()

  const sort = (params.get('sort') as SortKey) ?? 'created_at'
  const dir  = params.get('dir') ?? 'desc'

  function toggleSort(key: SortKey) {
    const next = new URLSearchParams(params.toString())
    if (sort === key) {
      next.set('dir', dir === 'asc' ? 'desc' : 'asc')
    } else {
      next.set('sort', key)
      next.set('dir', 'asc')
    }
    router.push(`/sistema/clientes?${next.toString()}`)
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sort !== col) return <span className="text-zinc-700 ml-1">↕</span>
    return <span className="text-zinc-400 ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
  }

  if (clients.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-12 text-center">
        Nenhum cliente encontrado.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left">
        <thead className="bg-zinc-950">
          <tr>
            <th
              className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium cursor-pointer select-none hover:text-zinc-300 transition-colors"
              onClick={() => toggleSort('name')}
            >
              Nome <SortIcon col="name" />
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">
              CPF / CNPJ
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium hidden sm:table-cell">
              Contato
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium hidden md:table-cell cursor-pointer select-none hover:text-zinc-300 transition-colors"
              onClick={() => toggleSort('cidade')}
            >
              Cidade <SortIcon col="cidade" />
            </th>
            <th className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">
              Status
            </th>
            <th
              className="px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium hidden lg:table-cell cursor-pointer select-none hover:text-zinc-300 transition-colors"
              onClick={() => toggleSort('created_at')}
            >
              Cadastro <SortIcon col="created_at" />
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="bg-zinc-900 divide-y divide-zinc-800">
          {clients.map((client) => (
            <tr key={client.id} className="group hover:bg-zinc-800/50 transition-colors">
              <td className="px-4 py-3.5">
                <Link
                  href={`/sistema/clientes/${client.id}`}
                  className="text-sm text-zinc-200 hover:text-white transition-colors font-medium"
                >
                  {client.name}
                </Link>
                {client.trade_name && (
                  <p className="text-xs text-zinc-500 mt-0.5">{client.trade_name}</p>
                )}
              </td>
              <td className="px-4 py-3.5 text-xs text-zinc-400 font-mono">
                {formatDocument(client.document_number, client.document_type)}
              </td>
              <td className="px-4 py-3.5 hidden sm:table-cell">
                {client.email && (
                  <p className="text-xs text-zinc-400 truncate max-w-[160px]">{client.email}</p>
                )}
                {client.phone && (
                  <p className="text-xs text-zinc-500 mt-0.5">{formatPhone(client.phone)}</p>
                )}
              </td>
              <td className="px-4 py-3.5 text-xs text-zinc-400 hidden md:table-cell">
                {client.cidade}
                {client.estado ? ` / ${client.estado}` : ''}
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={`px-2 py-0.5 text-[0.65rem] uppercase tracking-wider rounded border ${
                    client.is_active
                      ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                  }`}
                >
                  {client.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-4 py-3.5 text-xs text-zinc-500 hidden lg:table-cell">
                {new Date(client.created_at).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-4 py-3.5 text-right">
                <div className="flex items-center justify-end gap-3">
                  {canManage && (
                    <Link
                      href={`/sistema/clientes/${client.id}/editar`}
                      className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      Editar
                    </Link>
                  )}
                  {canManage && (
                    <ClientStatusButton
                      clientId={client.id}
                      isActive={client.is_active}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
