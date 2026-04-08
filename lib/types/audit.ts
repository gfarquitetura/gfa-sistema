// ============================================================
// Audit action keys — one per significant event in the system.
// Convention: entity.verb  (e.g. 'user.created')
// Extend as new phases are built.
// ============================================================

export type AuditAction =
  // Auth
  | 'auth.login'
  | 'auth.logout'

  // Users (Phase 1)
  | 'user.created'
  | 'user.updated'
  | 'user.role_changed'
  | 'user.deactivated'
  | 'user.reactivated'

  // Clients (Phase 2)
  | 'client.created'
  | 'client.updated'
  | 'client.deactivated'
  | 'client.reactivated'
  | 'client.deleted'

  // Projects (Phase 3)
  | 'project.created'
  | 'project.updated'
  | 'project.status_changed'
  | 'project.member_added'
  | 'project.member_removed'
  | 'project.deleted'

  // Finances (Phase 4)
  | 'expense.created'
  | 'expense.updated'
  | 'expense.deleted'

  // Timesheets (Phase 5)
  | 'timesheet.submitted'
  | 'timesheet.approved'
  | 'timesheet.rejected'
