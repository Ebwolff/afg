import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useProductivityScore, UserScore } from "@/hooks/useProductivityScore";
import {
    Trophy, TrendingUp, Clock, Target, CheckCircle2, AlertTriangle,
    ChevronDown, ChevronUp, Download, ListTodo, Timer, Users,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const BADGE_CONFIG = {
    high: { label: "Alta Performance", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    medium: { label: "Média", color: "bg-amber-100 text-amber-700 border-amber-200" },
    low: { label: "Baixa", color: "bg-red-100 text-red-700 border-red-200" },
};

const STATUS_LABELS: Record<string, string> = {
    pending: "Pendente",
    in_progress: "Em Andamento",
    completed: "Concluída",
    cancelled: "Cancelada",
};

/* ── Score Circle with animation ──────────────── */
function ScoreCircle({ score, badge, size = 80 }: { score: number; badge: UserScore["badge"]; size?: number }) {
    const r = (size / 2) - 8;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (score / 100) * circumference;
    const color = badge === "high" ? "#10b981" : badge === "medium" ? "#f59e0b" : "#ef4444";

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{score}</span>
        </div>
    );
}

/* ── Summary Stat Card ────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 py-4 px-5">
                <div className={`p-2.5 rounded-lg ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

/* ── Metric Row ───────────────────────────────── */
function MetricRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{label}</span>
            <span className="ml-auto font-medium">{value}</span>
        </div>
    );
}

