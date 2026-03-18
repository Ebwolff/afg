import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

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

export interface CustomRole {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
}

interface AuthState {
  user: User | null;
  profile: { id: string; nome: string; email: string } | null;
  role: CustomRole | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  hasPermission: (permission: AppPermission) => boolean;
  isAdmin: boolean;
  roleName: string;
  roleDisplayName: string;
  permissions: AppPermission[];
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
    // Query 1: Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, nome, email")
      .eq("id", user.id)
      .single();

    // Query 2: Role via JOIN user_roles → custom_roles
    // Fallback: se role_id não existe ainda, busca pelo campo string 'role'
    const { data: roleJoin } = await supabase
      .from("user_roles")
      .select("role_id, role, custom_role:role_id(id, name, display_name, description, permissions, is_system)")
      .eq("user_id", user.id)
      .single();

    let resolvedRole: CustomRole | null = null;

    if (roleJoin?.custom_role && !Array.isArray(roleJoin.custom_role)) {
      // Novo sistema: role_id populado
      resolvedRole = roleJoin.custom_role as unknown as CustomRole;
    } else if (roleJoin?.role) {
      // Fallback: buscar pelo nome da role (sistema antigo)
      const { data: fallbackRole } = await supabase
        .from("custom_roles")
        .select("id, name, display_name, description, permissions, is_system")
        .eq("name", roleJoin.role)
        .single();
      resolvedRole = (fallbackRole as CustomRole) || null;
    }

    setState({
      user,
      profile: profile ? { id: profile.id, nome: profile.nome, email: profile.email } : null,
      role: resolvedRole,
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

  const isAdmin = state.role?.name === "admin";

  const permissions = (state.role?.permissions || []) as AppPermission[];

  const hasPermission = useCallback(
    (permission: AppPermission) => {
      if (isAdmin) return true;
      return permissions.includes(permission);
    },
    [isAdmin, permissions]
  );

  const value: AuthContextType = {
    ...state,
    hasPermission,
    isAdmin,
    roleName: state.role?.name || "servicos",
    roleDisplayName: state.role?.display_name || "Serviços",
    permissions,
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

// Backward compatibility: keep AppRole type for Edge Functions
export type AppRole = string;
