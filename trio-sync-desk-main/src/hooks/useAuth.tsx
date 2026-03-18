import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "servicos";

export type AppPermission =
  | "dashboard"
  | "leads"
  | "tasks"
  | "produtividade"
  | "atendimentos"
  | "clientes"
  | "produtos"
  | "contas_pagar"
  | "contas_receber"
  | "financeiro"
  | "simulador"
  | "agenda"
  | "relatorios"
  | "banners";

export const ALL_PERMISSIONS: { id: AppPermission; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "leads", label: "Leads" },
  { id: "tasks", label: "Tarefas" },
  { id: "produtividade", label: "Produtividade" },
  { id: "atendimentos", label: "Atendimentos" },
  { id: "clientes", label: "Clientes" },
  { id: "produtos", label: "Produtos" },
  { id: "contas_pagar", label: "Contas a Pagar" },
  { id: "contas_receber", label: "Contas a Receber" },
  { id: "financeiro", label: "Financeiro" },
  { id: "simulador", label: "Simulador" },
  { id: "agenda", label: "Agenda" },
  { id: "relatorios", label: "Relatórios" },
  { id: "banners", label: "Banners" },
];

interface AuthState {
  user: User | null;
  profile: { id: string; nome: string; email: string; permissions: AppPermission[] } | null;
  role: AppRole | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  hasPermission: (permission: AppPermission) => boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    loading: true,
  });

  const fetchUserData = useCallback(async (user: User) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, nome, email, permissions")
      .eq("id", user.id)
      .single();

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = (roleData?.role as AppRole) || "servicos";
    const permissions = (profile?.permissions as AppPermission[]) || [];

    setState({
      user,
      profile: profile ? { ...profile, permissions } : null,
      role,
      loading: false,
    });
  }, []);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchUserData(user);
    }
  }, [fetchUserData]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setState({ user: null, profile: null, role: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const hasPermission = useCallback(
    (permission: AppPermission) => {
      if (state.role === "admin") return true;
      return state.profile?.permissions?.includes(permission) ?? false;
    },
    [state.role, state.profile?.permissions]
  );

  const value: AuthContextType = {
    ...state,
    hasPermission,
    isAdmin: state.role === "admin",
    refresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
