'use client'

import { useActionState } from 'react'
import { toggleClientStatus, type ClientActionState } from '@/app/actions/clients'

interface ClientStatusButtonProps {
  clientId: string
  isActive: boolean
}

export function ClientStatusButton({ clientId, isActive }: ClientStatusButtonProps) {
  const [, action, pending] = useActionState<ClientActionState, FormData>(
    toggleClientStatus,
    undefined
  )

  return (
    <form action={action}>
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="is_active" value={String(isActive)} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-40"
      >
        {pending ? '...' : isActive ? 'Arquivar' : 'Reativar'}
      </button>
    </form>
  )
}
