-- Criar tabela de perfis dos usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Função para criar perfil automaticamente
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

-- Trigger para criar perfil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabela de clientes (CRM)
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

-- Tabela de serviços prestados
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo_servico TEXT NOT NULL,
  descricao TEXT,
  valor DECIMAL(10,2),
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

-- Tabela de atendimentos (sala virtual)
CREATE TABLE public.atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nome TEXT NOT NULL,
  cliente_contato TEXT NOT NULL,
  tipo_solicitacao TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'aguardando',
  solicitado_por UUID REFERENCES public.profiles(id),
  atendido_por UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  atendido_at TIMESTAMPTZ
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

-- Tabela financeira
CREATE TABLE public.transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  categoria TEXT,
  servico_id UUID REFERENCES public.servicos(id),
  created_by UUID REFERENCES public.profiles(id),
  data TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver transações"
  ON public.transacoes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar transações"
  ON public.transacoes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tabela de agenda
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

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();