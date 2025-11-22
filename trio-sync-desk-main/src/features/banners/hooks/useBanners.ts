import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Banner, BannerFormData } from "../types";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "banners_local_storage";

// Função para obter banners do localStorage
const getBannersFromStorage = (): Banner[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Erro ao ler banners do localStorage:", error);
        return [];
    }
};

// Função para salvar banners no localStorage
const saveBannersToStorage = (banners: Banner[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
    } catch (error) {
        console.error("Erro ao salvar banners no localStorage:", error);
    }
};

// Função para converter File para base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function useBanners() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: banners, isLoading } = useQuery({
        queryKey: ["banners"],
        queryFn: async () => {
            // Simular delay de rede para melhor UX
            await new Promise(resolve => setTimeout(resolve, 100));
            return getBannersFromStorage();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newBanner: BannerFormData & { imagemBase64?: string }) => {
            const currentBanners = getBannersFromStorage();

            // Criar novo banner
            const banner: Banner = {
                id: crypto.randomUUID(),
                titulo: newBanner.titulo,
                descricao: newBanner.descricao,
                imagem_url: newBanner.imagemBase64 || "",
                configuracao: newBanner.configuracao as any,
                created_at: new Date().toISOString(),
                created_by: "local-user",
            };

            // Adicionar ao array e salvar
            const updatedBanners = [banner, ...currentBanners];
            saveBannersToStorage(updatedBanners);

            return banner;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["banners"] });
            toast({ title: "Banner criado com sucesso!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao criar banner",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Banner> & { id: string }) => {
            const currentBanners = getBannersFromStorage();
            const updatedBanners = currentBanners.map(banner =>
                banner.id === id ? { ...banner, ...updates } : banner
            );
            saveBannersToStorage(updatedBanners);
            return updatedBanners;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["banners"] });
            toast({ title: "Banner atualizado com sucesso!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao atualizar banner",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const currentBanners = getBannersFromStorage();
            const updatedBanners = currentBanners.filter(banner => banner.id !== id);
            saveBannersToStorage(updatedBanners);
            return updatedBanners;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["banners"] });
            toast({ title: "Banner excluído com sucesso!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao excluir banner",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const uploadImage = async (file: File): Promise<string> => {
        // Converter para base64 para armazenar localmente
        return await fileToBase64(file);
    };

    return {
        banners,
        isLoading,
        createMutation,
        updateMutation,
        deleteMutation,
        uploadImage,
    };
}
