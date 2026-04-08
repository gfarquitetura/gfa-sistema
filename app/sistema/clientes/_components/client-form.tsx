'use client'

import { useActionState, useState } from 'react'
import { createClient, updateClient, type ClientActionState } from '@/app/actions/clients'
import { clientSchema } from '@/lib/clients/validation'
import { maskPhone, digitsOnly } from '@/lib/clients/format'
import { DocumentField } from './document-field'
import { CepField, type ViaCepResult } from './cep-field'
import type { Client } from '@/lib/types/database'

interface ClientFormProps {
  initialData?: Client
}

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
]

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-400 mt-1">{message}</p>
}

export function ClientForm({ initialData }: ClientFormProps) {
  const isEdit = !!initialData
  const action = isEdit ? updateClient : createClient

  const [state, formAction, pending] = useActionState<ClientActionState, FormData>(
    action,
    undefined
  )

  // Client-side validation errors (pre-submission)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Address fields (can be filled by CEP auto-fill)
  const [address, setAddress] = useState({
    logradouro: initialData?.logradouro ?? '',
    bairro:     initialData?.bairro ?? '',
    cidade:     initialData?.cidade ?? '',
    estado:     initialData?.estado ?? '',
  })
  const [addressLocked, setAddressLocked] = useState(false)

  // Phone display state
  const [phoneDisplay, setPhoneDisplay] = useState(
    initialData?.phone ? maskPhone(initialData.phone) : ''
  )

  function handleCepFilled(result: ViaCepResult) {
    setAddress({
      logradouro: result.logradouro,
      bairro:     result.bairro,
      cidade:     result.localidade,
      estado:     result.uf,
    })
    setAddressLocked(true)
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhoneDisplay(maskPhone(e.target.value))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const data = new FormData(form)

    const values = {
      name:            (data.get('name') as string)?.trim(),
      trade_name:      (data.get('trade_name') as string)?.trim() || null,
      document_type:   data.get('document_type') as 'cpf' | 'cnpj',
      document_number: digitsOnly(data.get('document_number') as string),
      email:           (data.get('email') as string)?.trim() || null,
      phone:           digitsOnly(data.get('phone') as string) || null,
      cep:             digitsOnly(data.get('cep') as string) || null,
      logradouro:      (data.get('logradouro') as string)?.trim() || null,
      numero:          (data.get('numero') as string)?.trim() || null,
      complemento:     (data.get('complemento') as string)?.trim() || null,
      bairro:          (data.get('bairro') as string)?.trim() || null,
      cidade:          (data.get('cidade') as string)?.trim() || null,
      estado:          (data.get('estado') as string)?.trim() || null,
      notes:           (data.get('notes') as string)?.trim() || null,
    }

    const result = clientSchema.safeParse(values)
    if (!result.success) {
      e.preventDefault()
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string
        if (!errors[key]) errors[key] = issue.message
      })
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
  }

  const err = (field: string) => fieldErrors[field]

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 max-w-2xl"
    >
      {isEdit && (
        <input type="hidden" name="client_id" value={initialData.id} />
      )}

      {/* Server error */}
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

      {/* ── Identificação ── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Identificação</h2>
        <div className="flex flex-col gap-4">
          <DocumentField
            defaultType={initialData?.document_type}
            defaultValue={initialData?.document_number}
            error={err('document_number')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs uppercase tracking-widest text-zinc-500">
              Nome / Razão Social <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={initialData?.name}
              className={`bg-zinc-900 border rounded px-4 py-2.5 text-sm text-zinc-100 focus:outline-none transition-colors ${err('name') ? 'border-red-700' : 'border-zinc-800 focus:border-zinc-500'}`}
            />
            <FieldError message={err('name')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="trade_name" className="text-xs uppercase tracking-widest text-zinc-500">
              Nome Fantasia
            </label>
            <input
              id="trade_name"
              name="trade_name"
              type="text"
              defaultValue={initialData?.trade_name ?? ''}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* ── Contato ── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Contato</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs uppercase tracking-widest text-zinc-500">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={initialData?.email ?? ''}
              className={`bg-zinc-900 border rounded px-4 py-2.5 text-sm text-zinc-100 focus:outline-none transition-colors ${err('email') ? 'border-red-700' : 'border-zinc-800 focus:border-zinc-500'}`}
            />
            <FieldError message={err('email')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-xs uppercase tracking-widest text-zinc-500">
              Telefone
            </label>
            <input type="hidden" name="phone" value={digitsOnly(phoneDisplay)} />
            <input
              id="phone"
              type="text"
              inputMode="numeric"
              value={phoneDisplay}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* ── Endereço ── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Endereço</h2>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <CepField
              defaultValue={initialData?.cep ?? ''}
              onAddressFilled={handleCepFilled}
            />

            <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label htmlFor="logradouro" className="text-xs uppercase tracking-widest text-zinc-500">
                  Logradouro
                </label>
                {addressLocked && (
                  <button
                    type="button"
                    onClick={() => setAddressLocked(false)}
                    className="text-[0.6rem] text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    editar
                  </button>
                )}
              </div>
              <input
                id="logradouro"
                name="logradouro"
                type="text"
                value={address.logradouro}
                onChange={(e) => setAddress((a) => ({ ...a, logradouro: e.target.value }))}
                readOnly={addressLocked}
                className={`bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors ${addressLocked ? 'opacity-60' : ''}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="numero" className="text-xs uppercase tracking-widest text-zinc-500">
                Número
              </label>
              <input
                id="numero"
                name="numero"
                type="text"
                defaultValue={initialData?.numero ?? ''}
                className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="complemento" className="text-xs uppercase tracking-widest text-zinc-500">
                Complemento
              </label>
              <input
                id="complemento"
                name="complemento"
                type="text"
                defaultValue={initialData?.complemento ?? ''}
                className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="bairro" className="text-xs uppercase tracking-widest text-zinc-500">
                Bairro
              </label>
              <input
                id="bairro"
                name="bairro"
                type="text"
                value={address.bairro}
                onChange={(e) => setAddress((a) => ({ ...a, bairro: e.target.value }))}
                readOnly={addressLocked}
                className={`bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors ${addressLocked ? 'opacity-60' : ''}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cidade" className="text-xs uppercase tracking-widest text-zinc-500">
                Cidade
              </label>
              <input
                id="cidade"
                name="cidade"
                type="text"
                value={address.cidade}
                onChange={(e) => setAddress((a) => ({ ...a, cidade: e.target.value }))}
                readOnly={addressLocked}
                className={`bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors ${addressLocked ? 'opacity-60' : ''}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="estado" className="text-xs uppercase tracking-widest text-zinc-500">
                UF
              </label>
              {addressLocked ? (
                <>
                  <input type="hidden" name="estado" value={address.estado} />
                  <input
                    id="estado"
                    type="text"
                    value={address.estado}
                    readOnly
                    className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm opacity-60"
                  />
                </>
              ) : (
                <select
                  id="estado"
                  name="estado"
                  value={address.estado}
                  onChange={(e) => setAddress((a) => ({ ...a, estado: e.target.value }))}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                >
                  <option value="">—</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf} className="bg-zinc-900">{uf}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Observações ── */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Observações</h2>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initialData?.notes ?? ''}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors resize-none"
          placeholder="Informações adicionais sobre o cliente..."
        />
      </section>

      {/* ── Actions ── */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-zinc-100 text-zinc-950 text-xs font-semibold uppercase tracking-widest rounded hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending
            ? 'Salvando...'
            : isEdit
            ? 'Salvar alterações'
            : 'Cadastrar cliente'}
        </button>
        <a
          href={isEdit ? `/sistema/clientes/${initialData.id}` : '/sistema/clientes'}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
