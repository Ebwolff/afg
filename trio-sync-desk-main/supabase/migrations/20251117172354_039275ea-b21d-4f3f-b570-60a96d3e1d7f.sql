-- Adicionar novos campos à tabela transacoes para controle de contas a pagar e receber
ALTER TABLE public.transacoes
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS data_vencimento timestamp with time zone,
ADD COLUMN IF NOT EXISTS data_pagamento timestamp with time zone,
ADD COLUMN IF NOT EXISTS parcela_numero integer,
ADD COLUMN IF NOT EXISTS parcela_total integer,
ADD COLUMN IF NOT EXISTS fornecedor_cliente text,
ADD COLUMN IF NOT EXISTS documento text,
ADD COLUMN IF NOT EXISTS conta_bancaria text,
ADD COLUMN IF NOT EXISTS metodo_pagamento text,
ADD COLUMN IF NOT EXISTS observacoes text,
ADD COLUMN IF NOT EXISTS anexo_url text;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_data_vencimento ON public.transacoes(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo_status ON public.transacoes(tipo, status);
CREATE INDEX IF NOT EXISTS idx_transacoes_fornecedor_cliente ON public.transacoes(fornecedor_cliente);

-- Adicionar policy de UPDATE para transacoes (estava faltando)
CREATE POLICY "Usuários autenticados podem atualizar transações"
ON public.transacoes
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);