import { z } from 'zod'

export const projectSchema = z.object({
  name:           z.string().min(2, 'Nome deve ter ao menos 2 caracteres.').max(200),
  description:    z.string().max(2000).optional().nullable(),
  client_id:      z.string().uuid('Selecione um cliente.'),
  contract_value: z.number().int().min(0, 'Valor inválido.'), // cents
  start_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.').optional().nullable().or(z.literal('')),
  end_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.').optional().nullable().or(z.literal('')),
  deadline:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.').optional().nullable().or(z.literal('')),
  notes:          z.string().max(2000).optional().nullable(),
})

export type ProjectFormValues = z.infer<typeof projectSchema>
