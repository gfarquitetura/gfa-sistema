import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { UsersTable } from './_components/users-table'
import { CreateUserDialog } from './_components/create-user-dialog'

export const metadata: Metadata = {
  title: 'Usuários — GFA Projetos',
}

export default async function UsuariosPage() {
  const profile = await getProfile()

  if (!profile || !hasPermission(profile.role, 'users:manage')) {
    redirect('/sistema')
  }

  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-light text-zinc-100">Usuários</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {users?.length ?? 0} usuário{users?.length !== 1 ? 's' : ''} cadastrado{users?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <CreateUserDialog />
      </div>

      {/* Table */}
      <UsersTable users={users ?? []} currentUserId={profile.id} />
    </div>
  )
}
