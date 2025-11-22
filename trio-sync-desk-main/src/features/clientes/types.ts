export interface Cliente {
    id: string;
    nome: string;
    cpf: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    created_at?: string;
    created_by?: string;
}

export interface ClienteFormData {
    nome: string;
    cpf: string;
    telefone: string;
    email: string;
    endereco: string;
}
