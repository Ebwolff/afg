-- ============================================
-- TRIO SYNC DESK - COMPLETE DATABASE SETUP
-- ============================================

-- 1. CRIAR ENUM PARA ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'vendedor', 'digitador', 'gerente');

-- 2. TABELA DE PERFIS
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', new.email),
    new.email
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. TABELA DE ROLES DE USUÁRIOS
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. FUNÇÃO DE VERIFICAÇÃO DE ROLE
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

-- Políticas para user_roles
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

-- 6. TABELA DE CLIENTES
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver clientes"
  ON public.clientes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar clientes"
  ON public.clientes FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 7. TABELA DE PRODUTOS
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL,
  tipo TEXT NOT NULL,
  valor_base NUMERIC,
  comissao_percentual NUMERIC,
  ativo BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver produtos"
  ON public.produtos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar produtos"
  ON public.produtos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar produtos"
  ON public.produtos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 8. TABELA DE SERVIÇOS
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo_servico TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pendente',
  atendido_por UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluido_at TIMESTAMPTZ
);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver serviços"
  ON public.servicos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar serviços"
  ON public.servicos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar serviços"
  ON public.servicos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 9. TABELA DE ATENDIMENTOS
CREATE TABLE public.atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nome TEXT NOT NULL,
  cliente_contato TEXT NOT NULL,
  tipo_solicitacao TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'aguardando',
  solicitado_por UUID REFERENCES public.profiles(id),
  atendido_por UUID REFERENCES public.profiles(id),
  vendedor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  digitador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  atendido_at TIMESTAMPTZ,
  data_finalizacao TIMESTAMPTZ,
  observacoes TEXT
);

ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver atendimentos"
  ON public.atendimentos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar atendimentos"
  ON public.atendimentos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar atendimentos"
  ON public.atendimentos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 10. TABELA DE TRANSAÇÕES (FINANCEIRO)
CREATE TABLE public.transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  categoria TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_vencimento TIMESTAMPTZ,
  data_pagamento TIMESTAMPTZ,
  parcela_numero INTEGER,
  parcela_total INTEGER,
  fornecedor_cliente TEXT,
  documento TEXT,
  conta_bancaria TEXT,
  metodo_pagamento TEXT,
  observacoes TEXT,
  anexo_url TEXT,
  servico_id UUID REFERENCES public.servicos(id),
  created_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver transações"
  ON public.transacoes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar transações"
  ON public.transacoes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar transações"
  ON public.transacoes FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_data_vencimento ON public.transacoes(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo_status ON public.transacoes(tipo, status);
CREATE INDEX IF NOT EXISTS idx_transacoes_fornecedor_cliente ON public.transacoes(fornecedor_cliente);

-- 11. TABELA DE EVENTOS (AGENDA)
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  local TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver eventos"
  ON public.eventos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar eventos"
  ON public.eventos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar eventos"
  ON public.eventos FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- 12. TABELA DE SIMULAÇÕES DE CONSÓRCIO
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
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.simulacoes_consorcio ENABLE ROW LEVEL SECURITY;

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

-- 13. TABELA DE CONFIGURAÇÕES
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

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

-- 14. FUNÇÃO PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. TRIGGERS PARA updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 16. INSERIR SENHA PADRÃO DE EXCLUSÃO
INSERT INTO public.configuracoes (chave, valor) 
VALUES ('senha_exclusao', crypt('admin123', gen_salt('bf')))
ON CONFLICT (chave) DO NOTHING;

-- ============================================
-- SETUP COMPLETO!
-- ============================================
