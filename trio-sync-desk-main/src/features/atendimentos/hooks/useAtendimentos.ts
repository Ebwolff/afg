import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Atendimento, AtendimentoFormData } from "../types";
import { useToast } from "@/hooks/use-toast";

export function useAtendimentos() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: atendimentos, isLoading } = useQuery({
        queryKey: ["atendimentos"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("atendimentos")
                .select("*, solicitante:solicitado_por(nome)")
                .order("created_at", { ascending: false });

            if (error) throw error;

            return (data || []).map((item: any) => ({
                ...item,
                solicitante_nome: item.solicitante?.nome || null,
            })) as Atendimento[];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newAtendimento: AtendimentoFormData) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from("atendimentos")
                .insert({
                    cliente_nome: newAtendimento.cliente_nome,
                    cliente_contato: newAtendimento.cliente_contato,
                    tipo_solicitacao: newAtendimento.tipo_solicitacao,
                    descricao: newAtendimento.descricao || null,
                    status: "aguardando",
                    solicitado_por: user?.id || null,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
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
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from("atendimentos")
                .update({
                    status: "em_atendimento",
                    atendido_por: user?.id || null,
                    atendido_at: new Date().toISOString(),
                })
                .eq("id", atendimentoId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
            queryClient.invalidateQueries({ queryKey: ["atendimentos-pending"] });
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
            const { error } = await supabase
                .from("atendimentos")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["atendimentos"] });
            const previousAtendimentos = queryClient.getQueryData<Atendimento[]>(["atendimentos"]);

            queryClient.setQueryData<Atendimento[]>(["atendimentos"], (old) =>
                old ? old.filter((a) => a.id !== id) : []
            );

            return { previousAtendimentos };
        },
        onError: (err, _id, context) => {
            if (context?.previousAtendimentos) {
                queryClient.setQueryData(["atendimentos"], context.previousAtendimentos);
            }
            toast({
                title: "Erro ao excluir atendimento",
                description: err.message,
                variant: "destructive",
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
            queryClient.invalidateQueries({ queryKey: ["atendimentos-pending"] });
        },
        onSuccess: () => {
            toast({ title: "Atendimento excluído com sucesso!" });
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
