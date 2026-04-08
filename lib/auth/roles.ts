import type { Role } from '@/lib/types/database'

// ============================================================
// Permission keys — one per guarded action in the system.
// Add new ones here as features are built.
// ============================================================
export type Permission =
  | 'users:manage'     // create / deactivate / change role
  | 'clients:manage'   // create / edit clients
  | 'clients:read'
  | 'projects:manage'  // create / edit / assign team
  | 'projects:read'
  | 'finances:manage'  // create / edit expenses and budgets
  | 'finances:read'
  | 'timesheets:approve'
  | 'timesheets:submit'
  | 'reports:read'

const PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'users:manage',
    'clients:manage',
    'clients:read',
    'projects:manage',
    'projects:read',
    'finances:manage',
    'finances:read',
    'timesheets:approve',
    'timesheets:submit',
    'reports:read',
  ],
  financial: [
    'clients:read',
    'projects:read',
    'finances:manage',
    'finances:read',
    'timesheets:approve',
    'reports:read',
  ],
  manager: [
    'clients:manage',
    'clients:read',
    'projects:manage',
    'projects:read',
    'finances:read',
    'timesheets:approve',
    'timesheets:submit',
    'reports:read',
  ],
  readonly: [
    'clients:read',
    'projects:read',
    'finances:read',
    'timesheets:submit',
    'reports:read',
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role].includes(permission)
}

// pt-BR labels for display in the UI
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  financial: 'Financeiro',
  manager: 'Gerente',
  readonly: 'Somente leitura',
}
