-- Migração CRM: Leads e Funis de Consórcio
-- Foco em empresa única e humanização

-- 1. Tabela de Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp TEXT,
  instagram_handle TEXT,
  origem TEXT, -- ex: 'instagram_dm', 'tiktok_comment'
  
  -- Campos específicos do nicho
  tipo_credito TEXT, -- 'consorcio', 'financiamento'
  valor_desejado NUMERIC,
  renda_aproximada NUMERIC,
  prazo_interesse INTEGER,
  
  status TEXT DEFAULT 'novo' NOT NULL, -- será linkado com etapas do funil
  atribuido_a UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Etapas do Funil
CREATE TABLE public.funnel_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor TEXT, -- cor para o Kanban
  ordem INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir etapas sugeridas na proposta
INSERT INTO public.funnel_stages (nome, ordem, cor) VALUES
('Novo Lead', 1, '#3b82f6'),
('Contato Realizado', 2, '#f59e0b'),
('Perfil Aprovado', 3, '#8b5cf6'),
('Simulação Enviada', 4, '#ec4899'),
('Em Negociação', 5, '#10b981'),
('Venda Fechada', 6, '#059669'),
('Venda Perdida', 7, '#ef4444');

-- 3. Registro de Conversas (Humanização)
CREATE TABLE public.lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  agente_id UUID REFERENCES public.profiles(id),
  tipo TEXT NOT NULL, -- 'whatsapp', 'instagram', 'nota_interna'
  conteudo TEXT NOT NULL,
  direcao TEXT NOT NULL, -- 'entrada', 'saida'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Admins e Agentes podem ver tudo, já que é empresa única)
CREATE POLICY "Ver leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Criar leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizar leads" ON public.leads FOR UPDATE USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
