export interface Transacao {
    id: string;
    descricao: string;
    valor: number;
    data: string;
    categoria: string | null;
    status: string;
    data_vencimento: string | null;
    data_pagamento: string | null;
    fornecedor_cliente: string | null;
    documento: string | null;
    conta_bancaria: string | null;
    metodo_pagamento: string | null;
    observacoes: string | null;
    parcela_numero: number | null;
    parcela_total: number | null;
    tipo: "despesa" | "receita";
    created_by: string | null;
}

export interface TransactionFormData {
    descricao: string;
    valor: string;
    categoria: string;
    data_vencimento: Date;
    fornecedor_cliente: string;
    documento: string;
    conta_bancaria: string;
    metodo_pagamento: string;
    observacoes: string;
}

export interface ParceladoFormData {
    descricao: string;
    valor_total: string;
    categoria: string;
    numero_parcelas: string;
    data_primeiro_vencimento: Date;
    fornecedor_cliente: string;
    documento: string;
    conta_bancaria: string;
    observacoes: string;
}
