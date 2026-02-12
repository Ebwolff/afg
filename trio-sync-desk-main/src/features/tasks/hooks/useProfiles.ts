import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
    id: string;
    nome: string;
    email: string;
}

export function useProfiles() {
    return useQuery({
        queryKey: ["profiles"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, nome, email")
                .order("nome");

            if (error) throw error;
            return data as Profile[];
        },
    });
}
