-- Migration: secure_tasks_policies
-- Description: Restrict tasks RLS policies to creator, assignee or admin

-- 1. Remover políticas antigas (menos seguras)
DROP POLICY IF EXISTS "Usuários autenticados podem ver tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar tarefas" ON public.tasks;

-- 2. Criar as novas políticas restritivas
CREATE POLICY "Usuários autorizados podem ver tarefas"
  ON public.tasks FOR SELECT
  USING (auth.uid() = created_by OR auth.uid() = assigned_to OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários autorizados podem atualizar tarefas"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() = assigned_to OR public.has_role(auth.uid(), 'admin'));
