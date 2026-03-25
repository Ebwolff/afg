-- ============================================================
-- MIGRAÇÃO: Sistema de Comentários / Andamento de Tarefas
-- ============================================================

-- 1. Criar tabela task_comments
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Alterar tabela task_attachments para suportar vínculo com comentários (fase 'progress')
ALTER TABLE public.task_attachments ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.task_comments(id) ON DELETE CASCADE;

-- 3. Habilitar RLS
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para task_comments
-- Autenticados podem ler os comentários
CREATE POLICY "Usuários autenticados podem ver comentários"
  ON public.task_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Autenticados podem criar comentários
CREATE POLICY "Usuários autenticados podem criar comentários"
  ON public.task_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Somente o próprio autor ou admin pode deletar (opcional, mantendo o padrão)
CREATE POLICY "Autores podem deletar próprios comentários"
  ON public.task_comments FOR DELETE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN custom_roles cr ON ur.role_id = cr.id
      WHERE ur.user_id = auth.uid() AND cr.name = 'admin'
    )
  );

-- 5. Adicionar trigger de auditoria (audit_logs)
DROP TRIGGER IF EXISTS trg_audit_task_comments ON task_comments;
CREATE TRIGGER trg_audit_task_comments
  AFTER INSERT OR UPDATE OR DELETE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- 6. Adicionar views/índices se necessário
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_comment_id ON public.task_attachments(comment_id);
