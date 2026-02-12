import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Transacao } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";
import { createTransaction, createParceladoTransaction, updateTransaction, deleteTransaction } from "../api/transactions";

export function useTransactions(type: "receita" | "despesa" = "despesa", statusFilter: string = "todas") {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: transacoes, isLoading } = useQuery({
        queryKey: ["transacoes", type, statusFilter],
        queryFn: async () => {
            let query = supabase
                .from("transacoes")
                .select("*")
                .eq("tipo", type)
                .order("data_vencimento", { ascending: true });

            if (statusFilter !== "todas") {
                query = query.eq("status", statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Transacao[];
        },
    });

    const createMutation = useOfflineMutation({
        mutationFn: createTransaction,
        mutationKey: ["createTransaction"],
        meta: { offlineKey: "createTransaction" },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transacoes", type] });
            queryClient.invalidateQueries({ queryKey: ["transacoes-summary"] });
            toast({ title: `Conta a ${type === "despesa" ? "pagar" : "receber"} criada com sucesso!` });
            if (window.notification) {
                window.notification.send(
                    `Nova ${type === "despesa" ? "Despesa" : "Receita"}`,
                    `Conta a ${type === "despesa" ? "pagar" : "receber"} criada com sucesso!`
                );
            }
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao criar conta",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const createParceladoMutation = useOfflineMutation({
        mutationFn: createParceladoTransaction,
        mutationKey: ["createParceladoTransaction"],
        meta: { offlineKey: "createParceladoTransaction" },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transacoes", type] });
            queryClient.invalidateQueries({ queryKey: ["transacoes-summary"] });
            toast({ title: "Contas parceladas criadas com sucesso!" });
            if (window.notification) {
                window.notification.send(
                    `Nova ${type === "despesa" ? "Despesa" : "Receita"} Parcelada`,
                    "Contas parceladas criadas com sucesso!"
                );
            }
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao criar contas parceladas",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateMutation = useOfflineMutation({
        mutationFn: updateTransaction,
        mutationKey: ["updateTransaction"],
        meta: { offlineKey: "updateTransaction" },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transacoes", type] });
            queryClient.invalidateQueries({ queryKey: ["transacoes-summary"] });
            toast({ title: "Conta atualizada com sucesso!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao atualizar conta",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useOfflineMutation({
        mutationFn: deleteTransaction,
        mutationKey: ["deleteTransaction"],
        meta: { offlineKey: "deleteTransaction" },
        onMutate: async (id: string) => {
            // Cancelar refetches pendentes
            await queryClient.cancelQueries({ queryKey: ["transacoes", type] });
            await queryClient.cancelQueries({ queryKey: ["transacoes-summary"] });

            // Snapshot dos valores anteriores
            const previousTransacoes = queryClient.getQueryData<Transacao[]>(["transacoes", type, statusFilter]);
            const previousSummary = queryClient.getQueryData<Transacao[]>(["transacoes-summary"]);

            // Atualização Otimista: Remover o item das listas
            if (previousTransacoes) {
                queryClient.setQueryData<Transacao[]>(["transacoes", type, statusFilter], (old) =>
                    old ? old.filter((t) => t.id !== id) : []
                );
            }

            if (previousSummary) {
                queryClient.setQueryData<Transacao[]>(["transacoes-summary"], (old) =>
                    old ? old.filter((t) => t.id !== id) : []
                );
            }

            return { previousTransacoes, previousSummary };
        },
        onSuccess: (_data, id) => {
            // Garantir que o cache esteja atualizado (caso o onMutate não tenha rodado ou para confirmar)
            queryClient.setQueryData<Transacao[]>(["transacoes", type, statusFilter], (old) =>
                old ? old.filter((t) => t.id !== id) : []
            );
            queryClient.setQueryData<Transacao[]>(["transacoes-summary"], (old) =>
                old ? old.filter((t) => t.id !== id) : []
            );

            queryClient.invalidateQueries({ queryKey: ["transacoes", type] });
            queryClient.invalidateQueries({ queryKey: ["transacoes-summary"] });
            toast({ title: "Conta excluída com sucesso!" });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: Error, _id, context: any) => {
            // Rollback em caso de erro
            if (context?.previousTransacoes) {
                queryClient.setQueryData(["transacoes", type, statusFilter], context.previousTransacoes);
            }
            if (context?.previousSummary) {
                queryClient.setQueryData(["transacoes-summary"], context.previousSummary);
            }

            toast({
                title: "Erro ao excluir conta",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        transacoes,
        isLoading,
        createMutation,
        createParceladoMutation,
        updateMutation,
        deleteMutation,
    };
}
