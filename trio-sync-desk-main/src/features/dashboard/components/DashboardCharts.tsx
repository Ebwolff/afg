import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

interface DashboardChartsProps {
    loading: boolean;
    fluxoData: { mes: string; entradas: number; saídas: number }[];
    statusData: { status: string; value: number }[];
}

const COLORS = {
    pendente: "hsl(var(--warning))",
    pago: "hsl(var(--success))",
    vencido: "hsl(var(--destructive))",
    cancelado: "hsl(var(--muted))",
};

const chartConfig = {
    entradas: {
        label: "Entradas",
        color: "hsl(var(--success))",
    },
    saidas: {
        label: "Saídas",
        color: "hsl(var(--destructive))",
    },
};

export function DashboardCharts({ loading, fluxoData, statusData }: DashboardChartsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Fluxo de Caixa */}
            <Card>
                <CardHeader>
                    <CardTitle>Fluxo de Caixa (6 meses)</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : (
                        <ChartContainer config={chartConfig} className="h-[300px]">
                            <LineChart data={fluxoData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="mes" className="text-xs" />
                                <YAxis className="text-xs" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="entradas"
                                    stroke="hsl(var(--success))"
                                    strokeWidth={2}
                                    name="Entradas"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="saidas"
                                    stroke="hsl(var(--destructive))"
                                    strokeWidth={2}
                                    name="Saídas"
                                />
                            </LineChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            {/* Contas por Status */}
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
    );
}
