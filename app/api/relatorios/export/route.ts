import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { hasPermission } from '@/lib/auth/roles'
import { formatBRL } from '@/lib/projects/format'

function getPeriodRange(period: string): { from: string | null; to: string | null } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (period === 'last_month') {
    return {
      from: new Date(y, m - 1, 1).toISOString().slice(0, 10),
      to:   new Date(y, m, 0).toISOString().slice(0, 10),
    }
  }
  if (period === 'year') return { from: `${y}-01-01`, to: `${y}-12-31` }
  if (period === 'all')  return { from: null, to: null }

  // default: current month
  return {
    from: new Date(y, m, 1).toISOString().slice(0, 10),
    to:   new Date(y, m + 1, 0).toISOString().slice(0, 10),
  }
}

export async function GET(request: NextRequest) {
  const profile = await getProfile()
  if (!profile || !hasPermission(profile.role, 'finances:read')) {
    return new NextResponse('Não autorizado.', { status: 401 })
  }

  const period = request.nextUrl.searchParams.get('period') ?? 'month'
  const { from, to } = getPeriodRange(period)

  const supabase = await createClient()

  let expQ = supabase
    .from('expenses')
    .select('description, amount, expense_date, notes, project_id, category_id')
    .order('expense_date', { ascending: false })
  if (from) expQ = expQ.gte('expense_date', from)
  if (to)   expQ = expQ.lte('expense_date', to)

  const [expResult, catResult, projResult] = await Promise.all([
    expQ,
    supabase.from('expense_categories').select('id, name'),
    supabase.from('projects').select('id, code, name'),
  ])

  if (expResult.error) return new NextResponse('Erro ao exportar.', { status: 500 })

  const catMap  = new Map((catResult.data ?? []).map((c) => [c.id, c.name]))
  const projMap = new Map((projResult.data ?? []).map((p) => [p.id, `${p.code} — ${p.name}`]))

  function esc(v: string | null | undefined): string {
    if (!v) return ''
    return `"${String(v).replace(/"/g, '""')}"`
  }

  const BOM     = '\uFEFF'
  const HEADERS = ['Data', 'Descrição', 'Projeto', 'Categoria', 'Valor', 'Observações']

  const rows = (expResult.data ?? []).map((e) => [
    e.expense_date,
    esc(e.description),
    esc(e.project_id ? projMap.get(e.project_id) : 'Overhead / interno'),
    esc(e.category_id ? catMap.get(e.category_id) : 'Sem categoria'),
    formatBRL(e.amount),
    esc(e.notes),
  ].join(','))

  const filename = `despesas-${period}-${new Date().toISOString().slice(0, 10)}.csv`
  const csv = BOM + [HEADERS.join(','), ...rows].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
