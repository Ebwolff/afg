import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, UserCircle, Package, Calendar, DollarSign, LogOut, Calculator, FileText, ArrowDownCircle, ArrowUpCircle, Image, CheckSquare } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NavLink } from "./NavLink";
import logo from "@/assets/logo.jpg";
import { NotificationPopover } from "@/features/notifications/components/NotificationPopover";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar-background">
        <div className="flex h-20 items-center justify-center border-b border-sidebar-border px-4 bg-background">
          <img src={logo} alt="AFG Soluções Financeiras" className="h-14 w-auto object-contain" />
        </div>
        <div className="flex flex-col h-[calc(100%-5rem)]">
          <nav className="flex-1 space-y-1 p-4">
            <NavLink to="/dashboard" icon={LayoutDashboard}>
              Dashboard
            </NavLink>
            <NavLink to="/tasks" icon={CheckSquare}>
              Tarefas
            </NavLink>
            <NavLink to="/atendimentos" icon={Users}>
              Atendimentos
            </NavLink>
            <NavLink to="/clientes" icon={UserCircle}>
              Clientes
            </NavLink>
            <NavLink to="/produtos" icon={Package}>
              Produtos
            </NavLink>
            <NavLink to="/contas-pagar" icon={ArrowDownCircle}>
              Contas a Pagar
            </NavLink>
            <NavLink to="/contas-receber" icon={ArrowUpCircle}>
              Contas a Receber
            </NavLink>
            <NavLink to="/financeiro" icon={DollarSign}>
              Financeiro
            </NavLink>
            <NavLink to="/simulador" icon={Calculator}>
              Simulador
            </NavLink>
            <NavLink to="/agenda" icon={Calendar}>
              Agenda
            </NavLink>
            <NavLink to="/relatorios" icon={FileText}>
              Relatórios
            </NavLink>
            <NavLink to="/banners" icon={Image}>
              Banners
            </NavLink>
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
