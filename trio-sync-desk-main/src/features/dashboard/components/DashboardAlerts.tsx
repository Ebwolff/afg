import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar } from "lucide-react";
import { useHideValues } from "@/hooks/useHideValues";

interface DashboardAlertsProps {
    alertas: {
        vencidas: number;
        vencendo: number;
        valorVencido: number;
    };
}

export function DashboardAlerts({ alertas }: DashboardAlertsProps) {
    const { mask } = useHideValues();
    if (alertas.vencidas === 0 && alertas.vencendo === 0) {
        return null;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {alertas.vencidas > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>{alertas.vencidas}</strong> conta(s) vencida(s) no valor de{" "}
                        <strong>{mask(alertas.valorVencido)}</strong>
                    </AlertDescription>
                </Alert>
            )}
            {alertas.vencendo > 0 && (
                <Alert className="border-warning bg-warning/10">
                    <Calendar className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-warning-foreground">
                        <strong>{alertas.vencendo}</strong> conta(s) vencendo nos próximos 7 dias
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
