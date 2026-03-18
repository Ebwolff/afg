-- ============================================================
-- MIGRAÇÃO: Permissões Avançadas com custom_roles
-- AFG Soluções Financeiras
-- ============================================================

-- 1. Criar tabela custom_roles
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions TEXT[] DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Seed: roles padrão
INSERT INTO custom_roles (name, display_name, description, permissions, is_system) VALUES
(
  'admin',
  'Administrador',
  'Acesso total ao sistema',
  ARRAY['dashboard','leads','tasks','produtividade','atendimentos','clientes','produtos','contas_pagar','contas_receber','financeiro','simulador','agenda','relatorios','banners'],
  true
),
(
  'gerente',
  'Gerente',
  'Gestão de equipe e relatórios',
  ARRAY['dashboard','leads','tasks','produtividade','atendimentos','clientes','financeiro','relatorios','agenda'],
  false
),
(
  'vendedor',
  'Vendedor',
  'Vendas, leads e atendimentos',
  ARRAY['dashboard','leads','atendimentos','clientes','simulador','agenda','produtos'],
  false
),
(
  'financeiro',
  'Financeiro',
  'Controle financeiro completo',
  ARRAY['dashboard','contas_pagar','contas_receber','financeiro','relatorios'],
  false
),
(
  'servicos',
  'Serviços',
  'Acesso básico a agenda e atendimentos',
  ARRAY['agenda','atendimentos'],
  true
)
ON CONFLICT (name) DO NOTHING;

-- 3. Adicionar role_id em user_roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES custom_roles(id);

-- 4. Migrar dados existentes: converter string role → role_id
UPDATE user_roles ur
SET role_id = cr.id
FROM custom_roles cr
WHERE ur.role = cr.name
  AND ur.role_id IS NULL;

-- 5. Tornar role_id NOT NULL após migração
-- (executar manualmente após validar que todos foram migrados)
-- ALTER TABLE user_roles ALTER COLUMN role_id SET NOT NULL;

-- 6. RLS para custom_roles
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ler roles (necessário para o frontend)
CREATE POLICY "custom_roles_select" ON custom_roles
  FOR SELECT TO authenticated USING (true);

-- Apenas service_role pode modificar (via Edge Functions / migrations)
CREATE POLICY "custom_roles_admin_insert" ON custom_roles
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "custom_roles_admin_update" ON custom_roles
  FOR UPDATE TO service_role USING (true);
CREATE POLICY "custom_roles_admin_delete" ON custom_roles
  FOR DELETE TO service_role USING (true);

-- 7. Índice para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
