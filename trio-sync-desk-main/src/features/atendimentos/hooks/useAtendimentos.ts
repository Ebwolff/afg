import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Atendimento, AtendimentoFormData } from "../types";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "atendimentos_local_storage";

// Função para obter atendimentos do localStorage
const getAtendimentosFromStorage = (): Atendimento[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Erro ao ler atendimentos do localStorage:", error);
        return [];
    }
};

// Função para salvar atendimentos no localStorage
const saveAtendimentosToStorage = (atendimentos: Atendimento[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(atendimentos));
    } catch (error) {
        console.error("Erro ao salvar atendimentos no localStorage:", error);
    }
};

export function useAtendimentos() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: atendimentos, isLoading } = useQuery({
        queryKey: ["atendimentos"],
        queryFn: async () => {
            // Simular delay de rede para melhor UX
            await new Promise(resolve => setTimeout(resolve, 100));
            return getAtendimentosFromStorage();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newAtendimento: AtendimentoFormData) => {
            const currentAtendimentos = getAtendimentosFromStorage();

            // Criar novo atendimento
            const atendimento: Atendimento = {
                id: crypto.randomUUID(),
                cliente_id: newAtendimento.cliente_id, // Armazenar relação com cliente
                cliente_nome: newAtendimento.cliente_nome,
                cliente_contato: newAtendimento.cliente_contato,
                tipo_solicitacao: newAtendimento.tipo_solicitacao,
                descricao: newAtendimento.descricao,
                status: "aguardando",
                solicitado_por: {
                    nome: "Usuário Local",
                },
                created_at: new Date().toISOString(),
            };

            // Adicionar ao array e salvar
            const updatedAtendimentos = [atendimento, ...currentAtendimentos];
            saveAtendimentosToStorage(updatedAtendimentos);

            return atendimento;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
            queryClient.invalidateQueries({ queryKey: ["atendimentos-pending"] });
            toast({ title: "Atendimento criado com sucesso!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao criar atendimento",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const atenderMutation = useMutation({
        mutationFn: async (atendimentoId: string) => {
            const currentAtendimentos = getAtendimentosFromStorage();
            const updatedAtendimentos = currentAtendimentos.map(atendimento =>
                atendimento.id === atendimentoId
                    ? {
                        ...atendimento,
                        status: "em_atendimento" as const,
                        atendido_por: "local-user",
                        atendido_at: new Date().toISOString(),
                    }
                    : atendimento
            );
            saveAtendimentosToStorage(updatedAtendimentos);
            return updatedAtendimentos;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
            toast({ title: "Atendimento iniciado!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao iniciar atendimento",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const currentAtendimentos = getAtendimentosFromStorage();
            const updatedAtendimentos = currentAtendimentos.filter(atendimento => atendimento.id !== id);
            saveAtendimentosToStorage(updatedAtendimentos);
            return updatedAtendimentos;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
            toast({ title: "Atendimento excluído com sucesso!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao excluir atendimento",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        atendimentos,
        isLoading,
        createMutation,
        atenderMutation,
        deleteMutation,
    };
}
