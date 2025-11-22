-- Fase 1: Estrutura de Dados Completa para AFG Soluções Financeiras

-- 1. Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'vendedor', 'digitador', 'gerente');

-- 2. Criar tabela de roles de usuários (NUNCA armazenar roles em profiles!)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- 3. Criar tabela de configurações (para senha de exclusão)
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Criar tabela de simulações de consórcio
CREATE TABLE public.simulacoes_consorcio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atendimento_id UUID REFERENCES public.atendimentos(id) ON DELETE SET NULL,
  cliente_nome TEXT NOT NULL,
  tipo_bem TEXT NOT NULL CHECK (tipo_bem IN ('imovel', 'veiculo', 'servico')),
  valor_carta NUMERIC NOT NULL,
  prazo_meses INTEGER NOT NULL,
  valor_parcela NUMERIC NOT NULL,
  taxa_administracao NUMERIC,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Adicionar campos em atendimentos para rastreamento de equipe
ALTER TABLE public.atendimentos 
  ADD COLUMN vendedor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN digitador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN data_finalizacao TIMESTAMP WITH TIME ZONE,
  ADD COLUMN observacoes TEXT;

-- 6. Habilitar RLS nas novas tabelas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulacoes_consorcio ENABLE ROW LEVEL SECURITY;

-- 7. Criar função de verificação de role (SECURITY DEFINER para evitar recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 8. Políticas RLS para user_roles
CREATE POLICY "Usuários podem ver suas próprias roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem inserir roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem atualizar roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem deletar roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. Políticas RLS para configuracoes
CREATE POLICY "Apenas admins podem ver configurações"
  ON public.configuracoes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem inserir configurações"
  ON public.configuracoes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem atualizar configurações"
  ON public.configuracoes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem deletar configurações"
  ON public.configuracoes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. Políticas RLS para simulacoes_consorcio
CREATE POLICY "Usuários autenticados podem ver simulações"
  ON public.simulacoes_consorcio FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar simulações"
  ON public.simulacoes_consorcio FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar suas próprias simulações"
  ON public.simulacoes_consorcio FOR UPDATE
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem deletar simulações"
  ON public.simulacoes_consorcio FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 11. Trigger para atualizar updated_at em configuracoes
CREATE TRIGGER update_configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Inserir senha padrão de exclusão (admin123 - trocar depois!)
INSERT INTO public.configuracoes (chave, valor) 
VALUES ('senha_exclusao', crypt('admin123', gen_salt('bf')))
ON CONFLICT (chave) DO NOTHING;