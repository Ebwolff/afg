-- ============================================================
-- MIGRAÇÃO: Anexos em Tarefas (task_attachments)
-- ============================================================

CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  file_type TEXT,
  phase TEXT NOT NULL DEFAULT 'creation',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- phase: 'creation' = anexado na criação, 'completion' = anexado na conclusão

CREATE INDEX idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX idx_task_attachments_phase ON task_attachments(phase);

-- Adicionar campo de notas de conclusão na tabela tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- RLS
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_attachments_select" ON task_attachments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "task_attachments_insert" ON task_attachments
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "task_attachments_delete" ON task_attachments
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());
