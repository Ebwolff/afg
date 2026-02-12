import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Cliente, ClienteFormData } from "../types";
import { useToast } from "@/hooks/use-toast";

export function useClientes() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: clientes, isLoading } = useQuery({
        queryKey: ["clientes"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("clientes")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Cliente[];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newCliente: ClienteFormData) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from("clientes")
                .insert({
                    ...newCliente,
                    created_by: user?.id
                })
                .select()
                .single();

            if (error) throw error;
            return data;
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
            const { data, error } = await supabase
                .from("clientes")
                .delete()
                .eq("id", id)
                .select();

            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error("Não foi possível excluir o cliente. Verifique as permissões ou se o cliente já foi excluído.");
            }
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["clientes"] });
            const previousClientes = queryClient.getQueryData<Cliente[]>(["clientes"]);

            queryClient.setQueryData<Cliente[]>(["clientes"], (old) =>
                old ? old.filter((cliente) => cliente.id !== id) : []
            );

            return { previousClientes };
        },
        onError: (err, id, context) => {
            if (context?.previousClientes) {
                queryClient.setQueryData(["clientes"], context.previousClientes);
            }
            toast({
                title: "Erro ao excluir cliente",
                description: err.message,
                variant: "destructive",
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["clientes"] });
            queryClient.invalidateQueries({ queryKey: ["clientes-count"] });
        },
        onSuccess: () => {
            toast({ title: "Cliente excluído com sucesso!" });
        },
    });

    return {
        clientes,
        isLoading,
        createMutation,
        deleteMutation,
    };
}
