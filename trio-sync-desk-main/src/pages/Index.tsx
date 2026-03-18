import { useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading, isAdmin } = useAuth();

  // Ainda carregando auth — mostrar nada
  if (loading) return null;

  // Não logado — ir para auth
  if (!user) return <Navigate to="/auth" replace />;

  // Admin → Produtividade
  if (isAdmin) return <Navigate to="/produtividade" replace />;

  // Serviços/outros → Agenda
  return <Navigate to="/agenda" replace />;
};

export default Index;
