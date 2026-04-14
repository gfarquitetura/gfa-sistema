import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GFA Projetos — Sistema',
}

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  // Supabase auth callbacks sometimes land here instead of /auth/callback.
  // Forward any auth params so the callback route can handle them.
  const params = await searchParams
  if (params.code || params.token_hash) {
    const qs = new URLSearchParams(
      Object.entries(params).filter((e): e is [string, string] => e[1] !== undefined)
    ).toString()
    redirect(`/auth/callback?${qs}`)
  }

  redirect('/login')
}
