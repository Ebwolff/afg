// Tipos do Mobile App - Paridade com Desktop

export interface Cliente {
    id: string;
    nome: string;
    cpf: string;
    telefone?: string;
    email?: string;
    created_at?: string;
}

export interface Transacao {
    id: string;
    descricao: string;
    valor: number;
    data: string;
    categoria: string | null;
    status: 'pendente' | 'pago' | 'cancelado' | 'atrasado';
    data_vencimento: string | null;
    data_pagamento: string | null;
    fornecedor_cliente: string | null;
    documento: string | null;
    conta_bancaria: string | null;
    metodo_pagamento: string | null;
    observacoes: string | null;
    parcela_numero: number | null;
    parcela_total: number | null;
    tipo: 'despesa' | 'receita';
    created_by: string | null;
}

export interface Produto {
    id: string;
    nome: string;
    descricao?: string;
    preco: number;
    categoria?: string;
    estoque?: number;
    created_at?: string;
}

export interface Atendimento {
    id: string;
    cliente_id: string;
    cliente?: Cliente;
    descricao: string;
    status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
    data: string;
    observacoes?: string;
    created_at?: string;
}

export interface Agenda {
    id: string;
    titulo: string;
    descricao?: string;
    data: string;
    hora_inicio?: string;
    hora_fim?: string;
    cliente_id?: string;
    cliente?: Cliente;
    status: 'agendado' | 'concluido' | 'cancelado';
    created_at?: string;
}

// Form Data Types
export interface TransacaoFormData {
    tipo: 'receita' | 'despesa';
    descricao: string;
    valor: string;
    categoria: string;
    data_vencimento?: Date;
    fornecedor_cliente?: string;
    documento?: string;
    observacoes?: string;
}

export interface ClienteFormData {
    nome: string;
    cpf: string;
    telefone?: string;
    email?: string;
}

// Navigation Types
export type RootStackParamList = {
    Login: undefined;
    Dashboard: undefined;
    Clientes: undefined;
    Produtos: undefined;
    Atendimentos: undefined;
    Financeiro: undefined;
    Agenda: undefined;
    Relatorios: undefined;
    Simulador: undefined;
    Banners: undefined;
    ContasPagar: undefined;
    ContasReceber: undefined;
};

// Constantes de Categorias
export const CATEGORIAS_RECEITA = [
    "Vendas",
    "Serviços",
    "Comissões",
    "Rendimentos",
    "Outros"
] as const;

export const CATEGORIAS_DESPESA = [
    "Aluguel",
    "Água/Luz/Internet",
    "Fornecedores",
    "Salários",
    "Impostos",
    "Marketing",
    "Manutenção",
    "Alimentação",
    "Transporte",
    "Outros"
] as const;

export const STATUS_OPTIONS = [
    { value: 'todas', label: 'Todas' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'pago', label: 'Pago' },
    { value: 'atrasado', label: 'Atrasado' },
    { value: 'cancelado', label: 'Cancelado' },
] as const;
