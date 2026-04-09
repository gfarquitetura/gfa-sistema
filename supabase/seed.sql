-- ================================================================
-- GFA Projetos — Demo Seed Data
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to re-run: cleans up previous demo data before inserting
-- ================================================================

-- ----------------------------------------------------------------
-- STEP 0: Clean up any previous demo data (makes re-runs safe)
-- ----------------------------------------------------------------

delete from public.timesheet_entries
  where profile_id in (
    'aa000001-0000-0000-0000-000000000001',
    'aa000002-0000-0000-0000-000000000002',
    'aa000003-0000-0000-0000-000000000003',
    'aa000004-0000-0000-0000-000000000004'
  );

delete from public.project_members
  where project_id in (
    'b0000001-0000-0000-0000-000000000001','b0000002-0000-0000-0000-000000000002',
    'b0000003-0000-0000-0000-000000000003','b0000004-0000-0000-0000-000000000004',
    'b0000005-0000-0000-0000-000000000005','b0000006-0000-0000-0000-000000000006',
    'b0000007-0000-0000-0000-000000000007','b0000008-0000-0000-0000-000000000008',
    'b0000009-0000-0000-0000-000000000009','b0000010-0000-0000-0000-000000000010',
    'b0000011-0000-0000-0000-000000000011','b0000012-0000-0000-0000-000000000012'
  );

delete from public.expenses
  where project_id in (
    'b0000001-0000-0000-0000-000000000001','b0000002-0000-0000-0000-000000000002',
    'b0000003-0000-0000-0000-000000000003','b0000004-0000-0000-0000-000000000004',
    'b0000005-0000-0000-0000-000000000005','b0000008-0000-0000-0000-000000000008'
  );

-- Remove overhead expenses inserted by seed (identified by description pattern)
delete from public.expenses
  where project_id is null
    and description in (
      'Assinatura Adobe CC — anual (2 usuários)',
      'AutoCAD LT — renovação anual',
      'Material de escritório — Q1/2026',
      'Café e copa — fevereiro',
      'Café e copa — março',
      'Transporte urbano — equipe março',
      'Estagiário — fevereiro (160h)',
      'Estagiário — março (160h)'
    );

delete from public.projects
  where id in (
    'b0000001-0000-0000-0000-000000000001','b0000002-0000-0000-0000-000000000002',
    'b0000003-0000-0000-0000-000000000003','b0000004-0000-0000-0000-000000000004',
    'b0000005-0000-0000-0000-000000000005','b0000006-0000-0000-0000-000000000006',
    'b0000007-0000-0000-0000-000000000007','b0000008-0000-0000-0000-000000000008',
    'b0000009-0000-0000-0000-000000000009','b0000010-0000-0000-0000-000000000010',
    'b0000011-0000-0000-0000-000000000011','b0000012-0000-0000-0000-000000000012'
  )
  -- also catch orphans from a previous failed run with different UUIDs
  or code in (
    'GFA-2026-001','GFA-2026-002','GFA-2026-003','GFA-2026-004',
    'GFA-2026-005','GFA-2026-006','GFA-2026-007','GFA-2025-008',
    'GFA-2025-009','GFA-2026-010','GFA-2025-011','GFA-2026-012'
  );

delete from public.clients
  where id in (
    'cc000001-0000-0000-0000-000000000001','cc000002-0000-0000-0000-000000000002',
    'cc000003-0000-0000-0000-000000000003','cc000004-0000-0000-0000-000000000004',
    'cc000005-0000-0000-0000-000000000005','cc000006-0000-0000-0000-000000000006',
    'cc000007-0000-0000-0000-000000000007','cc000008-0000-0000-0000-000000000008',
    'cc000009-0000-0000-0000-000000000009','cc000010-0000-0000-0000-000000000010'
  );

delete from auth.users
  where id in (
    'aa000001-0000-0000-0000-000000000001',
    'aa000002-0000-0000-0000-000000000002',
    'aa000003-0000-0000-0000-000000000003',
    'aa000004-0000-0000-0000-000000000004'
  );

