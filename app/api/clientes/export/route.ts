import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { formatDocument, formatPhone, formatCep } from '@/lib/clients/format'

export async function GET(request: NextRequest) {
  const profile = await getProfile()
  if (!profile) {
    return new NextResponse('Não autorizado.', { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const q      = searchParams.get('q')
  const status = searchParams.get('status') ?? 'active'

  const supabase = await createClient()
  let query = supabase
    .from('clients')
    .select('name,trade_name,document_type,document_number,email,phone,cep,logradouro,numero,bairro,cidade,estado,is_active,created_at')
    .order('name', { ascending: true })

  if (status === 'active')   query = query.eq('is_active', true)
  if (status === 'inactive') query = query.eq('is_active', false)
  if (q)                     query = query.ilike('name', `%${q}%`)

  const { data: clients, error } = await query
  if (error) return new NextResponse('Erro ao buscar clientes.', { status: 500 })

  // Build CSV (no dependency — xlsx added later if rich Excel is needed)
  const BOM = '\uFEFF' // UTF-8 BOM for Excel to recognise pt-BR chars
  const HEADERS = [
    'Nome',
    'Nome Fantasia',
    'Tipo',
    'CPF / CNPJ',
    'E-mail',
    'Telefone',
    'CEP',
    'Logradouro',
    'Número',
    'Bairro',
    'Cidade',
    'UF',
    'Status',
    'Cadastrado em',
  ]

  function esc(v: string | null | undefined): string {
    if (!v) return ''
    return `"${v.replace(/"/g, '""')}"`
  }

  const rows = (clients ?? []).map((c) => [
    esc(c.name),
    esc(c.trade_name),
    c.document_type === 'cpf' ? 'Pessoa Física' : 'Pessoa Jurídica',
    esc(formatDocument(c.document_number, c.document_type)),
    esc(c.email),
    esc(c.phone ? formatPhone(c.phone) : null),
    esc(c.cep ? formatCep(c.cep) : null),
    esc(c.logradouro),
    esc(c.numero),
    esc(c.bairro),
    esc(c.cidade),
    esc(c.estado),
    c.is_active ? 'Ativo' : 'Inativo',
    new Date(c.created_at).toLocaleDateString('pt-BR'),
  ].join(','))

  const csv = BOM + [HEADERS.join(','), ...rows].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="clientes.csv"',
    },
  })
}
