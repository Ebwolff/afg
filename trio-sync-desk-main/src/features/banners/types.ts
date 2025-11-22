export interface Banner {
    id: string;
    titulo: string;
    descricao: string;
    imagem_url: string;
    configuracao: BannerConfig;
    created_at: string;
    created_by: string;
}

export interface BannerConfig {
    largura: number;
    altura: number;
    texto_posicao: { x: number; y: number };
    texto_cor: string;
    texto_tamanho: number;
    texto_fonte: string;
    filtros?: string[];
}

export interface BannerFormData {
    titulo: string;
    descricao: string;
    imagem: File | null;
    configuracao: Partial<BannerConfig>;
}
