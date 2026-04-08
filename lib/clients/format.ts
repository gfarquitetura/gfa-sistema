// ============================================================
// Display formatters — receive raw digit strings, return formatted strings.
// These are pure functions; safe to use on client and server.
// ============================================================

/** "12345678901" → "123.456.789-01" */
export function formatCpf(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 11).padEnd(11, '_')
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`
}

/** "12345678000195" → "12.345.678/0001-95" */
export function formatCnpj(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 14).padEnd(14, '_')
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`
}

export function formatDocument(digits: string, type: 'cpf' | 'cnpj'): string {
  return type === 'cpf' ? formatCpf(digits) : formatCnpj(digits)
}

/** "11987654321" → "(11) 98765-4321" */
export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) {
    return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6,10)}`
  }
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`
}

/** "01310100" → "01310-100" */
export function formatCep(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0,5)}-${d.slice(5,8)}`
}

// ============================================================
// Mask helpers for controlled inputs
// Strip non-digits then apply the format as the user types.
// ============================================================

export function maskCpf(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

export function maskCnpj(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}

export function maskDocument(raw: string, type: 'cpf' | 'cnpj'): string {
  return type === 'cpf' ? maskCpf(raw) : maskCnpj(raw)
}

export function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

export function maskCep(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0,5)}-${d.slice(5)}`
}

/** Extract digits only from any formatted string */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}
