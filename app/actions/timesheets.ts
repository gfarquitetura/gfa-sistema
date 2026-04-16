'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/guards'
import { logAudit } from '@/lib/audit/log'
import { parseHoursInput } from '@/lib/timesheets/format'

export type TimesheetActionState = { error: string } | { success: string } | undefined

const requireSubmit  = () => requirePermission('timesheets:submit')
const requireApprove = () => requirePermission('timesheets:approve')

// ============================================================
// Zod schema
// ============================================================
const entrySchema = z.object({
  entry_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  minutes:     z.number().int().min(1, 'Duração deve ser maior que zero.').max(1440, 'Máximo 24h por entrada.'),
  description: z.string().min(2, 'Descrição deve ter ao menos 2 caracteres.').max(500, 'Descrição muito longa.'),
  project_id:  z.string().uuid().optional().nullable(),
  notes:       z.string().max(1000).optional().nullable(),
})

function extractEntryData(formData: FormData) {
  return {
    entry_date:  (formData.get('entry_date') as string)?.trim() ?? '',
    minutes:     parseHoursInput((formData.get('hours') as string) ?? '0'),
    description: (formData.get('description') as string)?.trim() ?? '',
    project_id:  (formData.get('project_id') as string) || null,
    notes:       (formData.get('notes') as string)?.trim() || null,
  }
}

// ============================================================
// createEntry
// ============================================================
export async function createEntry(
  _prev: TimesheetActionState,
  formData: FormData
): Promise<TimesheetActionState> {
  const caller = await requireSubmit()
  const data = extractEntryData(formData)

  const parsed = entrySchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('timesheet_entries')
    .insert({ ...parsed.data, profile_id: caller.id, status: 'draft' })

  if (error) return { error: 'Erro ao criar apontamento.' }

  revalidatePath('/sistema/apontamentos')
  return { success: 'Apontamento criado.' }
}

// ============================================================
// updateEntry — only draft entries
// ============================================================
export async function updateEntry(
  _prev: TimesheetActionState,
  formData: FormData
): Promise<TimesheetActionState> {
  const caller = await requireSubmit()
  const entryId = formData.get('entry_id') as string
  const data = extractEntryData(formData)

  const parsed = entrySchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('timesheet_entries')
    .select('id, status, profile_id')
    .eq('id', entryId)
    .single()

  if (!existing) return { error: 'Apontamento não encontrado.' }
  if (existing.profile_id !== caller.id) return { error: 'Sem permissão.' }
  if (existing.status !== 'draft') return { error: 'Somente rascunhos podem ser editados.' }

  const { error } = await supabase
    .from('timesheet_entries')
    .update(parsed.data)
    .eq('id', entryId)

  if (error) return { error: 'Erro ao atualizar apontamento.' }

  revalidatePath('/sistema/apontamentos')
  return { success: 'Apontamento atualizado.' }
}

// ============================================================
// deleteEntry — only draft entries
// ============================================================
export async function deleteEntry(
  _prev: TimesheetActionState,
  formData: FormData
): Promise<TimesheetActionState> {
  const caller = await requireSubmit()
  const entryId = formData.get('entry_id') as string

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('timesheet_entries')
    .select('id, status, profile_id')
    .eq('id', entryId)
    .single()

  if (!existing) return { error: 'Apontamento não encontrado.' }
  if (existing.profile_id !== caller.id) return { error: 'Sem permissão.' }
  if (existing.status !== 'draft') return { error: 'Somente rascunhos podem ser excluídos.' }

  const { error } = await supabase
    .from('timesheet_entries')
    .delete()
    .eq('id', entryId)

  if (error) return { error: 'Erro ao excluir apontamento.' }

  revalidatePath('/sistema/apontamentos')
  return { success: 'Apontamento excluído.' }
}

// ============================================================
// submitEntries — batch: comma-sep IDs → submitted
// ============================================================
export async function submitEntries(
  _prev: TimesheetActionState,
  formData: FormData
): Promise<TimesheetActionState> {
  const caller = await requireSubmit()

  const raw = (formData.get('entry_ids') as string) ?? ''
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean)
  if (ids.length === 0) return { error: 'Nenhum apontamento selecionado.' }

  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('timesheet_entries')
    .select('id, status, profile_id')
    .in('id', ids)

  const eligible = (entries ?? []).filter(
    (e) => e.profile_id === caller.id && e.status === 'draft'
  )
  if (eligible.length === 0) return { error: 'Nenhum apontamento elegível para envio.' }

  const eligibleIds = eligible.map((e) => e.id)
  const { error } = await supabase
    .from('timesheet_entries')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .in('id', eligibleIds)

  if (error) return { error: 'Erro ao enviar apontamentos.' }

  await logAudit({
    action: 'timesheet.submitted',
    entity: 'timesheet_entry',
    metadata: { ids: eligibleIds, count: eligibleIds.length, submitted_by: caller.email },
  })

  revalidatePath('/sistema/apontamentos')
  revalidatePath('/sistema/apontamentos/aprovacoes')
  return { success: `${eligibleIds.length} apontamento(s) enviado(s) para aprovação.` }
}

// ============================================================
// approveEntry
// ============================================================
export async function approveEntry(
  _prev: TimesheetActionState,
  formData: FormData
): Promise<TimesheetActionState> {
  const caller = await requireApprove()
  const entryId = formData.get('entry_id') as string

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('timesheet_entries')
    .select('id, status, profile_id')
    .eq('id', entryId)
    .single()

  if (!existing) return { error: 'Apontamento não encontrado.' }
  if (existing.status !== 'submitted') return { error: 'Apenas apontamentos enviados podem ser aprovados.' }

  const { error } = await supabase
    .from('timesheet_entries')
    .update({
      status: 'approved',
      reviewed_by: caller.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', entryId)

  if (error) return { error: 'Erro ao aprovar apontamento.' }

  await logAudit({
    action: 'timesheet.approved',
    entity: 'timesheet_entry',
    entityId: entryId,
    metadata: { approved_by: caller.email, profile_id: existing.profile_id },
  })

  revalidatePath('/sistema/apontamentos')
  revalidatePath('/sistema/apontamentos/aprovacoes')
  return { success: 'Apontamento aprovado.' }
}

// ============================================================
// rejectEntry
// ============================================================
export async function rejectEntry(
  _prev: TimesheetActionState,
  formData: FormData
): Promise<TimesheetActionState> {
  const caller = await requireApprove()
  const entryId = formData.get('entry_id') as string
  const reason = (formData.get('rejection_reason') as string)?.trim() ?? ''

  if (reason.length < 3) return { error: 'Informe o motivo da rejeição.' }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('timesheet_entries')
    .select('id, status, profile_id')
    .eq('id', entryId)
    .single()

  if (!existing) return { error: 'Apontamento não encontrado.' }
  if (existing.status !== 'submitted') return { error: 'Apenas apontamentos enviados podem ser rejeitados.' }

  const { error } = await supabase
    .from('timesheet_entries')
    .update({
      status: 'rejected',
      reviewed_by: caller.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', entryId)

  if (error) return { error: 'Erro ao rejeitar apontamento.' }

  await logAudit({
    action: 'timesheet.rejected',
    entity: 'timesheet_entry',
    entityId: entryId,
    metadata: { rejected_by: caller.email, reason, profile_id: existing.profile_id },
  })

  revalidatePath('/sistema/apontamentos')
  revalidatePath('/sistema/apontamentos/aprovacoes')
  return { success: 'Apontamento rejeitado.' }
}
