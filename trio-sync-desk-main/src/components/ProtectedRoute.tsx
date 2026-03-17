import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppPermission } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: AppPermission;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { hasPermission, loading, role } = useAuth();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth", { replace: true });
      } else {
        setIsAuthenticated(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isAuthenticated === null || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Carregando...
      </div>
    );
  }

  if (!loading && isAuthenticated && requiredPermission && role && !hasPermission(requiredPermission)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-700">Acesso Restrito</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar este módulo.
            </p>
            <p className="text-sm text-muted-foreground">
              Use o menu lateral para navegar aos módulos disponíveis.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
}
