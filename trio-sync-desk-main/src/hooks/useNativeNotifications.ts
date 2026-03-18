import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useNativeNotifications() {
    const { user } = useAuth();
    const permissionRef = useRef(false);

    // Request permission on mount
    useEffect(() => {
        if (!("Notification" in window)) return;
        if (Notification.permission === "granted") {
            permissionRef.current = true;
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((perm) => {
                permissionRef.current = perm === "granted";
            });
        }
    }, []);

    // Listen for new notifications and show native notification
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel("native-notifs")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (!permissionRef.current) return;
                    const n = payload.new as { title: string; message: string; link?: string };
                    const notification = new Notification(n.title, {
                        body: n.message,
                        icon: "/icon.png",
                        badge: "/icon.png",
                        tag: `notif-${Date.now()}`,
                    });
                    notification.onclick = () => {
                        window.focus();
                        if (n.link) window.location.hash = `#${n.link}`;
                        notification.close();
                    };
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);
}
