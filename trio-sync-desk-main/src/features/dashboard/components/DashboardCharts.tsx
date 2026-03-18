import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
    BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

interface DashboardChartsProps {
    loading: boolean;
    fluxoData: { mes: string; entradas: number; saidas: number; saldo?: number }[];
    statusData: { status: string; value: number }[];
}

const COLORS = {
    pendente: "hsl(var(--warning))",
    pago: "hsl(var(--success))",
    vencido: "hsl(var(--destructive))",
    cancelado: "hsl(var(--muted))",
};

const chartConfig = {
    entradas: { label: "Entradas", color: "hsl(var(--success))" },
    saidas: { label: "Saídas", color: "hsl(var(--destructive))" },
    saldo: { label: "Saldo", color: "hsl(var(--primary))" },
};

export function DashboardCharts({ loading, fluxoData, statusData }: DashboardChartsProps) {
    let acumulado = 0;
    const saldoData = fluxoData.map((item) => {
        acumulado += (item.entradas || 0) - (item.saidas || 0);
        return { mes: item.mes, saldo: acumulado };
    });

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                {/* Receitas vs Despesas (BarChart) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Receitas x Despesas (6 meses)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : (
                            <ChartContainer config={chartConfig} className="h-[300px]">
                                <BarChart data={fluxoData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="mes" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    <Bar
                                        dataKey="entradas"
                                        fill="hsl(var(--success))"
                                        name="Entradas"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="saidas"
                                        fill="hsl(var(--destructive))"
                                        name="Saídas"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Contas por Status (PieChart) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contas por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : statusData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="h-[300px]">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS] || COLORS.pendente} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </PieChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                Nenhuma conta cadastrada
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Saldo Acumulado (AreaChart) */}
            <Card>
                <CardHeader>
                    <CardTitle>Saldo Acumulado (6 meses)</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-[250px] w-full" />
                    ) : (
                        <ChartContainer config={chartConfig} className="h-[250px]">
                            <AreaChart data={saldoData}>
                                <defs>
                                    <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="mes" className="text-xs" />
                                <YAxis className="text-xs" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area
                                    type="monotone"
                                    dataKey="saldo"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    fill="url(#saldoGradient)"
                                    name="Saldo Acumulado"
                                />
                            </AreaChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
