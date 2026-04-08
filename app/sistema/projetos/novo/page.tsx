import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { ProjectForm } from '../_components/project-form'

export const metadata: Metadata = { title: 'Novo Projeto — GFA Projetos' }

export default async function NovoProjetoPage() {
  const profile = await getProfile()
  if (!profile || !hasPermission(profile.role, 'projects:manage')) {
    redirect('/sistema/projetos')
  }

  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-light text-zinc-100">Novo projeto</h1>
        <p className="text-sm text-zinc-500 mt-1">Preencha os dados do projeto.</p>
      </div>
      <ProjectForm clients={clients ?? []} />
    </div>
  )
}
