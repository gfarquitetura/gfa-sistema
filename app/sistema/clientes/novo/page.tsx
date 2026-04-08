import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { ClientForm } from '../_components/client-form'

export const metadata: Metadata = {
  title: 'Novo Cliente — GF Arquitetura',
}

export default async function NovoClientePage() {
  const profile = await getProfile()
  if (!profile || !hasPermission(profile.role, 'clients:manage')) {
    redirect('/sistema/clientes')
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-light text-zinc-100">Novo cliente</h1>
        <p className="text-sm text-zinc-500 mt-1">Preencha os dados do cliente.</p>
      </div>
      <ClientForm />
    </div>
  )
}
