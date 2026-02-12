-- CORREÇÃO DE PERMISSÃO DE EXCLUSÃO
-- O erro ocorre porque a tabela 'clientes' tem RLS ativado mas não possui uma política de DELETE.
-- Execute este comando no Editor SQL do Supabase para corrigir.

CREATE POLICY "Usuários autenticados podem deletar clientes"
  ON public.clientes FOR DELETE
  USING (auth.uid() IS NOT NULL);
