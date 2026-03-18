import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, differenceInHours, eachWeekOfInterval, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export interface UserScore {
    userId: string;
    nome: string;
    email: string;
    score: number;
    metrics: {
        totalTasks: number;
        completedTasks: number;
        completionRate: number;
        onTimeRate: number;
        avgHours: number;
        consistency: number;
    };
    badge: "high" | "medium" | "low";
}

interface RawTask {
    id: string;
    status: string;
    assigned_to: string;
    created_at: string;
    completed_at: string | null;
    due_date: string | null;
    assignee: { nome: string; email: string }[] | null;
}


function calculateScore(tasks: RawTask[], globalAvgHours: number): Omit<UserScore, "userId" | "nome" | "email"> {
    const total = tasks.length;
    if (total === 0) {
        return {
            score: 0,
            metrics: { totalTasks: 0, completedTasks: 0, completionRate: 0, onTimeRate: 0, avgHours: 0, consistency: 0 },
            badge: "low",
        };
    }

    const completed = tasks.filter((t) => t.status === "completed");
    const completionRate = (completed.length / total) * 100;

    // Pontualidade: % concluídas dentro do prazo
    const withDueDate = completed.filter((t) => t.due_date && t.completed_at);
    const onTime = withDueDate.filter((t) => new Date(t.completed_at!) <= new Date(t.due_date!));
    const onTimeRate = withDueDate.length > 0 ? (onTime.length / withDueDate.length) * 100 : 100;

    // Velocidade: tempo médio de execução (horas)
    const completionTimes = completed
        .filter((t) => t.completed_at)
        .map((t) => differenceInHours(new Date(t.completed_at!), new Date(t.created_at)));
    const avgHours = completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

    // Normalizar velocidade (mais rápido que a média = melhor)
    let velocityScore = 100;
    if (globalAvgHours > 0 && avgHours > 0) {
        velocityScore = Math.min(100, Math.max(0, (globalAvgHours / avgHours) * 100));
    }

    // Consistência: variação de entregas por semana
    const dates = completed.filter((t) => t.completed_at).map((t) => new Date(t.completed_at!));
    let consistencyScore = 0;
    if (dates.length >= 2) {
        const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
        const weeks = eachWeekOfInterval({ start: sorted[0], end: sorted[sorted.length - 1] });
        if (weeks.length > 0) {
            const weekCounts = weeks.map((weekStart) => {
                const weekEnd = endOfWeek(weekStart);
                return dates.filter((d) => isWithinInterval(d, { start: startOfWeek(weekStart), end: weekEnd })).length;
            });
            const avg = weekCounts.reduce((a, b) => a + b, 0) / weekCounts.length;
            const variance = weekCounts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / weekCounts.length;
            const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;
            consistencyScore = Math.max(0, Math.min(100, (1 - cv) * 100));
        }
    } else if (dates.length === 1) {
        consistencyScore = 50;
    }

    const score = Math.round(
        completionRate * 0.4 +
        onTimeRate * 0.3 +
        velocityScore * 0.2 +
        consistencyScore * 0.1
    );

    const badge: UserScore["badge"] = score >= 80 ? "high" : score >= 50 ? "medium" : "low";

    return {
        score,
        metrics: {
            totalTasks: total,
            completedTasks: completed.length,
            completionRate: Math.round(completionRate),
            onTimeRate: Math.round(onTimeRate),
            avgHours: Math.round(avgHours),
            consistency: Math.round(consistencyScore),
        },
        badge,
    };
}

export function useProductivityScore(periodDays: number = 30) {
    const since = subDays(new Date(), periodDays).toISOString();

    const { data: tasks, isLoading } = useQuery({
        queryKey: ["productivity-tasks", periodDays],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tasks")
                .select("id, status, assigned_to, created_at, completed_at, due_date, assignee:assigned_to(nome, email)")
                .gte("created_at", since)
                .not("assigned_to", "is", null);

            if (error) throw error;
            return data as RawTask[];
        },
    });

    const scores = useMemo<UserScore[]>(() => {
        if (!tasks || tasks.length === 0) return [];

        // Calcular média global de velocidade
        const allCompletionTimes = tasks
            .filter((t) => t.status === "completed" && t.completed_at)
            .map((t) => differenceInHours(new Date(t.completed_at!), new Date(t.created_at)));
        const globalAvgHours = allCompletionTimes.length > 0
            ? allCompletionTimes.reduce((a, b) => a + b, 0) / allCompletionTimes.length
            : 0;

        // Agrupar por usuário
        const byUser = tasks.reduce((acc, task) => {
            if (!task.assigned_to) return acc;
            if (!acc[task.assigned_to]) acc[task.assigned_to] = [];
            acc[task.assigned_to].push(task);
            return acc;
        }, {} as Record<string, RawTask[]>);

        return Object.entries(byUser)
            .map(([userId, userTasks]) => {
                const first = userTasks[0];
                const assignee = first.assignee?.[0];
                const result = calculateScore(userTasks, globalAvgHours);
                return {
                    userId,
                    nome: assignee?.nome || "—",
                    email: assignee?.email || "",
                    ...result,
                };
            })
            .sort((a, b) => b.score - a.score);
    }, [tasks]);

    return { scores, isLoading };
}
