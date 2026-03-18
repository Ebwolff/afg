-- ============================================================
-- MIGRAÇÃO: Sistema de Auditoria (Logs)
-- AFG Soluções Financeiras
-- ============================================================

-- 1. Tabela audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_nome TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Índices para consultas rápidas
CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- 3. Função genérica de trigger
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, user_email, user_nome, action, module, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    COALESCE(
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      'system'
    ),
    COALESCE(
      (SELECT nome FROM public.profiles WHERE id = auth.uid()),
      'Sistema'
    ),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Aplicar triggers em todas as tabelas principais
CREATE TRIGGER trg_audit_clientes
  AFTER INSERT OR UPDATE OR DELETE ON clientes
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_transacoes
  AFTER INSERT OR UPDATE OR DELETE ON transacoes
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_atendimentos
  AFTER INSERT OR UPDATE OR DELETE ON atendimentos
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_tasks
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_eventos
  AFTER INSERT OR UPDATE OR DELETE ON eventos
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_produtos
  AFTER INSERT OR UPDATE OR DELETE ON produtos
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_servicos
  AFTER INSERT OR UPDATE OR DELETE ON servicos
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- 5. RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem ler todos os logs
CREATE POLICY "audit_logs_admin_select" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN custom_roles cr ON ur.role_id = cr.id
      WHERE ur.user_id = auth.uid() AND cr.name = 'admin'
    )
  );

-- Ninguém pode modificar logs diretamente (apenas via trigger SECURITY DEFINER)
-- INSERT é feita pela função fn_audit_log() que roda como SECURITY DEFINER
