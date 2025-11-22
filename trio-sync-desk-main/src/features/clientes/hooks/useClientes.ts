import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Cliente, ClienteFormData } from "../types";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "clientes_local_storage";

// Função para obter clientes do localStorage
const getClientesFromStorage = (): Cliente[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Erro ao ler clientes do localStorage:", error);
        return [];
    }
};

// Função para salvar clientes no localStorage
const saveClientesToStorage = (clientes: Cliente[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
    } catch (error) {
        console.error("Erro ao salvar clientes no localStorage:", error);
    }
};

export function useClientes() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: clientes, isLoading } = useQuery({
        queryKey: ["clientes"],
        queryFn: async () => {
            // Simular delay de rede para melhor UX
            await new Promise(resolve => setTimeout(resolve, 100));
            return getClientesFromStorage();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newCliente: ClienteFormData) => {
            const currentClientes = getClientesFromStorage();

            // Criar novo cliente
            const cliente: Cliente = {
                id: crypto.randomUUID(),
                ...newCliente,
                created_at: new Date().toISOString(),
                created_by: "local-user",
            };

            // Adicionar ao array e salvar
            const updatedClientes = [cliente, ...currentClientes];
            saveClientesToStorage(updatedClientes);

            return cliente;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clientes"] });
            queryClient.invalidateQueries({ queryKey: ["clientes-count"] });
            toast({ title: "Cliente cadastrado com sucesso!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao cadastrar cliente",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const currentClientes = getClientesFromStorage();
            const updatedClientes = currentClientes.filter(cliente => cliente.id !== id);
            saveClientesToStorage(updatedClientes);
            return updatedClientes;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clientes"] });
            queryClient.invalidateQueries({ queryKey: ["clientes-count"] });
            toast({ title: "Cliente excluído com sucesso!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao excluir cliente",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        clientes,
        isLoading,
        createMutation,
        deleteMutation,
    };
}
