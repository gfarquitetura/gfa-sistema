// ============================================================
// Time utilities — stored as integer minutes (bigint-safe JS number)
// ============================================================

/**
 * 90 → "1h 30min" | 60 → "1h" | 30 → "30min" | 0 → "0min"
 */
export function minutesToDisplay(minutes: number): string {
  if (minutes <= 0) return '0min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

/**
 * Parse a human-typed hours string to integer minutes.
 * Accepts: "1.5" → 90 | "1,5" → 90 | "1:30" → 90 | "90" → 90 (treated as minutes if no colon/decimal)
 * Returns 0 for invalid input. Clamps to [1, 1440].
 */
export function parseHoursInput(raw: string): number {
  const trimmed = raw.trim()
  if (!trimmed) return 0

  // Format "H:MM" or "H:M"
  if (trimmed.includes(':')) {
    const [hPart, mPart] = trimmed.split(':')
    const h = parseInt(hPart ?? '0', 10)
    const m = parseInt(mPart ?? '0', 10)
    if (isNaN(h) || isNaN(m)) return 0
    return Math.min(1440, Math.max(0, h * 60 + m))
  }

  // Decimal hours "1.5" or "1,5"
  const normalised = trimmed.replace(',', '.')
  const value = parseFloat(normalised)
  if (isNaN(value)) return 0
  return Math.min(1440, Math.max(0, Math.round(value * 60)))
}

/**
 * Convert stored minutes back to a display string for a form input.
 * 90 → "1.5" | 60 → "1" | 30 → "0.5"
 */
export function hoursInputValue(minutes: number): string {
  if (minutes <= 0) return ''
  const h = minutes / 60
  return h % 1 === 0 ? String(h) : parseFloat(h.toFixed(2)).toString()
}

// ============================================================
// ISO week helpers
// ============================================================

/**
 * Returns the ISO week string for a date: "2026-W15"
 */
export function toISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/**
 * Returns [monday, sunday] as ISO date strings for a given "YYYY-Www" week string.
 * "2026-W15" → ["2026-04-06", "2026-04-12"]
 */
export function weekBounds(isoWeek: string): [string, string] {
  const [yearStr, wStr] = isoWeek.split('-W')
  const year = parseInt(yearStr ?? '2026', 10)
  const week = parseInt(wStr ?? '1', 10)

  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7
  const monday = new Date(jan4)
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7)

  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  return [
    monday.toISOString().slice(0, 10),
    sunday.toISOString().slice(0, 10),
  ]
}

/**
 * Returns prev/next ISO week strings for a given week.
 */
export function adjacentWeeks(isoWeek: string): { prev: string; next: string } {
  const [start] = weekBounds(isoWeek)
  const date = new Date(start + 'T00:00:00Z')
  const prevDate = new Date(date)
  prevDate.setUTCDate(date.getUTCDate() - 7)
  const nextDate = new Date(date)
  nextDate.setUTCDate(date.getUTCDate() + 7)
  return { prev: toISOWeek(prevDate), next: toISOWeek(nextDate) }
}

/**
 * Format an ISO date string as DD/MM (short, for day headers).
 */
export function formatDayBR(isoDate: string): string {
  return `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`
}

// Day labels in pt-BR, Monday-first (index 0 = Monday)
export const DAY_LABELS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

// Status labels and colors mirroring the projects pattern
export const ENTRY_STATUS_LABELS: Record<string, string> = {
  draft:     'Rascunho',
  submitted: 'Aguardando',
  approved:  'Aprovado',
  rejected:  'Rejeitado',
}

export const ENTRY_STATUS_COLORS: Record<string, string> = {
  draft:     'text-zinc-500 border-zinc-700',
  submitted: 'text-yellow-400 border-yellow-800',
  approved:  'text-emerald-400 border-emerald-800',
  rejected:  'text-red-400 border-red-800',
}