-- ----------------------------------------------------------------
-- STEP 1: Demo users (auth + profiles)
-- All demo accounts share the password:  Demo@2026
-- ----------------------------------------------------------------

insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  (
    'aa000001-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'gabriel.fernandes@gfaprojetos.com.br',
    crypt('Demo@2026', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Gabriel Fernandes"}',
    false, now() - interval '180 days', now(), '', '', '', ''
  ),
  (
    'aa000002-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'ana.ribeiro@gfaprojetos.com.br',
    crypt('Demo@2026', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Claudia Ribeiro"}',
    false, now() - interval '150 days', now(), '', '', '', ''
  ),
  (
    'aa000003-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'marcos.pereira@gfaprojetos.com.br',
    crypt('Demo@2026', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Marcos Pereira"}',
    false, now() - interval '120 days', now(), '', '', '', ''
  ),
  (
    'aa000004-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'julia.santos@gfaprojetos.com.br',
    crypt('Demo@2026', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Julia Santos"}',
    false, now() - interval '90 days', now(), '', '', '', ''
  )
on conflict (id) do nothing;

-- Update profiles (trigger auto-created them on auth.users insert above)
update public.profiles set full_name = 'Gabriel Fernandes',  role = 'admin'     where id = 'aa000001-0000-0000-0000-000000000001';
update public.profiles set full_name = 'Ana Claudia Ribeiro', role = 'manager'  where id = 'aa000002-0000-0000-0000-000000000002';
update public.profiles set full_name = 'Marcos Pereira',      role = 'financial' where id = 'aa000003-0000-0000-0000-000000000003';
update public.profiles set full_name = 'Julia Santos',        role = 'readonly'  where id = 'aa000004-0000-0000-0000-000000000004';

-- ----------------------------------------------------------------
-- STEP 2: Clients
-- ----------------------------------------------------------------

insert into public.clients (
  id, name, trade_name, document_type, document_number,
  email, phone, cep, logradouro, numero, bairro, cidade, estado,
  notes, is_active, created_at
) values
  -- 1. Construtora
  (
    'cc000001-0000-0000-0000-000000000001',
    'Construtora Horizonte Ltda', 'Horizonte Construções',
    'cnpj', '12345678000195',
    'contato@horizonteconstrucoes.com.br', '1132109800',
    '01310100', 'Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP',
    'Cliente desde 2018. Foco em projetos de médio e alto padrão.', true,
    now() - interval '180 days'
  ),
  -- 2. Residencial
  (
    'cc000002-0000-0000-0000-000000000002',
    'Residencial Vila Nova SPE Ltda', 'Vila Nova',
    'cnpj', '98765432000181',
    'projetos@residencialvilanova.com.br', '1940028000',
    '13025000', 'Rua José Paulino', '580', 'Centro', 'Campinas', 'SP',
    'Incorporadora com foco em empreendimentos residenciais.', true,
    now() - interval '160 days'
  ),
  -- 3. PF alto padrão
  (
    'cc000003-0000-0000-0000-000000000003',
    'Carlos Eduardo Monteiro', null,
    'cpf', '34567890123',
    'carlosedu.monteiro@email.com', '11991234567',
    '01452000', 'Rua Bela Cintra', '200', 'Consolação', 'São Paulo', 'SP',
    'Empresário. Projeto residência unifamiliar em Pinheiros.', true,
    now() - interval '140 days'
  ),
  -- 4. Instituto cultural
  (
    'cc000004-0000-0000-0000-000000000004',
    'Instituto Cultural Paulista', 'ICP',
    'cnpj', '45678901000176',
    'administrativo@icp.org.br', '1131453200',
    '01310930', 'Av. Paulista', '2073', 'Bela Vista', 'São Paulo', 'SP',
    'Reforma e retrofit de espaço cultural tombado.', true,
    now() - interval '130 days'
  ),
  -- 5. Shopping BH
  (
    'cc000005-0000-0000-0000-000000000005',
    'Shopping Bela Vista Administração S/A', 'Shopping Bela Vista',
    'cnpj', '56789012000157',
    'obras@shoppingbelavista.com.br', '3132550000',
    '30130010', 'Rua da Bahia', '1148', 'Centro', 'Belo Horizonte', 'MG',
    'Expansão de praça de alimentação — contrato plurianual.', true,
    now() - interval '120 days'
  ),
  -- 6. PF Curitiba
  (
    'cc000006-0000-0000-0000-000000000006',
    'Fabiana Oliveira Marques', null,
    'cpf', '56789012345',
    'fabiana.marques@email.com', '41998765432',
    '80010010', 'Rua XV de Novembro', '700', 'Centro', 'Curitiba', 'PR',
    'Reforma apartamento 4 dormitórios — alto padrão.', true,
    now() - interval '110 days'
  ),
  -- 7. Grupo RJ
  (
    'cc000007-0000-0000-0000-000000000007',
    'Grupo Empreendimentos Costa', 'Costa Empreendimentos',
    'cnpj', '67890123000138',
    'diretoria@costaempreendimentos.com.br', '2125553700',
    '20040020', 'Av. Rio Branco', '156', 'Centro', 'Rio de Janeiro', 'RJ',
    'Incorporadora. Dois projetos em andamento.', true,
    now() - interval '100 days'
  ),
  -- 8. Clínica
  (
    'cc000008-0000-0000-0000-000000000008',
    'Clínica São Lucas S/A', 'Clínica São Lucas',
    'cnpj', '78901234000119',
    'obras@clinicasaolucas.com.br', '1130630400',
    '04038001', 'Rua Domingos de Morais', '2564', 'Vila Mariana', 'São Paulo', 'SP',
    'Projeto de reforma e ampliação da clínica. Normas ANVISA.', true,
    now() - interval '90 days'
  ),
  -- 9. PF Floripa
  (
    'cc000009-0000-0000-0000-000000000009',
    'Roberto Almeida Silva', null,
    'cpf', '78901234567',
    'roberto.almeida@email.com', '48999887766',
    '88010400', 'Av. Hercílio Luz', '900', 'Centro', 'Florianópolis', 'SC',
    'Casa de praia — projeto novo. Terreno em Jurerê Internacional.', false,
    now() - interval '80 days'
  ),
  -- 10. Tech Park
  (
    'cc000010-0000-0000-0000-000000000010',
    'Tech Park Gestão de Ativos S/A', 'Tech Park',
    'cnpj', '89012345000100',
    'facilities@techpark.com.br', '1150430000',
    '04794000', 'Av. das Nações Unidas', '12399', 'Brooklin', 'São Paulo', 'SP',
    'Fit-out de andar corporativo. Padrão Triple-A.', true,
    now() - interval '60 days'
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------
-- STEP 3: Projects
-- ----------------------------------------------------------------

insert into public.projects (
  id, code, name, description,
  client_id, status, contract_value,
  start_date, end_date, deadline,
  notes, created_at
) values
  -- 1. Ativo — residência alto padrão
  (
    'b0000001-0000-0000-0000-000000000001',
    'GFA-2026-001',
    'Residência Família Monteiro — Pinheiros',
    'Projeto arquitetônico completo de residência unifamiliar de 420m² em Pinheiros. Inclui projeto executivo, compatibilização e acompanhamento de obra.',
    'cc000003-0000-0000-0000-000000000003',
    'active', 38000000,
    '2026-01-10', null, '2026-09-30',
    'Cliente exigente — reuniões quinzenais. Aprovado pela Prefeitura em março/2026.',
    now() - interval '90 days'
  ),
  -- 2. Ativo — escritório corporativo
  (
    'b0000002-0000-0000-0000-000000000002',
    'GFA-2026-002',
    'Tech Park — Fit-out Piso 12',
    'Projeto de interiores e fit-out de andar corporativo de 1.200m². Layout open office, salas de reunião, área de descompressão.',
    'cc000010-0000-0000-0000-000000000010',
    'active', 95000000,
    '2026-02-01', null, '2026-07-31',
    'Contrato inclui BIM nível 2. Coordenação com engenharia SPIE.',
    now() - interval '80 days'
  ),
  -- 3. Ativo — clínica
  (
    'b0000003-0000-0000-0000-000000000003',
    'GFA-2026-003',
    'Clínica São Lucas — Reforma e Ampliação',
    'Reforma completa e ampliação de 180m² de clínica médica. Projeto segue normas RDC-50 ANVISA.',
    'cc000008-0000-0000-0000-000000000008',
    'active', 27500000,
    '2026-02-15', null, '2026-08-15',
    'Laudo de aprovação ANVISA necessário antes da ocupação.',
    now() - interval '75 days'
  ),
  -- 4. Ativo — shopping BH
  (
    'b0000004-0000-0000-0000-000000000004',
    'GFA-2026-004',
    'Shopping Bela Vista — Expansão Praça L3',
    'Projeto de expansão da praça de alimentação nível L3: 850m² de área nova, 12 operações, nova fachada.',
    'cc000005-0000-0000-0000-000000000005',
    'active', 148000000,
    '2026-03-01', null, '2026-12-20',
    'Obra em shopping operacional — cronograma restrito a horários de baixo fluxo.',
    now() - interval '60 days'
  ),
  -- 5. Ativo — apartamento reforma
  (
    'b0000005-0000-0000-0000-000000000005',
    'GFA-2026-005',
    'Reforma Apartamento — Fabiana Marques',
    'Reforma completa de apartamento 4 dormitórios, 210m², no Centro de Curitiba. Inclui projeto de interiores.',
    'cc000006-0000-0000-0000-000000000006',
    'active', 18500000,
    '2026-03-10', null, '2026-08-30',
    'Condômino precisará aprovar intervenções na fachada.',
    now() - interval '55 days'
  ),
  -- 6. Proposta — grupo RJ
  (
    'b0000006-0000-0000-0000-000000000006',
    'GFA-2026-006',
    'Costa Empreendimentos — Torre Residencial Ipanema',
    'Projeto arquitetônico de torre residencial de alto padrão: 28 pavimentos, 4 unidades por andar.',
    'cc000007-0000-0000-0000-000000000007',
    'proposal', 280000000,
    null, null, '2027-06-30',
    'Proposta enviada em 15/03. Aguarda aprovação do conselho.',
    now() - interval '50 days'
  ),
  -- 7. Proposta — sede construtora
  (
    'b0000007-0000-0000-0000-000000000007',
    'GFA-2026-007',
    'Construtora Horizonte — Nova Sede Administrativa',
    'Projeto executivo de novo edifício sede: 6 pavimentos, 3.200m² de área construída.',
    'cc000001-0000-0000-0000-000000000001',
    'proposal', 220000000,
    null, null, '2027-03-31',
    'Em negociação de contrato. Valor pode ser ajustado após estudo de viabilidade.',
    now() - interval '40 days'
  ),
  -- 8. Concluído — Horizonte lote 1
  (
    'b0000008-0000-0000-0000-000000000008',
    'GFA-2025-008',
    'Residencial Vila Nova — Bloco A',
    'Projeto de arquitetura e compatibilização de edifício residencial Bloco A: 15 pavimentos, 120 unidades.',
    'cc000002-0000-0000-0000-000000000002',
    'completed', 185000000,
    '2024-08-01', '2025-12-30', '2025-12-31',
    'Projeto entregue no prazo. Cliente aprovado para Bloco B.',
    now() - interval '200 days'
  ),
  -- 9. Concluído — instituto cultural
  (
    'b0000009-0000-0000-0000-000000000009',
    'GFA-2025-009',
    'Instituto Cultural Paulista — Retrofit Sede',
    'Projeto de retrofit e restauro da sede histórica do ICP, área de 680m². Tombado pelo CONDEPHAAT.',
    'cc000004-0000-0000-0000-000000000004',
    'completed', 64000000,
    '2025-03-01', '2025-11-30', '2025-11-30',
    'Aprovado pelo CONDEPHAAT em abril/2025. Obra finalizada sem pendências.',
    now() - interval '250 days'
  ),
  -- 10. Pausado — casa de praia
  (
    'b0000010-0000-0000-0000-000000000010',
    'GFA-2026-010',
    'Residência Silva — Jurerê Internacional',
    'Projeto de residência de temporada com 380m², 5 suítes, piscina e área gourmet, em Jurerê Internacional.',
    'cc000009-0000-0000-0000-000000000009',
    'paused', 42000000,
    '2026-01-20', null, '2026-10-31',
    'Cliente solicitou pausa em fevereiro — questões jurídicas com o terreno.',
    now() - interval '70 days'
  ),
  -- 11. Cancelado
  (
    'b0000011-0000-0000-0000-000000000011',
    'GFA-2025-011',
    'Grupo Costa — Escritório Botafogo',
    'Projeto de retrofit de laje corporativa 600m² em Botafogo, Rio de Janeiro.',
    'cc000007-0000-0000-0000-000000000007',
    'cancelled', 52000000,
    '2025-09-01', null, '2025-12-31',
    'Cancelado pelo cliente em novembro/2025 — imóvel vendido.',
    now() - interval '160 days'
  ),
  -- 12. Ativo — Residencial Vila Nova Bloco B
  (
    'b0000012-0000-0000-0000-000000000012',
    'GFA-2026-012',
    'Residencial Vila Nova — Bloco B',
    'Projeto de arquitetura Bloco B do empreendimento Vila Nova: 15 pavimentos, 120 unidades. Reaproveitamento parcial do projeto Bloco A.',
    'cc000002-0000-0000-0000-000000000002',
    'active', 160000000,
    '2026-02-01', null, '2026-11-30',
    'Fase de anteprojeto. Reunião com incorporadora quinzenal.',
    now() - interval '65 days'
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------
-- STEP 4: Project members
-- ----------------------------------------------------------------

insert into public.project_members (project_id, profile_id, member_role, joined_at)
values
  -- pp1 — Residência Monteiro
  ('b0000001-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000002', 'responsible',    now() - interval '88 days'),
  ('b0000001-0000-0000-0000-000000000001', 'aa000004-0000-0000-0000-000000000004', 'collaborator',   now() - interval '88 days'),
  -- pp2 — Tech Park
  ('b0000002-0000-0000-0000-000000000002', 'aa000001-0000-0000-0000-000000000001', 'responsible',    now() - interval '78 days'),
  ('b0000002-0000-0000-0000-000000000002', 'aa000002-0000-0000-0000-000000000002', 'collaborator',   now() - interval '78 days'),
  ('b0000002-0000-0000-0000-000000000002', 'aa000004-0000-0000-0000-000000000004', 'collaborator',   now() - interval '78 days'),
  -- pp3 — Clínica
  ('b0000003-0000-0000-0000-000000000003', 'aa000002-0000-0000-0000-000000000002', 'responsible',    now() - interval '73 days'),
  ('b0000003-0000-0000-0000-000000000003', 'aa000004-0000-0000-0000-000000000004', 'collaborator',   now() - interval '73 days'),
  -- pp4 — Shopping BH
  ('b0000004-0000-0000-0000-000000000004', 'aa000001-0000-0000-0000-000000000001', 'responsible',    now() - interval '58 days'),
  ('b0000004-0000-0000-0000-000000000004', 'aa000002-0000-0000-0000-000000000002', 'collaborator',   now() - interval '58 days'),
  -- pp5 — Fab. Marques
  ('b0000005-0000-0000-0000-000000000005', 'aa000004-0000-0000-0000-000000000004', 'responsible',    now() - interval '53 days'),
  -- pp12 — Bloco B
  ('b0000012-0000-0000-0000-000000000012', 'aa000001-0000-0000-0000-000000000001', 'responsible',    now() - interval '63 days'),
  ('b0000012-0000-0000-0000-000000000012', 'aa000004-0000-0000-0000-000000000004', 'collaborator',   now() - interval '63 days')
on conflict (project_id, profile_id) do nothing;

-- ----------------------------------------------------------------
-- STEP 5: Expenses
-- Amounts in cents. Categories seeded by migration:
--   Mão de obra, Materiais, Subcontratados, Deslocamento,
--   Software e licenças, Impressão e plotagem, Taxas e cartórios, Outros
-- ----------------------------------------------------------------

do $$
declare
  cat_mao_obra      uuid;
  cat_materiais     uuid;
  cat_subcontr      uuid;
  cat_desloc        uuid;
  cat_software      uuid;
  cat_impressao     uuid;
  cat_taxas         uuid;
  cat_outros        uuid;
begin
  select id into cat_mao_obra  from public.expense_categories where name = 'Mão de obra';
  select id into cat_materiais from public.expense_categories where name = 'Materiais';
  select id into cat_subcontr  from public.expense_categories where name = 'Subcontratados';
  select id into cat_desloc    from public.expense_categories where name = 'Deslocamento';
  select id into cat_software  from public.expense_categories where name = 'Software e licenças';
  select id into cat_impressao from public.expense_categories where name = 'Impressão e plotagem';
  select id into cat_taxas     from public.expense_categories where name = 'Taxas e cartórios';
  select id into cat_outros    from public.expense_categories where name = 'Outros';

  insert into public.expenses (project_id, category_id, description, amount, expense_date) values

    -- Projeto: Residência Monteiro (pp1)
    ('b0000001-0000-0000-0000-000000000001', cat_mao_obra,  'Horas técnicas — levantamento arquitetônico',  320000, '2026-01-15'),
    ('b0000001-0000-0000-0000-000000000001', cat_impressao, 'Plotagem pranchas A1 — anteprojeto (12 fls)',   84000, '2026-02-03'),
    ('b0000001-0000-0000-0000-000000000001', cat_desloc,    'Visita técnica ao terreno — combustível e pedágio', 18000, '2026-02-10'),
    ('b0000001-0000-0000-0000-000000000001', cat_taxas,     'Taxa aprovação prefeitura — REURB',             95000, '2026-02-28'),
    ('b0000001-0000-0000-0000-000000000001', cat_subcontr,  'Laudo estrutural — Eng. Ricardo Lima',         450000, '2026-03-05'),
    ('b0000001-0000-0000-0000-000000000001', cat_impressao, 'Plotagem projeto executivo — 28 pranchas',     196000, '2026-03-20'),

    -- Projeto: Tech Park fit-out (pp2)
    ('b0000002-0000-0000-0000-000000000002', cat_mao_obra,  'Horas técnicas — desenvolvimento BIM',         780000, '2026-02-05'),
    ('b0000002-0000-0000-0000-000000000002', cat_software,  'Licença Revit — 2 assentos, 3 meses',          390000, '2026-02-01'),
    ('b0000002-0000-0000-0000-000000000002', cat_subcontr,  'Projeto de iluminação — Studio Lux',          1200000, '2026-02-20'),
    ('b0000002-0000-0000-0000-000000000002', cat_impressao, 'Impressão apresentação ao cliente — 3 álbuns', 125000, '2026-03-01'),
    ('b0000002-0000-0000-0000-000000000002', cat_mao_obra,  'Horas técnicas — coordenação de projetos',     650000, '2026-03-10'),
    ('b0000002-0000-0000-0000-000000000002', cat_desloc,    'Viagem São Paulo–São Paulo (cliente Brooklin)', 35000, '2026-03-15'),

    -- Projeto: Clínica São Lucas (pp3)
    ('b0000003-0000-0000-0000-000000000003', cat_mao_obra,  'Horas técnicas — estudo preliminar',           420000, '2026-02-20'),
    ('b0000003-0000-0000-0000-000000000003', cat_subcontr,  'Consultoria normas ANVISA — RDC-50',           800000, '2026-03-01'),
    ('b0000003-0000-0000-0000-000000000003', cat_taxas,     'Registro CREA — ART projeto',                   22000, '2026-03-08'),
    ('b0000003-0000-0000-0000-000000000003', cat_impressao, 'Plotagem pranchas — entrega ANVISA',            67000, '2026-03-25'),

    -- Projeto: Shopping Bela Vista (pp4)
    ('b0000004-0000-0000-0000-000000000004', cat_mao_obra,  'Horas técnicas — levantamento in loco BH',     560000, '2026-03-05'),
    ('b0000004-0000-0000-0000-000000000004', cat_desloc,    'Passagem aérea SP–BH (2 técnicos)',            148000, '2026-03-05'),
    ('b0000004-0000-0000-0000-000000000004', cat_desloc,    'Hospedagem Belo Horizonte — 3 diárias',         95000, '2026-03-06'),
    ('b0000004-0000-0000-0000-000000000004', cat_subcontr,  'Projeto de estrutura metálica — Metalplan',   2400000, '2026-03-20'),
    ('b0000004-0000-0000-0000-000000000004', cat_mao_obra,  'Horas técnicas — anteprojeto executivo',       890000, '2026-03-28'),

    -- Projeto: Reforma Fab. Marques (pp5)
    ('b0000005-0000-0000-0000-000000000005', cat_mao_obra,  'Horas técnicas — visita e programa de necessidades', 180000, '2026-03-12'),
    ('b0000005-0000-0000-0000-000000000005', cat_materiais, 'Amostras de revestimento e catálogos',          28000, '2026-03-20'),

    -- Projeto concluído: Bloco A (pp8)
    ('b0000008-0000-0000-0000-000000000008', cat_mao_obra,  'Horas técnicas — projeto executivo completo', 2200000, '2025-06-30'),
    ('b0000008-0000-0000-0000-000000000008', cat_subcontr,  'Compatibilização MEP — Setep Engenharia',      980000, '2025-08-15'),
    ('b0000008-0000-0000-0000-000000000008', cat_impressao, 'Plotagem e encadernação — entrega final',      340000, '2025-12-15'),

    -- Overhead (sem projeto)
    (null, cat_software,  'Assinatura Adobe CC — anual (2 usuários)',         199000, '2026-01-05'),
    (null, cat_software,  'AutoCAD LT — renovação anual',                     180000, '2026-01-05'),
    (null, cat_outros,    'Material de escritório — Q1/2026',                  45000, '2026-01-10'),
    (null, cat_outros,    'Café e copa — fevereiro',                           18000, '2026-02-01'),
    (null, cat_outros,    'Café e copa — março',                               19500, '2026-03-01'),
    (null, cat_desloc,    'Transporte urbano — equipe março',                  12000, '2026-03-31'),
    (null, cat_mao_obra,  'Estagiário — fevereiro (160h)',                    192000, '2026-02-28'),
    (null, cat_mao_obra,  'Estagiário — março (160h)',                        192000, '2026-03-31');
end $$;

-- ----------------------------------------------------------------
-- STEP 6: Timesheet entries
-- ----------------------------------------------------------------

insert into public.timesheet_entries (
  profile_id, project_id, entry_date, minutes,
  description, status, submitted_at, reviewed_by, reviewed_at
) values

  -- Gabriel (admin) — Tech Park (pp2) — aprovados
  ('aa000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002', '2026-03-03', 480, 'Revisão e coordenação BIM — compatibilização instalações', 'approved', now() - interval '28 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '27 days'),
  ('aa000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002', '2026-03-04', 360, 'Reunião com cliente e equipe de engenharia', 'approved', now() - interval '28 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '27 days'),
  ('aa000001-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000004', '2026-03-05', 480, 'Visita técnica ao Shopping BH — levantamento in loco', 'approved', now() - interval '26 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '25 days'),
  ('aa000001-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000004', '2026-03-06', 240, 'Processamento de dados levantamento BH', 'approved', now() - interval '26 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '25 days'),
  ('aa000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002', '2026-03-10', 420, 'Desenvolvimento anteprojeto — plantas baixas L12', 'approved', now() - interval '21 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '20 days'),
  ('aa000001-0000-0000-0000-000000000001', 'b0000012-0000-0000-0000-000000000012', '2026-03-11', 240, 'Reunião de kick-off Bloco B com incorporadora', 'approved', now() - interval '21 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '20 days'),
  ('aa000001-0000-0000-0000-000000000001', null,                                   '2026-03-12', 120, 'Gestão interna — reunião de equipe e planejamento semanal', 'approved', now() - interval '20 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '19 days'),
  -- Gabriel — semana atual (submetidos)
  ('aa000001-0000-0000-0000-000000000001', 'b0000004-0000-0000-0000-000000000004', '2026-03-31', 480, 'Desenvolvimento projeto anteprojeto Shopping — pavimento L3', 'submitted', now() - interval '3 days', null, null),
  ('aa000001-0000-0000-0000-000000000001', 'b0000002-0000-0000-0000-000000000002', '2026-04-01', 360, 'Revisão memorial descritivo Tech Park', 'submitted', now() - interval '2 days', null, null),

  -- Ana (manager) — aprovados
  ('aa000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', '2026-03-03', 480, 'Desenvolvimento projeto executivo — planta baixas e cortes', 'approved', now() - interval '28 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '27 days'),
  ('aa000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', '2026-03-04', 480, 'Detalhamento banheiros e closet — Residência Monteiro', 'approved', now() - interval '28 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '27 days'),
  ('aa000002-0000-0000-0000-000000000002', 'b0000003-0000-0000-0000-000000000003', '2026-03-05', 360, 'Revisão projeto Clínica São Lucas — ajustes pós-ANVISA', 'approved', now() - interval '26 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '25 days'),
  ('aa000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', '2026-03-10', 480, 'Elaboração caderno de especificações técnicas', 'approved', now() - interval '21 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '20 days'),
  ('aa000002-0000-0000-0000-000000000002', 'b0000003-0000-0000-0000-000000000003', '2026-03-11', 480, 'Projeto elétrico e hidráulico clínica — compatibilização', 'approved', now() - interval '21 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '20 days'),
  ('aa000002-0000-0000-0000-000000000002', 'b0000004-0000-0000-0000-000000000004', '2026-03-12', 300, 'Estudo preliminar Shopping BH — layout praça alimentação', 'approved', now() - interval '20 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '19 days'),
  -- Ana — submetido aguardando aprovação
  ('aa000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', '2026-04-01', 480, 'Finalização pranchas projeto legal — entrega prefeitura', 'submitted', now() - interval '2 days', null, null),
  ('aa000002-0000-0000-0000-000000000002', 'b0000003-0000-0000-0000-000000000003', '2026-04-02', 360, 'Revisão pós-vistoria ANVISA — adequações solicitadas', 'submitted', now() - interval '1 day',  null, null),
  ('aa000002-0000-0000-0000-000000000002', 'b0000004-0000-0000-0000-000000000004', '2026-04-03', 420, 'Desenvolvimento anteprojeto Shopping BH — fachada', 'submitted', now() - interval '12 hours', null, null),

  -- Julia (readonly/colaboradora) — aprovados
  ('aa000004-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', '2026-03-03', 300, 'Modelagem 3D volumétrica — Residência Monteiro', 'approved', now() - interval '28 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '27 days'),
  ('aa000004-0000-0000-0000-000000000004', 'b0000002-0000-0000-0000-000000000002', '2026-03-04', 480, 'Modelagem Revit — Tech Park piso 12', 'approved', now() - interval '28 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '27 days'),
  ('aa000004-0000-0000-0000-000000000004', 'b0000005-0000-0000-0000-000000000005', '2026-03-10', 240, 'Elaboração moodboard e conceito — Reforma Fab. Marques', 'approved', now() - interval '21 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '20 days'),
  ('aa000004-0000-0000-0000-000000000004', 'b0000012-0000-0000-0000-000000000012', '2026-03-11', 360, 'Implantação e cortes esquemáticos — Bloco B', 'approved', now() - interval '21 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '20 days'),
  ('aa000004-0000-0000-0000-000000000004', 'b0000002-0000-0000-0000-000000000002', '2026-03-12', 480, 'Detalhamento BIM — salas de reunião Tech Park', 'approved', now() - interval '20 days', 'aa000001-0000-0000-0000-000000000001', now() - interval '19 days'),
  -- Julia — rascunho (não submetido ainda)
  ('aa000004-0000-0000-0000-000000000004', 'b0000002-0000-0000-0000-000000000002', '2026-04-07', 480, 'Modelagem BIM — área de descompressão e café', 'draft', null, null, null),
  ('aa000004-0000-0000-0000-000000000004', 'b0000005-0000-0000-0000-000000000005', '2026-04-08', 300, 'Detalhamento marcenaria — Reforma Curitiba', 'draft', null, null, null);
