import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, AppPermission } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: AppPermission;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredPermission, requiredRole }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, hasPermission, loading, role, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Carregando...
      </div>
    );
  }

  if (!user) return null;

  // Role gate (e.g. admin-only routes)
  if (requiredRole && role?.name !== requiredRole) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-700">Acesso Restrito</h1>
            <p className="text-muted-foreground">
              Apenas administradores podem acessar este módulo.
            </p>
            <p className="text-sm text-muted-foreground">
              Use o menu lateral para navegar aos módulos disponíveis.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Permission gate (e.g. dashboard, financeiro, etc.)
  if (requiredPermission && role && !hasPermission(requiredPermission)) {
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
