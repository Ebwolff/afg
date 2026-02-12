import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsService, Lead } from "../services/leadsService";
import { toast } from "sonner";

export const useLeads = () => {
    const queryClient = useQueryClient();

    const leadsQuery = useQuery({
        queryKey: ["leads"],
        queryFn: leadsService.getLeads,
    });

    const stagesQuery = useQuery({
        queryKey: ["funnel-stages"],
        queryFn: leadsService.getStages,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ leadId, status }: { leadId: string; status: string }) =>
            leadsService.updateLeadStatus(leadId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            toast.success("Status do lead atualizado!");
        },
        onError: (error) => {
            console.error("Erro ao atualizar status do lead:", error);
            toast.error("Erro ao atualizar status.");
        },
    });

    const createLeadMutation = useMutation({
        mutationFn: (lead: Partial<Lead>) => leadsService.createLead(lead),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            toast.success("Novo lead cadastrado com sucesso!");
        },
        onError: (error) => {
            console.error("Erro ao criar lead:", error);
            toast.error("Erro ao cadastrar lead.");
        },
    });

    return {
        leads: leadsQuery.data ?? [],
        stages: stagesQuery.data ?? [],
        isLoading: leadsQuery.isLoading || stagesQuery.isLoading,
        updateStatus: updateStatusMutation.mutate,
        createLead: createLeadMutation.mutate,
    };
};
