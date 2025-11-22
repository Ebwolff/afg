import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Transacao, TransactionFormData, ParceladoFormData } from "../types";
import { useToast } from "@/hooks/use-toast";

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

    const createMutation = useMutation({
        mutationFn: async (newTransacao: TransactionFormData) => {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from("transacoes").insert({
                ...newTransacao,
                valor: parseFloat(newTransacao.valor),
                data_vencimento: newTransacao.data_vencimento.toISOString(),
                tipo: type,
                status: "pendente",
                created_by: user?.id,
                data: new Date().toISOString(),
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transacoes", type] });
            toast({ title: `Conta a ${type === "despesa" ? "pagar" : "receber"} criada com sucesso!` });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao criar conta",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const createParceladoMutation = useMutation({
        mutationFn: async (data: ParceladoFormData) => {
            const { data: { user } } = await supabase.auth.getUser();
            const valorParcela = parseFloat(data.valor_total) / parseInt(data.numero_parcelas);
            const parcelas = [];

            for (let i = 0; i < parseInt(data.numero_parcelas); i++) {
                const dataVencimento = new Date(data.data_primeiro_vencimento);
                dataVencimento.setMonth(dataVencimento.getMonth() + i);

                parcelas.push({
                    descricao: data.descricao,
                    valor: valorParcela,
                    categoria: data.categoria,
                    data_vencimento: dataVencimento.toISOString(),
                    fornecedor_cliente: data.fornecedor_cliente,
                    documento: data.documento,
                    conta_bancaria: data.conta_bancaria,
                    observacoes: data.observacoes,
                    parcela_numero: i + 1,
                    parcela_total: parseInt(data.numero_parcelas),
                    tipo: type,
                    status: "pendente",
                    created_by: user?.id,
                    data: new Date().toISOString(),
                });
            }

            const { error } = await supabase.from("transacoes").insert(parcelas);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transacoes", type] });
            toast({ title: "Contas parceladas criadas com sucesso!" });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro ao criar contas parceladas",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Transacao> & { id: string }) => {
            const { error } = await supabase
                .from("transacoes")
                .update(updates)
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transacoes", type] });
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

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("transacoes").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transacoes", type] });
            toast({ title: "Conta excluída com sucesso!" });
        },
        onError: (error: Error) => {
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
