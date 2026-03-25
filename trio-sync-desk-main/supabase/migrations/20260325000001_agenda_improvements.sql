-- ============================================================
-- MIGRAÇÃO: Melhorias no Módulo de Agenda (Eventos)
-- ============================================================

-- 1. Adicionar colunas para Status, Cliente Vinculado e Data Fim
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'agendado';
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS data_fim TIMESTAMPTZ;

-- 2. Atualizar constraint de tipo do evento se existir (já era texto livre, mas por garantia)
-- Não tem constraint estrita atualmente, é gerenciado via App (reuniao, acao_venda, outro).

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_eventos_cliente_id ON public.eventos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_eventos_status ON public.eventos(status);
CREATE INDEX IF NOT EXISTS idx_eventos_data_inicio ON public.eventos(data_inicio);

-- 4. Criar views ou triggers se aplicável
-- O trigger de audit_logs geral interceptará automaticamente se estiver ativo para a tabela public.eventos.
