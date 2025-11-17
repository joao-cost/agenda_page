-- ============================================
-- SEED SQL PARA BANCO DE DADOS POSTGRESQL
-- Sistema de Agendamento - Lavacar
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Execute este script em um banco PostgreSQL limpo
-- 2. Certifique-se de que todas as migrations foram aplicadas
-- 3. Este script limpa todos os dados e insere dados de exemplo
--
-- ============================================

-- Limpar todos os dados (em ordem de dependência)
TRUNCATE TABLE "Payment" CASCADE;
TRUNCATE TABLE "Appointment" CASCADE;
TRUNCATE TABLE "Service" CASCADE;
TRUNCATE TABLE "Client" CASCADE;
TRUNCATE TABLE "User" CASCADE;
TRUNCATE TABLE "IntegrationSetting" CASCADE;
TRUNCATE TABLE "GeneralSettings" CASCADE;

-- Resetar sequences (se houver)
-- ALTER SEQUENCE "User_id_seq" RESTART WITH 1;
-- ALTER SEQUENCE "Client_id_seq" RESTART WITH 1;
-- ALTER SEQUENCE "Service_id_seq" RESTART WITH 1;
-- ALTER SEQUENCE "Appointment_id_seq" RESTART WITH 1;
-- ALTER SEQUENCE "Payment_id_seq" RESTART WITH 1;

-- ============================================
-- 1. CRIAR USUÁRIO ADMINISTRADOR
-- ============================================
-- Senha: admin123 (hash bcrypt)
-- Hash gerado com: await hashPassword("admin123")
INSERT INTO "User" (id, login, password, name, role, "createdAt", "updatedAt")
VALUES (
  'admin_' || gen_random_uuid()::text,
  'admin@lavacar.com',
  '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', -- Hash de exemplo (substitua pelo hash real)
  'Administrador',
  'ADMIN',
  NOW(),
  NOW()
);

-- ============================================
-- 2. CRIAR SERVIÇOS
-- ============================================
INSERT INTO "Service" (id, name, description, price, "durationMin", "createdAt", "updatedAt")
VALUES
  (
    'service_' || gen_random_uuid()::text,
    'Lavagem Express',
    'Limpeza externa rápida com produtos neutros. Ideal para manutenção semanal.',
    60.00,
    30,
    NOW(),
    NOW()
  ),
  (
    'service_' || gen_random_uuid()::text,
    'Lavagem Completa',
    'Interior e exterior com acabamento e hidratação. Inclui aspirador e limpeza de estofados.',
    120.00,
    90,
    NOW(),
    NOW()
  ),
  (
    'service_' || gen_random_uuid()::text,
    'Polimento Premium',
    'Correção de pintura e proteção com cera premium. Remove riscos leves e protege a pintura.',
    280.00,
    180,
    NOW(),
    NOW()
  ),
  (
    'service_' || gen_random_uuid()::text,
    'Lavagem Simples',
    'Lavagem básica externa com água e sabão neutro.',
    40.00,
    20,
    NOW(),
    NOW()
  ),
  (
    'service_' || gen_random_uuid()::text,
    'Lavagem + Enceramento',
    'Lavagem completa com enceramento para proteção da pintura.',
    150.00,
    120,
    NOW(),
    NOW()
  );

-- ============================================
-- 3. CRIAR CLIENTES
-- ============================================
INSERT INTO "Client" (id, name, phone, vehicle, plate, notes, approved, "createdAt", "updatedAt")
VALUES
  (
    'client_' || gen_random_uuid()::text,
    'João Silva',
    '66991234567',
    'Honda Civic 2020',
    'ABC1234',
    'Cliente preferencial, sempre agendar com antecedência.',
    true,
    NOW(),
    NOW()
  ),
  (
    'client_' || gen_random_uuid()::text,
    'Maria Santos',
    '66992345678',
    'Toyota Corolla 2021',
    'XYZ5678',
    'Prefere horários da manhã.',
    true,
    NOW(),
    NOW()
  ),
  (
    'client_' || gen_random_uuid()::text,
    'Pedro Oliveira',
    '66993456789',
    'Volkswagen Gol 2019',
    'DEF9012',
    NULL,
    true,
    NOW(),
    NOW()
  ),
  (
    'client_' || gen_random_uuid()::text,
    'Ana Costa',
    '66994567890',
    'Fiat Uno 2018',
    'GHI3456',
    'Cliente novo, aguardando aprovação.',
    false,
    NOW(),
    NOW()
  ),
  (
    'client_' || gen_random_uuid()::text,
    'Carlos Ferreira',
    '66995678901',
    'Chevrolet Onix 2022',
    'JKL7890',
    NULL,
    true,
    NOW(),
    NOW()
  );

