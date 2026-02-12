import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Produto, ProdutoFormData } from "../types";
import { useToast } from "@/hooks/use-toast";

import { handleSupabaseError } from "@/integrations/supabase/error-handler";

export function useProdutos() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: produtos, isLoading } = useQuery({
        queryKey: ["produtos"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("produtos")
                .select("*")
                .eq("ativo", true)
                .order("created_at", { ascending: false });
            if (error) handleSupabaseError(error, "Erro ao carregar produtos");
            return data as Produto[];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newProduto: ProdutoFormData) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { error } = await supabase.from("produtos").insert([
                {
                    ...newProduto,
                    valor_base: newProduto.valor_base ? parseFloat(newProduto.valor_base) : null,
                    comissao_percentual: newProduto.comissao_percentual ? parseFloat(newProduto.comissao_percentual) : null,
                    created_by: user.id,
                },
            ]);
            if (error) handleSupabaseError(error, "Erro ao cadastrar produto");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["produtos"] });
            toast({ title: "Produto/Serviço cadastrado com sucesso!" });
        },
        onError: (error: Error) => {
            // AppError is already handled or we can let specific toast handle it if needed
            // But here we kept the toast. Standard error handler throws, so this catches it.
            if (error.name !== "AppError") {
                toast({
                    title: "Erro ao cadastrar produto/serviço",
                    description: error.message,
                    variant: "destructive",
                });
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("produtos")
                .update({ ativo: false })
                .eq("id", id);
            if (error) handleSupabaseError(error, "Erro ao remover produto");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["produtos"] });
            toast({ title: "Produto/Serviço removido com sucesso!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao remover produto/serviço",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        produtos,
        isLoading,
        createMutation,
        deleteMutation,
    };
}
