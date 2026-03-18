import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Notification } from "../../tasks/types";

export function useNotifications() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Fetch inicial — carrega últimas 50 notificações
    const { data: notifications, isLoading } = useQuery({
        queryKey: ["notifications", user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(50);

            if (error) throw error;
            return data as Notification[];
        },
        enabled: !!user,
    });

    // Realtime — escuta novos INSERTs via WebSocket
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    queryClient.setQueryData(
                        ["notifications", user.id],
                        (old: Notification[] | undefined) => [
                            payload.new as Notification,
                            ...(old || []),
                        ]
                    );
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, queryClient]);

    const markAsRead = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
        },
    });

    const markAllAsRead = useMutation({
        mutationFn: async () => {
            if (!user) return;

            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("user_id", user.id)
                .eq("read", false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
        },
    });

    const unreadCount = notifications?.filter((n) => !n.read).length || 0;

    return {
        notifications,
        isLoading,
        unreadCount,
        markAsRead,
        markAllAsRead,
    };
}
