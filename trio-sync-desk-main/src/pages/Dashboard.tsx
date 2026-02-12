import { Layout } from "@/components/Layout";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { DashboardSummaryCards } from "@/features/dashboard/components/DashboardSummaryCards";
import { DashboardCharts } from "@/features/dashboard/components/DashboardCharts";
import { DashboardAlerts } from "@/features/dashboard/components/DashboardAlerts";

import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

export default function Dashboard() {
  const {
    loading,
    clientesCount,
    atendimentosCount,
    saldo,
    fluxoData,
    statusData,
    alertas, // Keep alerts for DashboardAlerts
  } = useDashboardData();



  if (loading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de gestão
          </p>
        </div>

        <DashboardAlerts alertas={alertas} />

        <DashboardSummaryCards
          loading={loading}
          saldo={saldo}
          clientesCount={clientesCount}
          atendimentosCount={atendimentosCount}
        />

        <DashboardCharts
          loading={loading}
          fluxoData={fluxoData}
          statusData={statusData}
        />
      </div>
    </Layout>
  );
}
