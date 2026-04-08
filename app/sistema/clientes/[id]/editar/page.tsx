import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { ClientForm } from '../../_components/client-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('clients').select('name').eq('id', id).single()
  return { title: data ? `Editar ${data.name} — GFA Projetos` : 'Editar Cliente' }
}

export default async function EditarClientePage({ params }: PageProps) {
  const { id } = await params
  const profile = await getProfile()

  if (!profile || !hasPermission(profile.role, 'clients:manage')) {
    redirect(`/sistema/clientes/${id}`)
  }

  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a
          href={`/sistema/clientes/${id}`}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-3 block"
        >
          ← {client.name}
        </a>
        <h1 className="text-xl font-light text-zinc-100">Editar cliente</h1>
      </div>
      <ClientForm initialData={client} />
    </div>
  )
}
