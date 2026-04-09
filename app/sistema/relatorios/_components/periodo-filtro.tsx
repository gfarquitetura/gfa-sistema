'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PERIODS = [
  { value: 'month',      label: 'Este mês' },
  { value: 'last_month', label: 'Último mês' },
  { value: 'year',       label: 'Este ano' },
  { value: 'all',        label: 'Tudo' },
]

export function PeriodoFiltro() {
  const router = useRouter()
  const sp = useSearchParams()
  const current = sp.get('period') ?? 'month'

  return (
    <div className="flex gap-1 flex-wrap">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => router.push(`/sistema/relatorios?period=${p.value}`)}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${
            current === p.value
              ? 'bg-zinc-700 text-zinc-100'
              : 'border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
