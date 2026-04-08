'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/lib/types/database'
import { hasPermission } from '@/lib/auth/roles'

interface NavItem {
  label: string
  href: string
  permission?: Parameters<typeof hasPermission>[1]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Painel', href: '/sistema' },
  { label: 'Clientes', href: '/sistema/clientes', permission: 'clients:read' },
  { label: 'Projetos', href: '/sistema/projetos', permission: 'projects:read' },
  { label: 'Financeiro', href: '/sistema/financeiro', permission: 'finances:read' },
  { label: 'Apontamentos', href: '/sistema/apontamentos', permission: 'timesheets:submit' },
  { label: 'Relatórios', href: '/sistema/relatorios', permission: 'reports:read' },
  { label: 'Usuários', href: '/sistema/admin/usuarios', permission: 'users:manage' },
]

interface SidebarProps {
  role: Role
  userEmail: string
  fullName: string
}

export function Sidebar({ role, userEmail, fullName }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(role, item.permission)
  )

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-zinc-950 border-r border-zinc-800 px-4 py-6">
      {/* Logo */}
      <div className="mb-8 px-2">
        <p className="text-2xl font-extralight tracking-tight text-zinc-100 leading-none">GF</p>
        <p className="text-[0.55rem] uppercase tracking-[0.4em] text-zinc-600 mt-1">Arquitetura</p>
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
              className={`px-3 py-2.5 rounded text-sm transition-colors ${
                active
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-zinc-800 pt-4 mt-4 px-2">
        <p className="text-xs text-zinc-300 truncate">{fullName || userEmail}</p>
        <p className="text-[0.65rem] text-zinc-600 mt-0.5 truncate">{userEmail}</p>
        <form action="/api/auth/logout" method="post" className="mt-3">
          <button
            type="submit"
            className="text-[0.65rem] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
