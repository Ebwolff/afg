-- Migration: tasks_notifications
-- Description: Create tasks and notifications tables

-- 17. TABELA DE TAREFAS (TASKS)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
  related_entity_type TEXT CHECK (related_entity_type IN ('atendimento', 'cliente', 'transacao', 'servico')),
  related_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver tarefas"
  ON public.tasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar tarefas"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar tarefas"
  ON public.tasks FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar tarefas"
  ON public.tasks FOR DELETE
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at em tasks
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 18. TABELA DE NOTIFICAÇÕES (NOTIFICATIONS)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  type TEXT NOT NULL, -- 'task_assigned', 'task_update', 'system'
  link TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias notificações"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias notificações"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Permitir insert para sistema (via triggers ou funcoes)
-- Por simplicidade, vamos permitir autenticados criarem notificacoes (necessario para trigger de task funcionar se o usuario criador nao for admin)
CREATE POLICY "Usuários autenticados podem criar notificações"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- 19. FUNÇÃO E TRIGGER PARA NOTIFICAR ATRIBUIÇÃO DE TAREFA
CREATE OR REPLACE FUNCTION public.handle_task_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se foi atribuído a alguém (e não é o mesmo usuário que criou/atualizou)
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) AND NEW.assigned_to != auth.uid() THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.assigned_to,
      'Nova Tarefa Atribuída',
      'Você recebeu uma nova tarefa: ' || NEW.title,
      'task_assigned',
      '/tasks?id=' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_assigned
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_task_assignment();


-- Índices
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_notifications_user_id_read ON public.notifications(user_id, read);
