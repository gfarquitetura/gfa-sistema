import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { AuditAction } from '@/lib/types/audit'

interface LogAuditParams {
  action: AuditAction
  entity: string
  entityId?: string
  metadata?: Record<string, unknown>
  /** Pass explicitly when auth session isn't yet readable (e.g. right after login). */
  userId?: string
  userEmail?: string
}

/**
 * Writes one entry to audit_logs.
 * Never throws — a log failure must never crash the calling action.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const supabase = await createClient()

    // Resolve caller identity
    let userId = params.userId ?? null
    let userEmail = params.userEmail ?? null

    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id ?? null
      userEmail = user?.email ?? null
    }

    // Best-effort IP from reverse-proxy header
    const headersList = await headers()
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? null

    await supabase.from('audit_logs').insert({
      user_id: userId,
      user_email: userEmail,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? null,
      ip_address: ip,
    })
  } catch (err) {
    // Log to console in dev; swap for a proper error tracker (Sentry etc.) later
    console.error('[audit] failed to write log entry:', err)
  }
}
