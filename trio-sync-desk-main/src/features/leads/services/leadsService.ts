import { supabase } from "@/integrations/supabase/client";

export interface Lead {
    id: string;
    nome: string;
    whatsapp: string | null;
    instagram_handle: string | null;
    origem: string | null;
    tipo_credito: string | null;
    valor_desejado: number | null;
    renda_aproximada: number | null;
    prazo_interesse: number | null;
    status: string;
    atribuido_a: string | null;
    created_at: string;
}

export interface FunnelStage {
    id: string;
    nome: string;
    cor: string | null;
    ordem: number;
}

export const leadsService = {
    async getLeads() {
        const { data, error } = await supabase
            .from("leads")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as Lead[];
    },

    async getStages() {
        const { data, error } = await supabase
            .from("funnel_stages")
            .select("*")
            .order("ordem", { ascending: true });

        if (error) throw error;
        return data as FunnelStage[];
    },

    async updateLeadStatus(leadId: string, status: string) {
        const { data, error } = await supabase
            .from("leads")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", leadId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async createLead(lead: Partial<Lead>) {
        const { data, error } = await supabase
            .from("leads")
            .insert([lead])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
