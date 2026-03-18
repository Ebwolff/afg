import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductivityScore, UserScore } from "@/hooks/useProductivityScore";
import { Trophy, TrendingUp, Clock, Target, CheckCircle2 } from "lucide-react";

const BADGE_CONFIG = {
    high: { label: "Alta Performance", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    medium: { label: "Média", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
    low: { label: "Baixa", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

function ScoreCircle({ score, badge }: { score: number; badge: UserScore["badge"] }) {
    const circumference = 2 * Math.PI * 36;
    const offset = circumference - (score / 100) * circumference;
    const strokeColor = badge === "high" ? "#10b981" : badge === "medium" ? "#f59e0b" : "#ef4444";

    return (
        <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle
                    cx="40" cy="40" r="36" fill="none"
                    stroke={strokeColor} strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{score}</span>
        </div>
    );
}

function MetricBar({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{label}</span>
            <span className="ml-auto font-medium">{value}</span>
        </div>
    );
}

export function ProductivityPanel() {
    const [period, setPeriod] = useState("30");
    const { scores, isLoading } = useProductivityScore(Number(period));

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Produtividade da Equipe
                    </CardTitle>
                    <CardDescription>Score de performance baseado nas tarefas</CardDescription>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                        <SelectItem value="90">Últimos 90 dias</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Calculando scores...</div>
                ) : scores.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        Nenhuma tarefa atribuída no período selecionado.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {scores.map((user, index) => {
                            const badgeCfg = BADGE_CONFIG[user.badge];
                            return (
                                <div key={user.userId} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                                    {/* Ranking */}
                                    <div className="text-center w-8 shrink-0">
                                        {index === 0 ? (
                                            <span className="text-xl">🥇</span>
                                        ) : index === 1 ? (
                                            <span className="text-xl">🥈</span>
                                        ) : index === 2 ? (
                                            <span className="text-xl">🥉</span>
                                        ) : (
                                            <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                                        )}
                                    </div>

                                    {/* Score Circle */}
                                    <ScoreCircle score={user.score} badge={user.badge} />

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {user.nome.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium truncate">{user.nome}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${badgeCfg.color}`}>
                                                {badgeCfg.label}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                            <MetricBar icon={CheckCircle2} label="Conclusão" value={`${user.metrics.completionRate}%`} />
                                            <MetricBar icon={Target} label="No prazo" value={`${user.metrics.onTimeRate}%`} />
                                            <MetricBar icon={Clock} label="Tempo médio" value={user.metrics.avgHours > 0 ? `${user.metrics.avgHours}h` : "—"} />
                                            <MetricBar icon={TrendingUp} label="Consistência" value={`${user.metrics.consistency}%`} />
                                        </div>
                                    </div>

                                    {/* Task Count */}
                                    <div className="text-right shrink-0">
                                        <p className="text-2xl font-bold">{user.metrics.completedTasks}</p>
                                        <p className="text-xs text-muted-foreground">de {user.metrics.totalTasks}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