-- ============================================
-- 4. CRIAR CONFIGURAÇÕES GERAIS
-- ============================================
INSERT INTO "GeneralSettings" (
  id,
  "multiWasher",
  "workStartHour",
  "workEndHour",
  "workDays",
  "closedDates",
  "maxConcurrentBookings",
  "washers",
  "adminPhone",
  "createdAt",
  "updatedAt"
)
VALUES (
  'default',
  false,
  8,
  18,
  '1,2,3,4,5,6', -- Segunda a Sábado
  '[]', -- Array JSON vazio
  1,
  '[]', -- Array JSON vazio
  '66991234567', -- Telefone do admin para notificações
  NOW(),
  NOW()
);

-- ============================================
-- 5. CRIAR AGENDAMENTOS DE EXEMPLO
-- ============================================
-- Nota: Os IDs dos clientes e serviços precisam ser obtidos das inserções acima
-- Este é um exemplo - você precisará ajustar os IDs conforme necessário

-- Agendamento 1: Amanhã às 9h
INSERT INTO "Appointment" (
  id,
  date,
  status,
  notes,
  "washerId",
  "clientId",
  "serviceId",
  "createdAt",
  "updatedAt"
)
SELECT
  'appt_' || gen_random_uuid()::text,
  (CURRENT_DATE + INTERVAL '1 day')::timestamp + INTERVAL '9 hours',
  'AGENDADO',
  'Cliente solicitou atenção especial nos vidros.',
  NULL,
  c.id,
  s.id,
  NOW(),
  NOW()
FROM "Client" c, "Service" s
WHERE c.name = 'João Silva' AND s.name = 'Lavagem Express'
LIMIT 1;

-- Agendamento 2: Depois de amanhã às 14h
INSERT INTO "Appointment" (
  id,
  date,
  status,
  notes,
  "washerId",
  "clientId",
  "serviceId",
  "createdAt",
  "updatedAt"
)
SELECT
  'appt_' || gen_random_uuid()::text,
  (CURRENT_DATE + INTERVAL '2 days')::timestamp + INTERVAL '14 hours',
  'AGENDADO',
  NULL,
  NULL,
  c.id,
  s.id,
  NOW(),
  NOW()
FROM "Client" c, "Service" s
WHERE c.name = 'Maria Santos' AND s.name = 'Lavagem Completa'
LIMIT 1;

-- Agendamento 3: Próxima semana às 10h
INSERT INTO "Appointment" (
  id,
  date,
  status,
  notes,
  "washerId",
  "clientId",
  "serviceId",
  "createdAt",
  "updatedAt"
)
SELECT
  'appt_' || gen_random_uuid()::text,
  (CURRENT_DATE + INTERVAL '7 days')::timestamp + INTERVAL '10 hours',
  'AGENDADO',
  'Primeira vez fazendo polimento.',
  NULL,
  c.id,
  s.id,
  NOW(),
  NOW()
FROM "Client" c, "Service" s
WHERE c.name = 'Pedro Oliveira' AND s.name = 'Polimento Premium'
LIMIT 1;

-- ============================================
-- 6. CRIAR PAGAMENTOS PARA OS AGENDAMENTOS
-- ============================================
INSERT INTO "Payment" (
  id,
  status,
  amount,
  "paidAt",
  "appointmentId",
  "createdAt",
  "updatedAt"
)
SELECT
  'payment_' || gen_random_uuid()::text,
  'PENDENTE',
  s.price,
  NULL,
  a.id,
  NOW(),
  NOW()
FROM "Appointment" a
JOIN "Service" s ON a."serviceId" = s.id
WHERE a.status = 'AGENDADO';

-- ============================================
-- RESUMO
-- ============================================
SELECT 
  'Seed concluído!' as status,
  (SELECT COUNT(*) FROM "User") as usuarios,
  (SELECT COUNT(*) FROM "Client") as clientes,
  (SELECT COUNT(*) FROM "Service") as servicos,
  (SELECT COUNT(*) FROM "Appointment") as agendamentos,
  (SELECT COUNT(*) FROM "Payment") as pagamentos,
  (SELECT COUNT(*) FROM "GeneralSettings") as configuracoes;

-- ============================================
-- CREDENCIAIS DE ACESSO
-- ============================================
-- Login: admin@lavacar.com
-- Senha: admin123
-- 
-- NOTA: A senha precisa ser hasheada com bcrypt antes de inserir no banco.
-- Use o seed.ts do Prisma para gerar o hash correto.
-- ============================================

