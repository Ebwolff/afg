import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DollarSign, TrendingUp, TrendingDown, Users, ClipboardList,
    CheckCircle2, AlertTriangle, Target
} from "lucide-react";
import { useHideValues } from "@/hooks/useHideValues";

interface DashboardSummaryCardsProps {
    loading: boolean;
    saldo: { entradas: number; saidas: number; saldo: number };
    clientesCount: number;
    atendimentosCount: number;
    tasksKPIs: { total: number; pending: number; overdue: number; completedThisMonth: number };
    ticketMedio: number;
}

export function DashboardSummaryCards({
    loading,
    saldo,
    clientesCount,
    atendimentosCount,
    tasksKPIs,
    ticketMedio,
}: DashboardSummaryCardsProps) {
    const { mask } = useHideValues();

    const cards = [
        {
            title: "Saldo Total",
            value: mask(saldo.saldo),
            subtitle: saldo.entradas > 0 ? `+${mask(saldo.entradas)} entradas` : "",
            icon: DollarSign,
            iconColor: "text-emerald-500",
            valueColor: "text-primary",
        },
        {
            title: "Receitas",
            value: mask(saldo.entradas),
            subtitle: "Total de entradas",
            icon: TrendingUp,
            iconColor: "text-emerald-500",
            valueColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
            title: "Despesas",
            value: mask(saldo.saidas),
            subtitle: "Total de saídas",
            icon: TrendingDown,
            iconColor: "text-red-500",
            valueColor: "text-destructive",
        },
        {
            title: "Ticket Médio",
            value: mask(ticketMedio),
            subtitle: "Por receita",
            icon: Target,
            iconColor: "text-blue-500",
            valueColor: "",
        },
        {
            title: "Clientes",
            value: String(clientesCount),
            subtitle: "Total cadastrados",
            icon: Users,
            iconColor: "text-blue-500",
            valueColor: "",
        },
        {
            title: "Atendimentos",
            value: String(atendimentosCount),
            subtitle: "Aguardando",
            icon: ClipboardList,
            iconColor: "text-amber-500",
            valueColor: atendimentosCount > 0 ? "text-amber-600 dark:text-amber-400" : "",
        },
        {
            title: "Tarefas Concluídas",
            value: String(tasksKPIs.completedThisMonth),
            subtitle: "Este mês",
            icon: CheckCircle2,
            iconColor: "text-emerald-500",
            valueColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
            title: "Tarefas Atrasadas",
            value: String(tasksKPIs.overdue),
            subtitle: `${tasksKPIs.pending} pendente(s)`,
            icon: AlertTriangle,
            iconColor: tasksKPIs.overdue > 0 ? "text-red-500" : "text-muted-foreground",
            valueColor: tasksKPIs.overdue > 0 ? "text-destructive" : "",
        },
    ];

    return (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 stagger-children">
            {cards.map((card) => (
                <Card key={card.title} className="card-hover">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className={`text-2xl font-bold ${card.valueColor}`}>
                                {card.value}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
