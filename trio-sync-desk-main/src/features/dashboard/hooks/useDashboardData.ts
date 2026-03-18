import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, startOfMonth, endOfMonth, addDays, isAfter, isBefore, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { handleSupabaseError } from "@/integrations/supabase/error-handler";

export function useDashboardData() {
    const { data: transacoes, isLoading: loadingTransacoes } = useQuery({
        queryKey: ["transacoes-summary"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("transacoes")
                .select("id, tipo, valor, status, data_vencimento, data_pagamento, created_at");
            if (error) handleSupabaseError(error, "Erro ao carregar transações");
            return data;
        },
    });

    const { data: clientesCount, isLoading: loadingClientes } = useQuery({
        queryKey: ["clientes-count"],
        queryFn: async () => {
            const { count, error } = await supabase
                .from("clientes")
                .select("*", { count: "exact", head: true });
            if (error) handleSupabaseError(error, "Erro ao contar clientes");
            return count || 0;
        },
    });

    const { data: atendimentosCount, isLoading: loadingAtendimentos } = useQuery({
        queryKey: ["atendimentos-pending"],
        queryFn: async () => {
            const { count, error } = await supabase
                .from("atendimentos")
                .select("*", { count: "exact", head: true })
                .eq("status", "aguardando");
            if (error) handleSupabaseError(error, "Erro ao contar atendimentos");
            return count || 0;
        },
    });

    // Tarefas pendentes e atrasadas
    const { data: tasksData, isLoading: loadingTasks } = useQuery({
        queryKey: ["dashboard-tasks"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tasks")
                .select("id, status, due_date, assigned_to, completed_at");
            if (error) handleSupabaseError(error, "Erro ao carregar tarefas");
            return data || [];
        },
    });

    // Top 5 produtividade (mini ranking)
    const { data: teamData, isLoading: loadingTeam } = useQuery({
        queryKey: ["dashboard-team"],
        queryFn: async () => {
            const { data: profiles, error } = await supabase
                .from("profiles")
                .select("id, nome");
            if (error) handleSupabaseError(error, "Erro ao carregar equipe");
            return profiles || [];
        },
    });

    const calcularSaldo = () => {
        if (!transacoes) return { entradas: 0, saidas: 0, saldo: 0 };
        const entradas = transacoes
            .filter((t) => t.tipo === "receita")
            .reduce((acc, t) => acc + Number(t.valor), 0);
        const saidas = transacoes
            .filter((t) => t.tipo === "despesa")
            .reduce((acc, t) => acc + Number(t.valor), 0);
        return { entradas, saidas, saldo: entradas - saidas };
    };

    const getStatusData = () => {
        if (!transacoes) return [];
        const statusCount = transacoes.reduce((acc, conta) => {
            const status = conta.status || "pendente";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const statusLabels: Record<string, string> = {
            pendente: "Pendentes",
            pago: "Pagas",
            vencido: "Vencidas",
            cancelado: "Canceladas",
        };

        return Object.entries(statusCount).map(([status, count]) => ({
            name: statusLabels[status] || status,
            value: Number(count),
            status,
        }));
    };

    const getFluxoCaixaData = () => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const entradasMes =
                transacoes
                    ?.filter(
                        (t) =>
                            t.tipo === "receita" &&
                            t.data_pagamento &&
                            new Date(t.data_pagamento) >= start &&
                            new Date(t.data_pagamento) <= end
                    )
                    .reduce((acc, t) => acc + Number(t.valor), 0) || 0;

            const saidasMes =
                transacoes
                    ?.filter(
                        (t) =>
                            t.tipo === "despesa" &&
                            t.data_pagamento &&
                            new Date(t.data_pagamento) >= start &&
                            new Date(t.data_pagamento) <= end
                    )
                    .reduce((acc, t) => acc + Number(t.valor), 0) || 0;

            months.push({
                mes: format(date, "MMM", { locale: ptBR }),
                entradas: entradasMes,
                saidas: saidasMes,
                saldo: entradasMes - saidasMes,
            });
        }
        return months;
    };

    const getAlertasVencimento = () => {
        if (!transacoes) return { vencidas: 0, vencendo: 0, valorVencido: 0 };
        const hoje = new Date();
        const em7Dias = addDays(hoje, 7);

        const vencidas = transacoes.filter(
            (c) =>
                c.tipo === "despesa" &&
                c.status === "pendente" &&
                c.data_vencimento &&
                isBefore(parseISO(c.data_vencimento), hoje)
        );

        const vencendo = transacoes.filter(
            (c) =>
                c.tipo === "despesa" &&
                c.status === "pendente" &&
                c.data_vencimento &&
                isAfter(parseISO(c.data_vencimento), hoje) &&
                isBefore(parseISO(c.data_vencimento), em7Dias)
        );

        const valorVencido = vencidas.reduce((acc, c) => acc + Number(c.valor), 0);
        return { vencidas: vencidas.length, vencendo: vencendo.length, valorVencido };
    };

    // KPIs de tarefas
    const getTasksKPIs = () => {
        if (!tasksData) return { total: 0, pending: 0, overdue: 0, completedThisMonth: 0 };
        const hoje = new Date();
        const mesAtual = startOfMonth(hoje);

        const pending = tasksData.filter((t) => t.status === "pending" || t.status === "in_progress");
        const overdue = pending.filter((t) => t.due_date && isBefore(parseISO(t.due_date), hoje));
        const completedThisMonth = tasksData.filter(
            (t) => t.status === "completed" && t.completed_at && new Date(t.completed_at) >= mesAtual
        );

        return {
            total: tasksData.length,
            pending: pending.length,
            overdue: overdue.length,
            completedThisMonth: completedThisMonth.length,
        };
    };

    // Mini ranking da equipe (baseado em tarefas concluídas no mês)
    const getTeamRanking = () => {
        if (!tasksData || !teamData) return [];
        const hoje = new Date();
        const mesAtual = startOfMonth(hoje);

        const completedThisMonth = tasksData.filter(
            (t) => t.status === "completed" && t.completed_at && new Date(t.completed_at) >= mesAtual
        );

        const countByUser: Record<string, number> = {};
        completedThisMonth.forEach((t) => {
            if (t.assigned_to) {
                countByUser[t.assigned_to] = (countByUser[t.assigned_to] || 0) + 1;
            }
        });

        return teamData
            .filter((p) => countByUser[p.id])
            .map((p) => ({ id: p.id, nome: p.nome, completed: countByUser[p.id] }))
            .sort((a, b) => b.completed - a.completed)
            .slice(0, 5);
    };

    // Ticket médio
    const getTicketMedio = () => {
        if (!transacoes) return 0;
        const receitas = transacoes.filter((t) => t.tipo === "receita");
        if (receitas.length === 0) return 0;
        return receitas.reduce((acc, t) => acc + Number(t.valor), 0) / receitas.length;
    };

    return {
        loading: loadingTransacoes || loadingClientes || loadingAtendimentos || loadingTasks || loadingTeam,
        saldo: calcularSaldo(),
        statusData: getStatusData(),
        fluxoData: getFluxoCaixaData(),
        alertas: getAlertasVencimento(),
        clientesCount,
        atendimentosCount,
        tasksKPIs: getTasksKPIs(),
        teamRanking: getTeamRanking(),
        ticketMedio: getTicketMedio(),
        recentTransactions: transacoes?.slice(0, 5) || [],
    };
}
