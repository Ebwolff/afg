-- Adicionar políticas de DELETE para usuários autenticados

-- Política de DELETE para transações
CREATE POLICY "Usuários autenticados podem deletar transações"
ON public.transacoes
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Política de DELETE para atendimentos
CREATE POLICY "Usuários autenticados podem deletar atendimentos"
ON public.atendimentos
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Política de DELETE para clientes
CREATE POLICY "Usuários autenticados podem deletar clientes"
ON public.clientes
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Política de DELETE para eventos
CREATE POLICY "Usuários autenticados podem deletar eventos"
ON public.eventos
FOR DELETE
USING (auth.uid() IS NOT NULL);