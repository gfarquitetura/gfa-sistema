'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { hasPermission } from '@/lib/auth/roles'
import { getProfile } from '@/lib/auth/get-profile'
import type { Role } from '@/lib/types/database'

export type UserActionState = { error: string } | { success: string } | undefined

// ============================================================
// Guard: abort if caller is not an admin
// ============================================================
async function requireAdmin() {
  const profile = await getProfile()
  if (!profile || !hasPermission(profile.role, 'users:manage')) {
    throw new Error('Sem permissão.')
  }
  return profile
}

// ============================================================
// Create user
// ============================================================
export async function createUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const caller = await requireAdmin()

  const full_name = (formData.get('full_name') as string).trim()
  const email = (formData.get('email') as string).trim().toLowerCase()
  const role = formData.get('role') as Role

  if (!full_name || !email || !role) {
    return { error: 'Preencha todos os campos.' }
  }

  const validRoles: Role[] = ['admin', 'financial', 'manager', 'readonly']
  if (!validRoles.includes(role)) {
    return { error: 'Perfil inválido.' }
  }

  const admin = createAdminClient()

  // inviteUserByEmail creates the account AND sends the invitation email
  // The user clicks the link in the email to set their password
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name, role },
  })

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      return { error: 'Este e-mail já está cadastrado.' }
    }
    return { error: `Erro ao convidar usuário: ${error.message}` }
  }

  await logAudit({
    action: 'user.created',
    entity: 'user',
    entityId: data.user.id,
    metadata: { full_name, email, role, created_by: caller.email },
  })

  revalidatePath('/sistema/admin/usuarios')
  return { success: `Convite enviado para ${email}. O usuário receberá um e-mail para definir a senha.` }
}

// ============================================================
// Change role
// ============================================================
export async function changeUserRole(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const caller = await requireAdmin()

  const userId = formData.get('user_id') as string
  const newRole = formData.get('role') as Role

  const validRoles: Role[] = ['admin', 'financial', 'manager', 'readonly']
  if (!validRoles.includes(newRole)) {
    return { error: 'Perfil inválido.' }
  }

  const supabase = await createClient()
  const admin = createAdminClient()

  // Get current role for audit metadata
  const { data: current } = await supabase
    .from('profiles')
    .select('role, email, full_name')
    .eq('id', userId)
    .single()

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) return { error: 'Erro ao atualizar perfil.' }

  // Keep auth user metadata in sync
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { role: newRole },
  })

  await logAudit({
    action: 'user.role_changed',
    entity: 'user',
    entityId: userId,
    metadata: {
      previous_role: current?.role,
      new_role: newRole,
      target_email: current?.email,
      changed_by: caller.email,
    },
  })

  revalidatePath('/sistema/admin/usuarios')
  return { success: 'Perfil atualizado.' }
}

// ============================================================
// Resend invite / send password reset email
// ============================================================
export async function resendInvite(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  await requireAdmin()

  const email = formData.get('email') as string
  if (!email) return { error: 'E-mail inválido.' }

  const supabase = await createClient()

  // resetPasswordForEmail actually sends the email (generateLink does not)
  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) return { error: `Erro ao enviar e-mail: ${error.message}` }

  return { success: `E-mail de redefinição de senha enviado para ${email}.` }
}

// ============================================================
// Toggle active status
// ============================================================
export async function toggleUserStatus(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const caller = await requireAdmin()

  const userId = formData.get('user_id') as string
  const currentlyActive = formData.get('is_active') === 'true'
  const newStatus = !currentlyActive

  const supabase = await createClient()

  const { data: target } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: newStatus })
    .eq('id', userId)

  if (error) return { error: 'Erro ao atualizar status.' }

  await logAudit({
    action: newStatus ? 'user.reactivated' : 'user.deactivated',
    entity: 'user',
    entityId: userId,
    metadata: {
      target_email: target?.email,
      changed_by: caller.email,
    },
  })

  revalidatePath('/sistema/admin/usuarios')
  return {
    success: newStatus
      ? `${target?.full_name || target?.email} reativado.`
      : `${target?.full_name || target?.email} desativado.`,
  }
}
