import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal } from "lucide-react";

interface TeamRankingProps {
    loading: boolean;
    ranking: { id: string; nome: string; completed: number }[];
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function TeamRanking({ loading, ranking }: TeamRankingProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Produtividade — Mês Atual
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : ranking.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma tarefa concluída neste mês.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {ranking.map((member, idx) => (
                            <div
                                key={member.id}
                                className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                                    idx === 0
                                        ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30"
                                        : "bg-muted/50"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg w-8 text-center">
                                        {idx < 3 ? MEDALS[idx] : `${idx + 1}º`}
                                    </span>
                                    <span className="font-medium text-sm">{member.nome}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg font-bold">{member.completed}</span>
                                    <span className="text-xs text-muted-foreground">tarefas</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
