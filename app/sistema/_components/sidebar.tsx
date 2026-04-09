'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/lib/types/database'
import { hasPermission } from '@/lib/auth/roles'

function Icon({ name, className = 'w-4 h-4' }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: (
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    ),
    users: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    ),
    folder: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m19.5 0v.243a2.25 2.25 0 0 1-2.182 2.25H4.432a2.25 2.25 0 0 1-2.182-2.25V6.75" />
    ),
    banknotes: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    ),
    clock: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    ),
    chart: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    ),
    cog: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </>
    ),
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

const NAV_ITEMS = [
  { label: 'Painel',       href: '/sistema',                icon: 'home' },
  { label: 'Clientes',     href: '/sistema/clientes',       icon: 'users',     permission: 'clients:read' },
  { label: 'Projetos',     href: '/sistema/projetos',       icon: 'folder',    permission: 'projects:read' },
  { label: 'Financeiro',   href: '/sistema/financeiro',     icon: 'banknotes', permission: 'finances:read' },
  { label: 'Apontamentos', href: '/sistema/apontamentos',   icon: 'clock',     permission: 'timesheets:submit' },
  { label: 'Relatórios',   href: '/sistema/relatorios',     icon: 'chart',     permission: 'reports:read' },
  { label: 'Usuários',     href: '/sistema/admin/usuarios', icon: 'cog',       permission: 'users:manage' },
] as const

interface SidebarProps {
  role: Role
  userEmail: string
  fullName: string
}

export function Sidebar({ role, userEmail, fullName }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !('permission' in item) || hasPermission(role, item.permission as Parameters<typeof hasPermission>[1])
  )

  const initials = fullName
    ? fullName.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : userEmail.slice(0, 2).toUpperCase()

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-zinc-950 border-r border-zinc-800/50 px-3 py-5">

      {/* Logo */}
      <div className="mb-7 px-2 pt-1">
        <div className="flex items-center" style={{ gap: 2 }}>
          {/* Red block — G fills it */}
          <div
            className="flex items-center justify-center overflow-hidden shrink-0"
            style={{ width: 28, height: 28, background: '#8B1A1A', borderRadius: 2 }}
          >
            <span
              className="text-white leading-none select-none"
              style={{ fontWeight: 900, fontSize: 24, marginLeft: -2 }}
            >G</span>
          </div>
          {/* FA — same height, black weight */}
          <span
            className="text-zinc-100 leading-none select-none"
            style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.02em' }}
          >FA</span>
        </div>
        <span
          className="uppercase text-zinc-600 select-none block mt-0.5"
          style={{ fontSize: '0.42rem', letterSpacing: '0.42em' }}
        >Projetos</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {visibleItems.map((item) => {
          const active =
            item.href === '/sistema'
              ? pathname === '/sistema'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-zinc-800/80 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Icon
                name={item.icon}
                className={`w-[1.05rem] h-[1.05rem] shrink-0 transition-colors ${
                  active ? '' : ''
                }`}
                {...(active ? { style: { color: '#C0392B' } } : {})}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-zinc-800/50 pt-4 mt-4 px-1">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#3D0A0A', border: '1px solid #6B1A1A' }}
          >
            <span className="text-[0.6rem] font-semibold" style={{ color: '#F87171' }}>
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-zinc-300 truncate leading-tight">{fullName || userEmail}</p>
            <p className="text-[0.6rem] text-zinc-600 truncate mt-0.5">{userEmail}</p>
          </div>
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="w-full text-left text-[0.65rem] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors px-1"
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
