import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { Sidebar } from './_components/sidebar'

export default async function SistemaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getProfile()

  if (!profile) redirect('/login')
  if (!profile.is_active) redirect('/login?motivo=conta-inativa')

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar
        role={profile.role}
        userEmail={profile.email}
        fullName={profile.full_name}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
