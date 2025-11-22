import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, startOfMonth, endOfMonth, addDays, isAfter, isBefore, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function useDashboardData() {
    const { data: transacoes, isLoading: loadingTransacoes } = useQuery({
        queryKey: ["transacoes-summary"],
        queryFn: async () => {
            const { data, error } = await supabase.from("transacoes").select("*");
            if (error) throw error;
            return data;
        },
    });

    const { data: clientesCount, isLoading: loadingClientes } = useQuery({
        queryKey: ["clientes-count"],
        queryFn: async () => {
            const { count, error } = await supabase
                .from("clientes")
                .select("*", { count: "exact", head: true });
            if (error) throw error;
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
            if (error) throw error;
            return count || 0;
        },
    });

    const calcularSaldo = () => {
        if (!transacoes) return { entradas: 0, saidas: 0, saldo: 0 };
        const entradas = transacoes
            .filter((t) => t.tipo === "entrada")
            .reduce((acc, t) => acc + Number(t.valor), 0);
        const saidas = transacoes
            .filter((t) => t.tipo === "saida")
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
                            t.tipo === "entrada" &&
                            t.data_pagamento &&
                            new Date(t.data_pagamento) >= start &&
                            new Date(t.data_pagamento) <= end
                    )
                    .reduce((acc, t) => acc + Number(t.valor), 0) || 0;

            const saidasMes =
                transacoes
                    ?.filter(
                        (t) =>
                            t.tipo === "saida" &&
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
                c.status === "pendente" &&
                c.data_vencimento &&
                isBefore(parseISO(c.data_vencimento), hoje)
        );

        const vencendo = transacoes.filter(
            (c) =>
                c.status === "pendente" &&
                c.data_vencimento &&
                isAfter(parseISO(c.data_vencimento), hoje) &&
                isBefore(parseISO(c.data_vencimento), em7Dias)
        );

        const valorVencido = vencidas.reduce((acc, c) => acc + Number(c.valor), 0);

        return {
            vencidas: vencidas.length,
            vencendo: vencendo.length,
            valorVencido,
        };
    };

    return {
        loading: loadingTransacoes || loadingClientes || loadingAtendimentos,
        saldo: calcularSaldo(),
        statusData: getStatusData(),
        fluxoData: getFluxoCaixaData(),
        alertas: getAlertasVencimento(),
        clientesCount,
        atendimentosCount,
    };
}
