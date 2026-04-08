'use client'

import { useState } from 'react'
import { maskDocument, digitsOnly } from '@/lib/clients/format'

interface DocumentFieldProps {
  defaultType?: 'cpf' | 'cnpj'
  defaultValue?: string
  error?: string
}

export function DocumentField({
  defaultType = 'cpf',
  defaultValue = '',
  error,
}: DocumentFieldProps) {
  const [type, setType] = useState<'cpf' | 'cnpj'>(defaultType)
  const [display, setDisplay] = useState(
    defaultValue ? maskDocument(defaultValue, defaultType) : ''
  )

  function handleTypeChange(next: 'cpf' | 'cnpj') {
    setType(next)
    setDisplay('') // clear — different digit lengths
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDisplay(maskDocument(e.target.value, type))
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Type toggle */}
      <div className="flex gap-1 mb-0.5">
        {(['cpf', 'cnpj'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              type === t
                ? 'bg-zinc-700 text-zinc-100'
                : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
            }`}
          >
            {t === 'cpf' ? 'Pessoa Física (CPF)' : 'Pessoa Jurídica (CNPJ)'}
          </button>
        ))}
      </div>

      <label htmlFor="document_number" className="text-xs uppercase tracking-widest text-zinc-500">
        {type === 'cpf' ? 'CPF' : 'CNPJ'}
      </label>

      {/* Hidden fields carry the raw digits and type to the Server Action */}
      <input type="hidden" name="document_type" value={type} />
      <input type="hidden" name="document_number" value={digitsOnly(display)} />

      <input
        id="document_number"
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={type === 'cpf' ? '000.000.000-00' : '00.000.000/0001-00'}
        className={`bg-zinc-900 border rounded px-4 py-2.5 text-sm text-zinc-100 focus:outline-none transition-colors ${
          error ? 'border-red-700 focus:border-red-500' : 'border-zinc-800 focus:border-zinc-500'
        }`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
