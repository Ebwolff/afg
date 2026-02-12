-- CORREÇÃO GERAL DE PERMISSÕES DE EXCLUSÃO
-- As seguintes tabelas possuem RLS ativado mas não possuem política de DELETE para usuários autenticados.
-- Execute este comando no Editor SQL do Supabase para corrigir todas de uma vez.

-- 1. Produtos
CREATE POLICY "Usuários autenticados podem deletar produtos"
  ON public.produtos FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 2. Serviços
CREATE POLICY "Usuários autenticados podem deletar serviços"
  ON public.servicos FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 3. Atendimentos
CREATE POLICY "Usuários autenticados podem deletar atendimentos"
  ON public.atendimentos FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 4. Transações (Financeiro)
CREATE POLICY "Usuários autenticados podem deletar transações"
  ON public.transacoes FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 5. Eventos (Agenda)
CREATE POLICY "Usuários autenticados podem deletar eventos"
  ON public.eventos FOR DELETE
  USING (auth.uid() IS NOT NULL);
