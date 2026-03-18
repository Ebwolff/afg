import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ALERT_DAYS = [7, 3, 1, 0];

function getDueDateLabel(daysUntil: number): string {
    if (daysUntil === 0) return "vence HOJE";
    if (daysUntil === 1) return "vence amanhã";
    return `vence em ${daysUntil} dias`;
}

function getNotificationType(tipo: string): string {
    return tipo === "despesa" ? "conta_pagar_vencimento" : "conta_receber_vencimento";
}

function getNotificationTitle(tipo: string, daysUntil: number): string {
    const label = tipo === "despesa" ? "Conta a pagar" : "Conta a receber";
    if (daysUntil === 0) return `⚠️ ${label} vence hoje!`;
    if (daysUntil === 1) return `${label} vence amanhã`;
    return `${label} vence em ${daysUntil} dias`;
}

export function useDueDateNotifier() {
    const { user, isAdmin } = useAuth();
    const hasRun = useRef(false);

    useEffect(() => {
        if (!user?.id || hasRun.current) return;
        hasRun.current = true;

        checkDueDates(user.id, isAdmin);
    }, [user?.id, isAdmin]);
}

async function checkDueDates(userId: string, isAdmin: boolean) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get pending transactions with due dates
        const { data: transactions, error } = await supabase
            .from("transacoes")
            .select("id, descricao, tipo, valor, data_vencimento, fornecedor_cliente, status")
            .eq("status", "pendente")
            .not("data_vencimento", "is", null);

        if (error || !transactions) return;

        // Get existing notifications to avoid duplicates (from today)
        const todayStr = format(today, "yyyy-MM-dd");
        const { data: existing } = await supabase
            .from("notifications")
            .select("message")
            .eq("user_id", userId)
            .gte("created_at", `${todayStr}T00:00:00`)
            .in("type", ["conta_pagar_vencimento", "conta_receber_vencimento"]);

        const existingMessages = new Set(existing?.map((n) => n.message) || []);

        const notifications: Array<{
            user_id: string;
            title: string;
            message: string;
            type: string;
            link: string;
            read: boolean;
        }> = [];

        for (const tx of transactions) {
            if (!tx.data_vencimento) continue;
            const dueDate = new Date(tx.data_vencimento);
            dueDate.setHours(0, 0, 0, 0);
            const daysUntil = differenceInCalendarDays(dueDate, today);

            // Check if this matches any alert threshold
            const matchedThreshold = ALERT_DAYS.find((d) => daysUntil === d);
            if (matchedThreshold === undefined) continue;

            const valorFormatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tx.valor);
            const vencimento = format(dueDate, "dd/MM/yyyy", { locale: ptBR });
            const tipo = tx.tipo;
            const title = getNotificationTitle(tipo, daysUntil);
            const fornecedor = tx.fornecedor_cliente ? ` — ${tx.fornecedor_cliente}` : "";
            const message = `${tx.descricao}${fornecedor} | ${valorFormatted} | ${getDueDateLabel(daysUntil)} (${vencimento})`;

            // Skip if already notified today
            if (existingMessages.has(message)) continue;

            const link = tipo === "despesa" ? "/contas-pagar" : "/contas-receber";

            // If admin, notify the admin. Otherwise notify current user.
            notifications.push({
                user_id: userId,
                title,
                message,
                type: getNotificationType(tipo),
                link,
                read: false,
            });
        }

        if (notifications.length === 0) return;

        // Also notify all other admins
        if (isAdmin) {
            const { data: adminRoles } = await supabase
                .from("user_roles")
                .select("user_id")
                .eq("role", "admin")
                .neq("user_id", userId);

            const otherAdmins = adminRoles?.map((r) => r.user_id) || [];

            const extraNotifs = notifications.flatMap((n) =>
                otherAdmins.map((adminId) => ({ ...n, user_id: adminId }))
            );

            notifications.push(...extraNotifs);
        }

        // Insert all at once
        await supabase.from("notifications").insert(notifications);
    } catch {
        // Silent fail — don't break the app for notification failures
    }
}
