'use client'

import { useState } from 'react'
import { maskCep, digitsOnly } from '@/lib/clients/format'

export interface ViaCepResult {
  logradouro: string
  bairro: string
  localidade: string  // cidade
  uf: string          // estado (2-char)
}

interface CepFieldProps {
  defaultValue?: string
  onAddressFilled: (result: ViaCepResult) => void
}

export function CepField({ defaultValue = '', onAddressFilled }: CepFieldProps) {
  const [display, setDisplay] = useState(
    defaultValue ? maskCep(defaultValue) : ''
  )
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ok'>('idle')

  async function fetchCep(raw: string) {
    if (raw.length !== 8) return
    setStatus('loading')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
      const json = await res.json()
      if (json.erro) {
        setStatus('error')
        return
      }
      onAddressFilled({
        logradouro: json.logradouro ?? '',
        bairro: json.bairro ?? '',
        localidade: json.localidade ?? '',
        uf: json.uf ?? '',
      })
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskCep(e.target.value)
    setDisplay(masked)
    setStatus('idle')
    const raw = digitsOnly(masked)
    if (raw.length === 8) fetchCep(raw)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="cep" className="text-xs uppercase tracking-widest text-zinc-500">
        CEP
      </label>
      {/* Hidden carries raw digits */}
      <input type="hidden" name="cep" value={digitsOnly(display)} />
      <div className="relative">
        <input
          id="cep"
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          placeholder="00000-000"
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors pr-8"
        />
        {status === 'loading' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs animate-pulse">
            ...
          </span>
        )}
        {status === 'ok' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs">✓</span>
        )}
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-400">CEP não encontrado.</p>
      )}
    </div>
  )
}
