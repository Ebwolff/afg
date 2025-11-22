export interface Atendimento {
    id: string;
    cliente_id?: string; // ID do cliente selecionado
    cliente_nome: string;
    cliente_contato: string;
    tipo_solicitacao: string;
    descricao?: string;
    status: "aguardando" | "em_atendimento" | "concluido";
    solicitado_por: {
        nome: string;
    };
    atendido_por?: string;
    atendido_at?: string;
    created_at: string;
}

export interface AtendimentoFormData {
    cliente_id?: string; // ID do cliente selecionado
    cliente_nome: string;
    cliente_contato: string;
    tipo_solicitacao: string;
    descricao: string;
}
