export interface Atendimento {
    id: string;
    cliente_nome: string;
    cliente_contato: string;
    tipo_solicitacao: string;
    descricao?: string | null;
    status: string;
    solicitado_por: string | null;
    atendido_por: string | null;
    atendido_at: string | null;
    vendedor_id: string | null;
    digitador_id: string | null;
    data_finalizacao: string | null;
    observacoes: string | null;
    created_at: string;
    // Joined profile name (populated via select query)
    solicitante_nome?: string;
}

export interface AtendimentoFormData {
    cliente_id?: string;
    cliente_nome: string;
    cliente_contato: string;
    tipo_solicitacao: string;
    descricao: string;
}