/* ── CSV Export ────────────────────────────────── */
function exportCSV(scores: UserScore[], periodDays: number) {
    const header = "Posição,Nome,Email,Score,Badge,Tarefas,Concluídas,Atrasadas,% Conclusão,% No Prazo,Tempo Médio (h),Consistência";
    const rows = scores.map((u, i) =>
        `${i + 1},"${u.nome}","${u.email}",${u.score},${u.badge},${u.metrics.totalTasks},${u.metrics.completedTasks},${u.metrics.overdueTasks},${u.metrics.completionRate}%,${u.metrics.onTimeRate}%,${u.metrics.avgHours},${u.metrics.consistency}%`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `produtividade_${periodDays}d_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/* ── Chart configs ────────────────────────────── */
const barChartConfig = {
    score: { label: "Score", color: "#10b981" },
};

const lineChartConfig = {
    avgScore: { label: "Taxa de Conclusão Semanal", color: "#6366f1" },
};

/* ── Main Component ───────────────────────────── */
export function ProductivityPanel() {
    const [period, setPeriod] = useState("30");
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const { scores, globalStats, weeklyEvolution, isLoading } = useProductivityScore(Number(period));

    if (isLoading) {
        return <div className="py-12 text-center text-muted-foreground">Calculando produtividade...</div>;
    }

    return (
        <div className="space-y-6">
            {/* ── Header + Filter + Export ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                        <SelectItem value="90">Últimos 90 dias</SelectItem>
                    </SelectContent>
                </Select>
                {scores.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => exportCSV(scores, Number(period))}>
                        <Download className="mr-2 h-4 w-4" /> Exportar CSV
                    </Button>
                )}
            </div>

            {/* ── 1. Summary Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={ListTodo} label="Total de Tarefas" value={globalStats.totalTasks} color="bg-blue-100 text-blue-700" />
                <StatCard icon={CheckCircle2} label="Concluídas" value={globalStats.completedTasks}
                    sub={globalStats.totalTasks > 0 ? `${Math.round((globalStats.completedTasks / globalStats.totalTasks) * 100)}% do total` : undefined}
                    color="bg-emerald-100 text-emerald-700" />
                <StatCard icon={Target} label="No Prazo" value={`${globalStats.globalOnTimeRate}%`} color="bg-indigo-100 text-indigo-700" />
                <StatCard icon={Timer} label="Tempo Médio" value={globalStats.globalAvgHours > 0 ? `${globalStats.globalAvgHours}h` : "—"}
                    sub={globalStats.overdueTasks > 0 ? `${globalStats.overdueTasks} atrasada(s)` : undefined}
                    color="bg-amber-100 text-amber-700" />
            </div>

            {scores.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Nenhuma tarefa atribuída no período selecionado.
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* ── 2. Bar Chart: Score Comparison ── */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Users className="h-4 w-4" /> Comparativo de Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={barChartConfig} className="h-[200px] w-full">
                                <BarChart data={scores.map((s) => ({ name: s.nome, score: s.score }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} />
                                    <YAxis domain={[0, 100]} fontSize={12} tickLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="score" fill="var(--color-score)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* ── 3. Line Chart: Weekly Evolution ── */}
                    {weeklyEvolution.length > 1 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <TrendingUp className="h-4 w-4" /> Evolução Semanal
                                </CardTitle>
                                <CardDescription>Taxa de conclusão de tarefas por semana</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={lineChartConfig} className="h-[200px] w-full">
                                    <LineChart data={weeklyEvolution}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="week" fontSize={12} tickLine={false} />
                                        <YAxis domain={[0, 100]} fontSize={12} tickLine={false} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Line type="monotone" dataKey="avgScore" stroke="var(--color-avgScore)" strokeWidth={2} dot={{ r: 4 }} />
                                    </LineChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── 4-6. Ranking with expandable details + overdue + animations ── */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-500" /> Ranking da Equipe
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {scores.map((user, index) => {
                                const badgeCfg = BADGE_CONFIG[user.badge];
                                const isExpanded = expandedUser === user.userId;

                                return (
                                    <div key={user.userId} className="rounded-lg border bg-card overflow-hidden">
                                        {/* Main row - clickable */}
                                        <div
                                            className="flex items-center gap-4 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                                            onClick={() => setExpandedUser(isExpanded ? null : user.userId)}
                                        >
                                            {/* Rank */}
                                            <div className="text-center w-8 shrink-0">
                                                {index === 0 ? <span className="text-xl">🥇</span>
                                                    : index === 1 ? <span className="text-xl">🥈</span>
                                                    : index === 2 ? <span className="text-xl">🥉</span>
                                                    : <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>}
                                            </div>

                                            {/* Score Circle (animated) */}
                                            <ScoreCircle score={user.score} badge={user.badge} />

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                        {user.nome.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium truncate">{user.nome}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${badgeCfg.color}`}>
                                                        {badgeCfg.label}
                                                    </span>
                                                    {user.metrics.overdueTasks > 0 && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {user.metrics.overdueTasks} atrasada{user.metrics.overdueTasks > 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                                    <MetricRow icon={CheckCircle2} label="Conclusão" value={`${user.metrics.completionRate}%`} />
                                                    <MetricRow icon={Target} label="No prazo" value={`${user.metrics.onTimeRate}%`} />
                                                    <MetricRow icon={Clock} label="Tempo médio" value={user.metrics.avgHours > 0 ? `${user.metrics.avgHours}h` : "—"} />
                                                    <MetricRow icon={TrendingUp} label="Consistência" value={`${user.metrics.consistency}%`} />
                                                </div>
                                            </div>

                                            {/* Task count + expand */}
                                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                                <p className="text-2xl font-bold">{user.metrics.completedTasks}</p>
                                                <p className="text-xs text-muted-foreground">de {user.metrics.totalTasks}</p>
                                                {isExpanded
                                                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                            </div>
                                        </div>

                                        {/*  Expanded details */}
                                        {isExpanded && (
                                            <div className="border-t bg-muted/20 p-4">
                                                <p className="text-sm font-medium mb-2">Últimas tarefas</p>
                                                {user.recentTasks.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground">Nenhuma tarefa no período.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {user.recentTasks.map((task) => {
                                                            const isOverdue = task.status !== "completed" && task.due_date && new Date(task.due_date) < new Date();
                                                            return (
                                                                <div key={task.id} className="flex items-center justify-between text-sm p-2 rounded bg-background border">
                                                                    <span className="truncate max-w-[200px]">{task.title}</span>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                                                                        <Badge variant={task.status === "completed" ? "outline" : task.status === "cancelled" ? "destructive" : "secondary"}>
                                                                            {STATUS_LABELS[task.status] || task.status}
                                                                        </Badge>
                                                                        {task.completed_at && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {format(new Date(task.completed_at), "dd/MM", { locale: ptBR })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
