export interface Produto {
    id: string;
    nome: string;
    descricao?: string;
    categoria: string;
    tipo: "produto" | "servico";
    valor_base?: number | string;
    comissao_percentual?: number | string;
    ativo: boolean;
    created_at: string;
    created_by: string;
}

export interface ProdutoFormData {
    nome: string;
    descricao: string;
    categoria: string;
    tipo: "produto" | "servico";
    valor_base: string;
    comissao_percentual: string;
}
