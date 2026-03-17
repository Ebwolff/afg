import { useAuth, AppPermission } from "@/hooks/useAuth";

const ROUTE_MAP: { permission: AppPermission; path: string }[] = [
  { permission: "dashboard", path: "/dashboard" },
  { permission: "leads", path: "/leads" },
  { permission: "tasks", path: "/tasks" },
  { permission: "atendimentos", path: "/atendimentos" },
  { permission: "clientes", path: "/clientes" },
  { permission: "produtos", path: "/produtos" },
  { permission: "contas_pagar", path: "/contas-pagar" },
  { permission: "contas_receber", path: "/contas-receber" },
  { permission: "financeiro", path: "/financeiro" },
  { permission: "simulador", path: "/simulador" },
  { permission: "agenda", path: "/agenda" },
  { permission: "relatorios", path: "/relatorios" },
  { permission: "banners", path: "/banners" },
];

export function useFirstPermittedRoute(): string {
  const { hasPermission, isAdmin, loading } = useAuth();

  if (loading) return "/dashboard";
  if (isAdmin) return "/dashboard";

  const first = ROUTE_MAP.find((r) => hasPermission(r.permission));
  return first?.path || "/dashboard";
}
