'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/auth/get-profile'
import { logAudit } from '@/lib/audit/log'

export type AIActionState =
  | { error: string }
  | { success: string; details: string }
  | undefined

// ── Guard — admin only ─────────────────────────────────────────────────────
async function requireAdmin() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    throw new Error('Sem permissão. Apenas administradores podem executar esta ação.')
  }
  return profile
}

// ── resetAIData ────────────────────────────────────────────────────────────
// Deletes:
//   • All rows in ai_documents (knowledge base chunks + embeddings)
//   • All rows in conversation_messages (cascaded via FK, but deleted explicitly)
//   • All rows in conversations
//   • All files in the pdf-uploads storage bucket
export async function resetAIData(
  _prev: AIActionState,
  formData: FormData
): Promise<AIActionState> {
  try {
    const profile = await requireAdmin()

    // Require the user to type "RESETAR" to confirm
    const confirmation = (formData.get('confirmation') as string | null)?.trim()
    if (confirmation !== 'RESETAR') {
      return { error: 'Confirmação incorreta. Digite exatamente "RESETAR" para continuar.' }
    }

    const supabase = await createClient()
    const admin    = createAdminClient()

    // 1. Delete all conversation messages (FK-safe explicit delete)
    const { error: msgErr } = await supabase
      .from('conversation_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // match all rows

    if (msgErr) return { error: `Erro ao apagar mensagens: ${msgErr.message}` }

    // 2. Delete all conversations
    const { error: convErr } = await supabase
      .from('conversations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (convErr) return { error: `Erro ao apagar conversas: ${convErr.message}` }

    // 3. Delete all AI document chunks (and their embeddings)
    const { error: docErr } = await supabase
      .from('ai_documents')
      .delete()
      .neq('id', 0)

    if (docErr) return { error: `Erro ao apagar documentos: ${docErr.message}` }

    // 4. Empty the pdf-uploads storage bucket
    const { data: files, error: listErr } = await admin.storage
      .from('pdf-uploads')
      .list()

    if (!listErr && files && files.length > 0) {
      const paths = files.map((f) => f.name)
      await admin.storage.from('pdf-uploads').remove(paths)
    }

    // 5. Audit log
    await logAudit({
      userId:    profile.id,
      userEmail: profile.email,
      action:    'ai.data_reset',
      entity:    'ai_documents',
      metadata:  { triggered_by: profile.email },
    })

    return {
      success: 'Reset completo.',
      details: 'Base de conhecimento, histórico de conversas e arquivos de storage foram apagados.',
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erro inesperado.' }
  }
}
