import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Users, ClipboardList } from "lucide-react";

interface DashboardSummaryCardsProps {
    loading: boolean;
    saldo: { entradas: number; saidas: number; saldo: number };
    clientesCount: number;
    atendimentosCount: number;
}

export function DashboardSummaryCards({
    loading,
    saldo,
    clientesCount,
    atendimentosCount,
}: DashboardSummaryCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-8 w-24" />
                    ) : (
                        <div className="text-2xl font-bold text-primary">
                            R$ {saldo.saldo.toFixed(2)}
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                        {saldo.entradas > 0 && `+R$ ${saldo.entradas.toFixed(2)} entradas`}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                    <TrendingUp className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-8 w-24" />
                    ) : (
                        <div className="text-2xl font-bold text-destructive">
                            R$ {saldo.saidas.toFixed(2)}
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">Total de saídas</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-8 w-16" />
                    ) : (
                        <div className="text-2xl font-bold">{clientesCount}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Total cadastrados</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-8 w-16" />
                    ) : (
                        <div className="text-2xl font-bold text-accent">{atendimentosCount}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Aguardando</p>
                </CardContent>
            </Card>
        </div>
    );
}
