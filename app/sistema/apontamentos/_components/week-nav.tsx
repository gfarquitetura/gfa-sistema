'use client'

import { useRouter } from 'next/navigation'
import { adjacentWeeks, weekBounds } from '@/lib/timesheets/format'

interface WeekNavProps {
  currentWeek: string // "2026-W15"
}

export function WeekNav({ currentWeek }: WeekNavProps) {
  const router = useRouter()
  const { prev, next } = adjacentWeeks(currentWeek)
  const [start, end] = weekBounds(currentWeek)
  const [year, wPart] = currentWeek.split('-')
  const weekNum = wPart?.replace('W', '')
  const label = `Semana ${weekNum} / ${year} · ${start.slice(8, 10)}/${start.slice(5, 7)} – ${end.slice(8, 10)}/${end.slice(5, 7)}`

  return (
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={() => router.push(`/sistema/apontamentos?week=${prev}`)}
        className="px-3 py-1.5 text-xs border border-zinc-800 rounded text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
        aria-label="Semana anterior"
      >
        ← Anterior
      </button>
      <span className="text-sm text-zinc-400 min-w-[18rem] text-center">{label}</span>
      <button
        onClick={() => router.push(`/sistema/apontamentos?week=${next}`)}
        className="px-3 py-1.5 text-xs border border-zinc-800 rounded text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
        aria-label="Próxima semana"
      >
        Próxima →
      </button>
    </div>
  )
}
