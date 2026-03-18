-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT DO NOTHING;

-- Policies for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'task_att_auth_insert' AND tablename = 'objects') THEN
    CREATE POLICY "task_att_auth_insert" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'task-attachments');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'task_att_auth_select' AND tablename = 'objects') THEN
    CREATE POLICY "task_att_auth_select" ON storage.objects
      FOR SELECT TO authenticated USING (bucket_id = 'task-attachments');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'task_att_auth_delete' AND tablename = 'objects') THEN
    CREATE POLICY "task_att_auth_delete" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'task-attachments');
  END IF;
END $$;
