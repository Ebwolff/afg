import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, differenceInHours, eachWeekOfInterval, startOfWeek, endOfWeek, isWithinInterval, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface UserScore {
    userId: string;
    nome: string;
    email: string;
    score: number;
    metrics: {
        totalTasks: number;
        completedTasks: number;
        overdueTasks: number;
        completionRate: number;
        onTimeRate: number;
        avgHours: number;
        consistency: number;
    };
    badge: "high" | "medium" | "low";
    recentTasks: { id: string; title: string; status: string; completed_at: string | null; due_date: string | null }[];
}

export interface GlobalStats {
    totalTasks: number;
    completedTasks: number;
    globalOnTimeRate: number;
    globalAvgHours: number;
    overdueTasks: number;
}

export interface WeeklyEvolution {
    week: string;
    avgScore: number;
}

interface RawTask {
    id: string;
    title: string;
    status: string;
    assigned_to: string;
    created_at: string;
    completed_at: string | null;
    due_date: string | null;
    assignee: { nome: string; email: string }[] | null;
}

function calculateScore(tasks: RawTask[], globalAvgHours: number): Omit<UserScore, "userId" | "nome" | "email" | "recentTasks"> {
    const total = tasks.length;
    if (total === 0) {
        return {
            score: 0,
            metrics: { totalTasks: 0, completedTasks: 0, overdueTasks: 0, completionRate: 0, onTimeRate: 0, avgHours: 0, consistency: 0 },
            badge: "low",
        };
    }

    const completed = tasks.filter((t) => t.status === "completed");
    const now = new Date();
    const overdueTasks = tasks.filter(
        (t) => t.status !== "completed" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < now
    ).length;

    const completionRate = (completed.length / total) * 100;

    const withDueDate = completed.filter((t) => t.due_date && t.completed_at);
    const onTime = withDueDate.filter((t) => new Date(t.completed_at!) <= new Date(t.due_date!));
    const onTimeRate = withDueDate.length > 0 ? (onTime.length / withDueDate.length) * 100 : 100;

    const completionTimes = completed
        .filter((t) => t.completed_at)
        .map((t) => differenceInHours(new Date(t.completed_at!), new Date(t.created_at)));
    const avgHours = completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        : 0;

    let velocityScore = 100;
    if (globalAvgHours > 0 && avgHours > 0) {
        velocityScore = Math.min(100, Math.max(0, (globalAvgHours / avgHours) * 100));
    }

    const dates = completed.filter((t) => t.completed_at).map((t) => new Date(t.completed_at!));
    let consistencyScore = 0;
    if (dates.length >= 2) {
        const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
        const weeks = eachWeekOfInterval({ start: sorted[0], end: sorted[sorted.length - 1] });
        if (weeks.length > 0) {
            const weekCounts = weeks.map((weekStart) => {
                const we = endOfWeek(weekStart);
                return dates.filter((d) => isWithinInterval(d, { start: startOfWeek(weekStart), end: we })).length;
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
        completionRate * 0.4 + onTimeRate * 0.3 + velocityScore * 0.2 + consistencyScore * 0.1
    );
    const badge: UserScore["badge"] = score >= 80 ? "high" : score >= 50 ? "medium" : "low";

    return {
        score,
        metrics: {
            totalTasks: total,
            completedTasks: completed.length,
            overdueTasks,
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
                .select("id, title, status, assigned_to, created_at, completed_at, due_date, assignee:assigned_to(nome, email)")
                .gte("created_at", since)
                .not("assigned_to", "is", null);

            if (error) throw error;
            return data as RawTask[];
        },
    });

    const result = useMemo(() => {
        if (!tasks || tasks.length === 0) {
            return {
                scores: [] as UserScore[],
                globalStats: { totalTasks: 0, completedTasks: 0, globalOnTimeRate: 0, globalAvgHours: 0, overdueTasks: 0 } as GlobalStats,
                weeklyEvolution: [] as WeeklyEvolution[],
            };
        }

        const now = new Date();
        const allCompleted = tasks.filter((t) => t.status === "completed" && t.completed_at);
        const allCompletionTimes = allCompleted.map((t) => differenceInHours(new Date(t.completed_at!), new Date(t.created_at)));
        const globalAvgHours = allCompletionTimes.length > 0
            ? allCompletionTimes.reduce((a, b) => a + b, 0) / allCompletionTimes.length : 0;

        const withDue = allCompleted.filter((t) => t.due_date);
        const globalOnTime = withDue.filter((t) => new Date(t.completed_at!) <= new Date(t.due_date!));
        const overdueTasks = tasks.filter(
            (t) => t.status !== "completed" && t.status !== "cancelled" && t.due_date && new Date(t.due_date) < now
        ).length;

        const globalStats: GlobalStats = {
            totalTasks: tasks.length,
            completedTasks: allCompleted.length,
            globalOnTimeRate: withDue.length > 0 ? Math.round((globalOnTime.length / withDue.length) * 100) : 100,
            globalAvgHours: Math.round(globalAvgHours),
            overdueTasks,
        };

        // Scores by user
        const byUser = tasks.reduce((acc, task) => {
            if (!task.assigned_to) return acc;
            if (!acc[task.assigned_to]) acc[task.assigned_to] = [];
            acc[task.assigned_to].push(task);
            return acc;
        }, {} as Record<string, RawTask[]>);

        const scores: UserScore[] = Object.entries(byUser)
            .map(([userId, userTasks]) => {
                const assignee = userTasks[0].assignee?.[0];
                const scoreData = calculateScore(userTasks, globalAvgHours);
                const recentTasks = userTasks
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((t) => ({ id: t.id, title: t.title, status: t.status, completed_at: t.completed_at, due_date: t.due_date }));

                return {
                    userId,
                    nome: assignee?.nome || "—",
                    email: assignee?.email || "",
                    ...scoreData,
                    recentTasks,
                };
            })
            .sort((a, b) => b.score - a.score);

        // Weekly evolution (average score per week)
        const weeklyEvolution: WeeklyEvolution[] = [];
        if (allCompleted.length > 0) {
            const sortedDates = allCompleted.map((t) => new Date(t.completed_at!)).sort((a, b) => a.getTime() - b.getTime());
            const weeks = eachWeekOfInterval({ start: sortedDates[0], end: sortedDates[sortedDates.length - 1] });

            for (const weekStart of weeks) {
                const we = endOfWeek(weekStart);
                const weekTasks = tasks.filter(
                    (t) => t.completed_at && isWithinInterval(new Date(t.completed_at), { start: startOfWeek(weekStart), end: we })
                );
                if (weekTasks.length === 0) {
                    weeklyEvolution.push({ week: format(weekStart, "dd/MM", { locale: ptBR }), avgScore: 0 });
                    continue;
                }
                const weekCompleted = weekTasks.length;
                const weekTotal = tasks.filter(
                    (t) => isWithinInterval(new Date(t.created_at), { start: startOfWeek(weekStart), end: we })
                ).length || weekCompleted;
                const rate = Math.round((weekCompleted / Math.max(weekTotal, 1)) * 100);
                weeklyEvolution.push({ week: format(weekStart, "dd/MM", { locale: ptBR }), avgScore: Math.min(rate, 100) });
            }
        }

        return { scores, globalStats, weeklyEvolution };
    }, [tasks]);

    return { ...result, isLoading };
}
