'use server'

import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission, type Permission } from '@/lib/auth/roles'
import type { Profile } from '@/lib/types/database'

/**
 * Verifies the caller is authenticated and holds the given permission.
 * Throws "Sem permissão." if either check fails — consistent across all Server Actions.
 *
 * Usage:
 *   const caller = await requirePermission('clients:manage')
 */
export async function requirePermission(permission: Permission): Promise<Profile> {
  const profile = await getProfile()
  if (!profile || !hasPermission(profile.role, permission)) {
    throw new Error('Sem permissão.')
  }
  return profile
}
