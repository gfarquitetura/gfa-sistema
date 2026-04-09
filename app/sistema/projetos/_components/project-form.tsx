'use client'

import { useActionState, useState } from 'react'
import { createProject, updateProject, type ProjectActionState } from '@/app/actions/projects'
import { projectSchema } from '@/lib/projects/validation'
import { centsToInputValue, parseBRLtoCents } from '@/lib/projects/format'
import type { Project, Client } from '@/lib/types/database'

interface ProjectFormProps {
  initialData?: Project
  clients: Pick<Client, 'id' | 'name'>[]
}

export function ProjectForm({ initialData, clients }: ProjectFormProps) {
  const isEdit = !!initialData
  const action = isEdit ? updateProject : createProject

  const [state, formAction, pending] = useActionState<ProjectActionState, FormData>(
    action,
    undefined
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [valueDisplay, setValueDisplay] = useState(
    initialData ? centsToInputValue(initialData.contract_value) : ''
  )

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Allow only digits and BR separators
    const raw = e.target.value.replace(/[^0-9.,]/g, '')
    setValueDisplay(raw)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(e.currentTarget)
    const values = {
      name:           (data.get('name') as string)?.trim(),
      description:    (data.get('description') as string)?.trim() || null,
      client_id:      data.get('client_id') as string,
      contract_value: parseBRLtoCents(valueDisplay),
      start_date:     (data.get('start_date') as string) || null,
      end_date:       (data.get('end_date') as string) || null,
      deadline:       (data.get('deadline') as string) || null,
      notes:          (data.get('notes') as string)?.trim() || null,
    }

    const result = projectSchema.safeParse(values)
    if (!result.success) {
      e.preventDefault()
      const errors: Record<string, string> = {}
      result.error.issues.forEach((i) => {
        const k = i.path[0] as string
        if (!errors[k]) errors[k] = i.message
      })
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
  }

  const err = (f: string) => fieldErrors[f]

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      {isEdit && <input type="hidden" name="project_id" value={initialData.id} />}
      {/* hidden carries parsed cents */}
      <input type="hidden" name="contract_value" value={parseBRLtoCents(valueDisplay)} />

      {state && 'error' in state && (
        <p role="alert" className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded px-4 py-3">
          {state.error}
        </p>
      )}
      {state && 'success' in state && (
        <p role="status" className="text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded px-4 py-3">
          {state.success}
        </p>
      )}

      {/* Identificação */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Identificação</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs uppercase tracking-widest text-zinc-500">
              Nome do projeto <span className="text-red-500">*</span>
            </label>
            <input
              id="name" name="name" type="text" required
              defaultValue={initialData?.name}
              className={`bg-zinc-900 border rounded px-4 py-2.5 text-sm text-zinc-100 focus:outline-none transition-colors ${err('name') ? 'border-red-700' : 'border-zinc-800 focus:border-zinc-500'}`}
            />
            {err('name') && <p className="text-xs text-red-400">{err('name')}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="client_id" className="text-xs uppercase tracking-widest text-zinc-500">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              id="client_id" name="client_id" required
              defaultValue={initialData?.client_id ?? ''}
              className={`bg-zinc-900 border rounded px-4 py-2.5 text-sm text-zinc-100 focus:outline-none transition-colors ${err('client_id') ? 'border-red-700' : 'border-zinc-800 focus:border-zinc-500'}`}
            >
              <option value="">Selecione um cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
              ))}
            </select>
            {err('client_id') && <p className="text-xs text-red-400">{err('client_id')}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs uppercase tracking-widest text-zinc-500">
              Descrição / Escopo
            </label>
            <textarea
              id="description" name="description" rows={3}
              defaultValue={initialData?.description ?? ''}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors resize-none"
            />
          </div>
        </div>
      </section>

      {/* Contrato */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Contrato</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contract_value_display" className="text-xs uppercase tracking-widest text-zinc-500">
              Valor do contrato (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">R$</span>
              <input
                id="contract_value_display"
                type="text"
                inputMode="decimal"
                value={valueDisplay}
                onChange={handleValueChange}
                placeholder="0,00"
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
            {err('contract_value') && <p className="text-xs text-red-400">{err('contract_value')}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="deadline" className="text-xs uppercase tracking-widest text-zinc-500">
              Prazo de entrega
            </label>
            <input
              id="deadline" name="deadline" type="date"
              defaultValue={initialData?.deadline ?? ''}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="start_date" className="text-xs uppercase tracking-widest text-zinc-500">
              Data de início
            </label>
            <input
              id="start_date" name="start_date" type="date"
              defaultValue={initialData?.start_date ?? ''}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="end_date" className="text-xs uppercase tracking-widest text-zinc-500">
              Data de conclusão
            </label>
            <input
              id="end_date" name="end_date" type="date"
              defaultValue={initialData?.end_date ?? ''}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Observações */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Observações</h2>
        <textarea
          name="notes" rows={3}
          defaultValue={initialData?.notes ?? ''}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors resize-none"
          placeholder="Informações adicionais sobre o projeto..."
        />
      </section>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit" disabled={pending}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar projeto'}
        </button>
        <a
          href={isEdit ? `/sistema/projetos/${initialData.id}` : '/sistema/projetos'}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
