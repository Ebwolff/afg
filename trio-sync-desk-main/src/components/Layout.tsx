import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, UserCircle, Package, Calendar, DollarSign, LogOut, Calculator, FileText, ArrowDownCircle, ArrowUpCircle, Image, CheckSquare, Target, Shield, TrendingUp, LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NavLink } from "./NavLink";
import logo from "@/assets/logo.jpg";
import { NotificationPopover } from "@/features/notifications/components/NotificationPopover";
import { useAuth, AppPermission } from "@/hooks/useAuth";
import { useDueDateNotifier } from "@/hooks/useDueDateNotifier";

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  permission: AppPermission;
}

const navItems: NavItem[] = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", permission: "dashboard" },
  { to: "/leads", icon: Target, label: "Leads", permission: "leads" },
  { to: "/tasks", icon: CheckSquare, label: "Tarefas", permission: "tasks" },
  { to: "/produtividade", icon: TrendingUp, label: "Produtividade", permission: "produtividade" },
  { to: "/atendimentos", icon: Users, label: "Atendimentos", permission: "atendimentos" },
  { to: "/clientes", icon: UserCircle, label: "Clientes", permission: "clientes" },
  { to: "/produtos", icon: Package, label: "Produtos", permission: "produtos" },
  { to: "/contas-pagar", icon: ArrowDownCircle, label: "Contas a Pagar", permission: "contas_pagar" },
  { to: "/contas-receber", icon: ArrowUpCircle, label: "Contas a Receber", permission: "contas_receber" },
  { to: "/financeiro", icon: DollarSign, label: "Financeiro", permission: "financeiro" },
  { to: "/simulador", icon: Calculator, label: "Simulador", permission: "simulador" },
  { to: "/agenda", icon: Calendar, label: "Agenda", permission: "agenda" },
  { to: "/relatorios", icon: FileText, label: "Relatórios", permission: "relatorios" },
  { to: "/banners", icon: Image, label: "Banners", permission: "banners" },
];

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission, isAdmin } = useAuth();
  useDueDateNotifier();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  const visibleItems = navItems.filter((item) => hasPermission(item.permission));

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar-background">
        <div className="flex h-20 items-center justify-center border-b border-sidebar-border px-4 bg-background">
          <img src={logo} alt="AFG Soluções Financeiras" className="h-14 w-auto object-contain" />
        </div>
        <div className="flex flex-col h-[calc(100%-5rem)]">
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {visibleItems.map((item) => (
              <NavLink key={item.to} to={item.to} icon={item.icon}>
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <>
                <div className="my-3 border-t border-sidebar-border" />
                <NavLink to="/admin" icon={Shield}>
                  Administração
                </NavLink>
              </>
            )}
          </nav>
          <div className="border-t border-sidebar-border p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
      <main className="ml-64">
        <div className="flex justify-end items-center px-8 py-4 border-b bg-white">
          <NotificationPopover />
        </div>
        <div className="container mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}

