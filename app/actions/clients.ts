'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { logAudit } from '@/lib/audit/log'
import { clientSchema } from '@/lib/clients/validation'
import { digitsOnly } from '@/lib/clients/format'

export type ClientActionState =
  | { error: string }
  | { success: string; id?: string }
  | undefined

// ============================================================
// Guards
// ============================================================
async function requireClientsManage() {
  const profile = await getProfile()
  if (!profile || !hasPermission(profile.role, 'clients:manage')) {
    throw new Error('Sem permissão.')
  }
  return profile
}

// ============================================================
// Helpers — extract and normalize formData into raw digits
// ============================================================
function extractClientData(formData: FormData) {
  return {
    name: (formData.get('name') as string)?.trim() ?? '',
    trade_name: (formData.get('trade_name') as string)?.trim() || null,
    document_type: formData.get('document_type') as 'cpf' | 'cnpj',
    document_number: digitsOnly(formData.get('document_number') as string),
    email: (formData.get('email') as string)?.trim() || null,
    phone: digitsOnly(formData.get('phone') as string) || null,
    cep: digitsOnly(formData.get('cep') as string) || null,
    logradouro: (formData.get('logradouro') as string)?.trim() || null,
    numero: (formData.get('numero') as string)?.trim() || null,
    complemento: (formData.get('complemento') as string)?.trim() || null,
    bairro: (formData.get('bairro') as string)?.trim() || null,
    cidade: (formData.get('cidade') as string)?.trim() || null,
    estado: (formData.get('estado') as string)?.trim() || null,
    notes: (formData.get('notes') as string)?.trim() || null,
  }
}

// ============================================================
// Create client
// ============================================================
export async function createClient(
  _prev: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  const caller = await requireClientsManage()
  const data = extractClientData(formData)

  const parsed = clientSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createSupabaseClient()
  const { data: created, error } = await supabase
    .from('clients')
    .insert({ ...parsed.data, created_by: caller.id, updated_by: caller.id })
    .select('id, name')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Já existe um cliente com este CPF/CNPJ.' }
    }
    return { error: 'Erro ao salvar cliente. Tente novamente.' }
  }

  await logAudit({
    action: 'client.created',
    entity: 'client',
    entityId: created.id,
    metadata: {
      name: created.name,
      document_type: parsed.data.document_type,
      created_by: caller.email,
    },
  })

  revalidatePath('/sistema/clientes')
  redirect(`/sistema/clientes/${created.id}`)
}

// ============================================================
// Update client
// ============================================================
export async function updateClient(
  _prev: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  const caller = await requireClientsManage()
  const clientId = formData.get('client_id') as string
  const data = extractClientData(formData)

  const parsed = clientSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createSupabaseClient()
  const { error } = await supabase
    .from('clients')
    .update({ ...parsed.data, updated_by: caller.id })
    .eq('id', clientId)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Já existe um cliente com este CPF/CNPJ.' }
    }
    return { error: 'Erro ao atualizar cliente. Tente novamente.' }
  }

  await logAudit({
    action: 'client.updated',
    entity: 'client',
    entityId: clientId,
    metadata: { name: parsed.data.name, updated_by: caller.email },
  })

  revalidatePath('/sistema/clientes')
  revalidatePath(`/sistema/clientes/${clientId}`)
  return { success: 'Cliente atualizado com sucesso.' }
}

// ============================================================
// Toggle active status
// ============================================================
export async function toggleClientStatus(
  _prev: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  const caller = await requireClientsManage()
  const clientId = formData.get('client_id') as string
  const currentlyActive = formData.get('is_active') === 'true'
  const newStatus = !currentlyActive

  const supabase = await createSupabaseClient()

  const { data: target } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .single()

  const { error } = await supabase
    .from('clients')
    .update({ is_active: newStatus, updated_by: caller.id })
    .eq('id', clientId)

  if (error) return { error: 'Erro ao atualizar status.' }

  await logAudit({
    action: newStatus ? 'client.reactivated' : 'client.deactivated',
    entity: 'client',
    entityId: clientId,
    metadata: { name: target?.name, changed_by: caller.email },
  })

  revalidatePath('/sistema/clientes')
  revalidatePath(`/sistema/clientes/${clientId}`)
  return {
    success: newStatus
      ? `${target?.name} reativado.`
      : `${target?.name} arquivado.`,
  }
}
