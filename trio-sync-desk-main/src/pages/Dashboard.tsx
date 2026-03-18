import { Layout } from "@/components/Layout";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { DashboardSummaryCards } from "@/features/dashboard/components/DashboardSummaryCards";
import { DashboardCharts } from "@/features/dashboard/components/DashboardCharts";
import { DashboardAlerts } from "@/features/dashboard/components/DashboardAlerts";
import { TeamRanking } from "@/features/dashboard/components/TeamRanking";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

export default function Dashboard() {
  const {
    loading,
    clientesCount,
    atendimentosCount,
    saldo,
    fluxoData,
    statusData,
    alertas,
    tasksKPIs,
    teamRanking,
    ticketMedio,
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
          clientesCount={clientesCount ?? 0}
          atendimentosCount={atendimentosCount ?? 0}
          tasksKPIs={tasksKPIs}
          ticketMedio={ticketMedio}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashboardCharts
              loading={loading}
              fluxoData={fluxoData}
              statusData={statusData}
            />
          </div>
          <div>
            <TeamRanking loading={loading} ranking={teamRanking} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
