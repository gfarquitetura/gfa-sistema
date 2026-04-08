'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { logAudit } from '@/lib/audit/log'
import { projectSchema } from '@/lib/projects/validation'
import { parseBRLtoCents, VALID_TRANSITIONS } from '@/lib/projects/format'
import type { ProjectStatus } from '@/lib/types/database'

export type ProjectActionState =
  | { error: string }
  | { success: string; id?: string }
  | undefined

// ============================================================
// Guard
// ============================================================
async function requireProjectsManage() {
  const profile = await getProfile()
  if (!profile || !hasPermission(profile.role, 'projects:manage')) {
    throw new Error('Sem permissão.')
  }
  return profile
}

function extractProjectData(formData: FormData) {
  const rawValue = formData.get('contract_value') as string
  return {
    name:           (formData.get('name') as string)?.trim() ?? '',
    description:    (formData.get('description') as string)?.trim() || null,
    client_id:      formData.get('client_id') as string,
    contract_value: parseBRLtoCents(rawValue ?? '0'),
    start_date:     (formData.get('start_date') as string) || null,
    end_date:       (formData.get('end_date') as string) || null,
    deadline:       (formData.get('deadline') as string) || null,
    notes:          (formData.get('notes') as string)?.trim() || null,
  }
}

// ============================================================
// Create project
// ============================================================
export async function createProject(
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const caller = await requireProjectsManage()
  const data = extractProjectData(formData)

  const parsed = projectSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data: created, error } = await supabase
    .from('projects')
    .insert({
      ...parsed.data,
      start_date: parsed.data.start_date || null,
      end_date:   parsed.data.end_date || null,
      deadline:   parsed.data.deadline || null,
      created_by: caller.id,
      updated_by: caller.id,
    })
    .select('id, code, name')
    .single()

  if (error) return { error: 'Erro ao criar projeto. Tente novamente.' }

  await logAudit({
    action: 'project.created',
    entity: 'project',
    entityId: created.id,
    metadata: { name: created.name, code: created.code, created_by: caller.email },
  })

  revalidatePath('/sistema/projetos')
  redirect(`/sistema/projetos/${created.id}`)
}

// ============================================================
// Update project
// ============================================================
export async function updateProject(
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const caller = await requireProjectsManage()
  const projectId = formData.get('project_id') as string
  const data = extractProjectData(formData)

  const parsed = projectSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({
      ...parsed.data,
      start_date: parsed.data.start_date || null,
      end_date:   parsed.data.end_date || null,
      deadline:   parsed.data.deadline || null,
      updated_by: caller.id,
    })
    .eq('id', projectId)

  if (error) return { error: 'Erro ao atualizar projeto.' }

  await logAudit({
    action: 'project.updated',
    entity: 'project',
    entityId: projectId,
    metadata: { name: parsed.data.name, updated_by: caller.email },
  })

  revalidatePath('/sistema/projetos')
  revalidatePath(`/sistema/projetos/${projectId}`)
  return { success: 'Projeto atualizado com sucesso.' }
}

// ============================================================
// Change project status
// ============================================================
export async function changeProjectStatus(
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const caller = await requireProjectsManage()
  const projectId  = formData.get('project_id') as string
  const newStatus  = formData.get('status') as ProjectStatus

  const supabase = await createClient()
  const { data: current } = await supabase
    .from('projects')
    .select('status, name, code')
    .eq('id', projectId)
    .single()

  if (!current) return { error: 'Projeto não encontrado.' }

  const allowed = VALID_TRANSITIONS[current.status as ProjectStatus]
  if (!allowed.includes(newStatus)) {
    return { error: 'Transição de status não permitida.' }
  }

  const { error } = await supabase
    .from('projects')
    .update({ status: newStatus, updated_by: caller.id })
    .eq('id', projectId)

  if (error) return { error: 'Erro ao atualizar status.' }

  await logAudit({
    action: 'project.status_changed',
    entity: 'project',
    entityId: projectId,
    metadata: {
      code: current.code,
      name: current.name,
      previous_status: current.status,
      new_status: newStatus,
      changed_by: caller.email,
    },
  })

  revalidatePath('/sistema/projetos')
  revalidatePath(`/sistema/projetos/${projectId}`)
  return { success: 'Status atualizado.' }
}

// ============================================================
// Add team member
// ============================================================
export async function addProjectMember(
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const caller = await requireProjectsManage()
  const projectId  = formData.get('project_id') as string
  const profileId  = formData.get('profile_id') as string
  const memberRole = (formData.get('member_role') as string) || 'collaborator'

  const supabase = await createClient()
  const { error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, profile_id: profileId, member_role: memberRole as 'responsible' | 'collaborator' })

  if (error) {
    if (error.code === '23505') return { error: 'Membro já adicionado.' }
    return { error: 'Erro ao adicionar membro.' }
  }

  await logAudit({
    action: 'project.member_added',
    entity: 'project',
    entityId: projectId,
    metadata: { profile_id: profileId, member_role: memberRole, added_by: caller.email },
  })

  revalidatePath(`/sistema/projetos/${projectId}`)
  return { success: 'Membro adicionado.' }
}

// ============================================================
// Remove team member
// ============================================================
export async function removeProjectMember(
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const caller = await requireProjectsManage()
  const projectId = formData.get('project_id') as string
  const memberId  = formData.get('member_id') as string

  const supabase = await createClient()
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('id', memberId)

  if (error) return { error: 'Erro ao remover membro.' }

  await logAudit({
    action: 'project.member_removed',
    entity: 'project',
    entityId: projectId,
    metadata: { member_id: memberId, removed_by: caller.email },
  })

  revalidatePath(`/sistema/projetos/${projectId}`)
  return { success: 'Membro removido.' }
}
