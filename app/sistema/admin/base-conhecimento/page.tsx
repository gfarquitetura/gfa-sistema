import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'

export default async function BaseConhecimentoPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') redirect('/sistema')

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-zinc-100 mb-1">Base de Conhecimento</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Gerenciamento de documentos de IA.
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex gap-4 items-start">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <div>
          <p className="text-sm font-medium text-zinc-200 mb-1">
            Upload de documentos movido para o Aireponado
          </p>
          <p className="text-sm text-zinc-500">
            O gerenciamento da base de conhecimento (upload, indexação e remoção de PDFs)
            agora é feito diretamente no painel administrativo do Aireponado.
          </p>
        </div>
      </div>
    </div>
  )
}
