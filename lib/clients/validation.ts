import { z } from 'zod'
import { digitsOnly } from './format'

// ============================================================
// CPF check-digit validation (mod-11)
// ============================================================
export function isValidCpf(raw: string): boolean {
  const d = digitsOnly(raw)
  if (d.length !== 11) return false
  if (/^(\d)\1{10}$/.test(d)) return false // all same digits

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

// ============================================================
// CNPJ check-digit validation (mod-11)
// ============================================================
export function isValidCnpj(raw: string): boolean {
  const d = digitsOnly(raw)
  if (d.length !== 14) return false
  if (/^(\d)\1{13}$/.test(d)) return false // all same digits

  const calc = (digits: string, weights: number[]) => {
    const sum = weights.reduce((acc, w, i) => acc + parseInt(digits[i]) * w, 0)
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  return (
    calc(d, w1) === parseInt(d[12]) &&
    calc(d, w2) === parseInt(d[13])
  )
}

// ============================================================
// Zod schema — values are digits-only strings (no formatting)
// ============================================================
export const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.').max(200),
  trade_name: z.string().max(200).optional().nullable(),
  document_type: z.enum(['cpf', 'cnpj']),
  document_number: z.string(),
  email: z
    .string()
    .email('E-mail inválido.')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z.string().max(11).optional().nullable(),
  cep: z
    .string()
    .length(8, 'CEP inválido.')
    .optional()
    .nullable()
    .or(z.literal('')),
  logradouro: z.string().max(300).optional().nullable(),
  numero: z.string().max(20).optional().nullable(),
  complemento: z.string().max(100).optional().nullable(),
  bairro: z.string().max(100).optional().nullable(),
  cidade: z.string().max(100).optional().nullable(),
  estado: z.string().length(2, 'UF inválida.').optional().nullable().or(z.literal('')),
  notes: z.string().max(2000).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.document_type === 'cpf') {
    if (!isValidCpf(data.document_number)) {
      ctx.addIssue({
        code: 'custom',
        path: ['document_number'],
        message: 'CPF inválido.',
      })
    }
  } else {
    if (!isValidCnpj(data.document_number)) {
      ctx.addIssue({
        code: 'custom',
        path: ['document_number'],
        message: 'CNPJ inválido.',
      })
    }
  }
})

export type ClientFormValues = z.infer<typeof clientSchema>
