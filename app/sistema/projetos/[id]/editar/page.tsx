import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { ProjectForm } from '../../_components/project-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('name').eq('id', id).single()
  return { title: data ? `Editar ${data.name} — GFA Projetos` : 'Editar Projeto' }
}

export default async function EditarProjetoPage({ params }: PageProps) {
  const { id } = await params
  const profile = await getProfile()

  if (!profile || !hasPermission(profile.role, 'projects:manage')) {
    redirect(`/sistema/projetos/${id}`)
  }

  const supabase = await createClient()
  const [projectResult, clientsResult] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('clients').select('id, name').eq('is_active', true).order('name'),
  ])

  if (!projectResult.data) notFound()

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <a href={`/sistema/projetos/${id}`} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-3 block">
          ← {projectResult.data.name}
        </a>
        <h1 className="text-xl font-light text-zinc-100">Editar projeto</h1>
      </div>
      <ProjectForm initialData={projectResult.data} clients={clientsResult.data ?? []} />
    </div>
  )
}
