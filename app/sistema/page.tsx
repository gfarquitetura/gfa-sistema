import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Painel — GF Arquitetura',
}

export default function SistemaPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-light text-zinc-100">Painel</h1>
      <p className="text-sm text-zinc-500 mt-2">Em construção.</p>
    </div>
  )
}
