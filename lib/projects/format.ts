import type { ProjectStatus } from '@/lib/types/database'

// ============================================================
// Currency — stored as integer cents, displayed as BRL
// ============================================================

/** 125000 (cents) → "R$ 1.250,00" */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

/** "1.250,00" or "1250,00" or "1250" → 125000 (cents) */
export function parseBRLtoCents(raw: string): number {
  // Remove currency symbol, spaces, then normalise BR decimal separator
  const cleaned = raw
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')      // remove thousand separators
    .replace(',', '.')       // decimal comma → dot
  const value = parseFloat(cleaned)
  if (isNaN(value)) return 0
  return Math.round(value * 100)
}

/** 125000 (cents) → "1.250,00" — for input defaultValue */
export function centsToInputValue(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ============================================================
// Date — ISO (YYYY-MM-DD) ↔ pt-BR (DD/MM/YYYY)
// ============================================================

/** "2026-04-08" → "08/04/2026" */
export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** "08/04/2026" → "2026-04-08" (for input[type=date]) */
export function parseDateBR(br: string): string {
  const [d, m, y] = br.split('/')
  return `${y}-${m}-${d}`
}

// ============================================================
// Status labels & colours
// ============================================================

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  proposal:  'Proposta',
  active:    'Ativo',
  paused:    'Pausado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  proposal:  'bg-zinc-800 text-zinc-400 border-zinc-700',
  active:    'bg-emerald-900/40 text-emerald-400 border-emerald-800',
  paused:    'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  completed: 'bg-blue-900/40 text-blue-400 border-blue-800',
  cancelled: 'bg-red-900/30 text-red-400 border-red-900',
}

// Valid next statuses from a given current status
export const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  proposal:  ['active', 'cancelled'],
  active:    ['paused', 'completed', 'cancelled'],
  paused:    ['active', 'cancelled'],
  completed: [],
  cancelled: [],
}
