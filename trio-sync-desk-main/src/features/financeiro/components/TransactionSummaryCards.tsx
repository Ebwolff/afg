import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Transacao } from "../types";

interface TransactionSummaryCardsProps {
    transacoes: Transacao[] | undefined;
    isLoading: boolean;
    type: "receita" | "despesa";
}

export function TransactionSummaryCards({ transacoes, isLoading, type }: TransactionSummaryCardsProps) {
    const calcularResumo = () => {
        if (!transacoes) return { total: 0, vencidas: 0, pagas: 0, aVencer7Dias: 0 };

        const hoje = new Date();
        const em7Dias = new Date();
        em7Dias.setDate(hoje.getDate() + 7);

        return transacoes.reduce(
            (acc, t) => {
                const vencimento = t.data_vencimento ? new Date(t.data_vencimento) : null;

                if (t.status === "pendente") {
                    acc.total += t.valor;
                    if (vencimento && vencimento < hoje) {
                        acc.vencidas += t.valor;
                    }
                    if (vencimento && vencimento <= em7Dias && vencimento >= hoje) {
                        acc.aVencer7Dias += t.valor;
                    }
                }
                if (t.status === "pago") {
                    const pagamento = t.data_pagamento ? new Date(t.data_pagamento) : null;
                    if (pagamento && pagamento.getMonth() === hoje.getMonth() && pagamento.getFullYear() === hoje.getFullYear()) {
                        acc.pagas += t.valor;
                    }
                }
                return acc;
            },
            { total: 0, vencidas: 0, pagas: 0, aVencer7Dias: 0 }
        );
    };

    const resumo = calcularResumo();

    const titles = {
        total: type === "receita" ? "Total a Receber" : "Total a Pagar",
        pagas: type === "receita" ? "Recebidas no Mês" : "Pagas no Mês",
        previsao: type === "receita" ? "Previsão 7 Dias" : "A Vencer em 7 Dias",
        vencidas: "Vencidas",
    };

    const subtitles = {
        total: type === "receita" ? "Contas pendentes" : "Contas pendentes",
        pagas: type === "receita" ? "Já recebidas" : "Já realizadas",
        previsao: type === "receita" ? "Próximas entradas" : "Atenção ao vencimento",
        vencidas: type === "receita" ? "Inadimplência" : "Contas atrasadas",
    };

    return (
        <div className="grid gap-4 md:grid-cols-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{titles.total}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {isLoading ? <Skeleton className="h-8 w-32" /> : `R$ ${resumo.total.toFixed(2)}`}
                    </div>
                    <p className="text-xs text-muted-foreground">{subtitles.total}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        {titles.vencidas}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                        {isLoading ? <Skeleton className="h-8 w-32" /> : `R$ ${resumo.vencidas.toFixed(2)}`}
                    </div>
                    <p className="text-xs text-muted-foreground">{subtitles.vencidas}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{titles.pagas}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {isLoading ? <Skeleton className="h-8 w-32" /> : `R$ ${resumo.pagas.toFixed(2)}`}
                    </div>
                    <p className="text-xs text-muted-foreground">{subtitles.pagas}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{titles.previsao}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${type === "receita" ? "text-green-600" : "text-orange-600"}`}>
                        {isLoading ? <Skeleton className="h-8 w-32" /> : `R$ ${resumo.aVencer7Dias.toFixed(2)}`}
                    </div>
                    <p className="text-xs text-muted-foreground">{subtitles.previsao}</p>
                </CardContent>
            </Card>
        </div>
    );
}
