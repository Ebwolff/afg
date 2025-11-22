-- Criar tabela de produtos/serviços
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL, -- cartas_credito, financiamentos, consignados, venda_imoveis, aluguel_imoveis
  tipo TEXT NOT NULL, -- produto ou servico
  valor_base NUMERIC,
  comissao_percentual NUMERIC,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Create policies for produtos
CREATE POLICY "Usuários autenticados podem ver produtos"
ON public.produtos
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar produtos"
ON public.produtos
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar produtos"
ON public.produtos
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem deletar produtos"
ON public.produtos
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();