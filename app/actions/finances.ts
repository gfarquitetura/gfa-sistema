'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/guards'
import { logAudit } from '@/lib/audit/log'
import { parseBRLtoCents } from '@/lib/projects/format'
import { z } from 'zod'

export type FinanceActionState =
  | { error: string }
  | { success: string }
  | undefined

const requireFinancesManage = () => requirePermission('finances:manage')

const expenseSchema = z.object({
  description:  z.string().min(2, 'Descrição deve ter ao menos 2 caracteres.').max(300),
  amount:       z.number().int().min(1, 'Valor deve ser maior que zero.').max(50_000_000, 'Valor máximo é R$ 500.000,00.'),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  project_id:   z.string().uuid().optional().nullable(),
  category_id:  z.string().uuid().optional().nullable(),
  notes:        z.string().max(1000).optional().nullable(),
})

function extractExpenseData(formData: FormData) {
  return {
    description:  (formData.get('description') as string)?.trim() ?? '',
    amount:       parseBRLtoCents(formData.get('amount') as string ?? '0'),
    expense_date: formData.get('expense_date') as string,
    project_id:   (formData.get('project_id') as string) || null,
    category_id:  (formData.get('category_id') as string) || null,
    notes:        (formData.get('notes') as string)?.trim() || null,
  }
}

// ============================================================
// Create expense
// ============================================================
export async function createExpense(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const caller = await requireFinancesManage()
  const data = extractExpenseData(formData)

  const parsed = expenseSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data: created, error } = await supabase
    .from('expenses')
    .insert({ ...parsed.data, created_by: caller.id, updated_by: caller.id })
    .select('id, description, project_id')
    .single()

  if (error) return { error: 'Erro ao registrar despesa.' }

  await logAudit({
    action: 'expense.created',
    entity: 'expense',
    entityId: created.id,
    metadata: {
      description: created.description,
      amount: parsed.data.amount,
      project_id: parsed.data.project_id,
      created_by: caller.email,
    },
  })

  revalidatePath('/sistema/financeiro')
  if (parsed.data.project_id) {
    revalidatePath(`/sistema/projetos/${parsed.data.project_id}`)
  }
  return { success: 'Despesa registrada.' }
}

// ============================================================
// Update expense
// ============================================================
export async function updateExpense(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const caller = await requireFinancesManage()
  const expenseId = formData.get('expense_id') as string
  const data = extractExpenseData(formData)

  const parsed = expenseSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .update({ ...parsed.data, updated_by: caller.id })
    .eq('id', expenseId)

  if (error) return { error: 'Erro ao atualizar despesa.' }

  await logAudit({
    action: 'expense.updated',
    entity: 'expense',
    entityId: expenseId,
    metadata: { description: parsed.data.description, updated_by: caller.email },
  })

  revalidatePath('/sistema/financeiro')
  if (parsed.data.project_id) revalidatePath(`/sistema/projetos/${parsed.data.project_id}`)
  return { success: 'Despesa atualizada.' }
}

// ============================================================
// Delete expense
// ============================================================
export async function deleteExpense(
  _prev: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const caller = await requireFinancesManage()
  const expenseId = formData.get('expense_id') as string
  const projectId = formData.get('project_id') as string | null

  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)

  if (error) return { error: 'Erro ao excluir despesa.' }

  await logAudit({
    action: 'expense.deleted',
    entity: 'expense',
    entityId: expenseId,
    metadata: { deleted_by: caller.email },
  })

  revalidatePath('/sistema/financeiro')
  if (projectId) revalidatePath(`/sistema/projetos/${projectId}`)
  return { success: 'Despesa excluída.' }
}
