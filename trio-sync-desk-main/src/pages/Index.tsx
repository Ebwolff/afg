import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFirstPermittedRoute } from "@/hooks/useFirstPermittedRoute";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const firstRoute = useFirstPermittedRoute();

  useEffect(() => {
    if (authLoading) return; // Esperar o role carregar

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(firstRoute);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate, firstRoute, authLoading]);

  return null;
};

export default Index;
