import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFirstPermittedRoute } from "@/hooks/useFirstPermittedRoute";

const Index = () => {
  const navigate = useNavigate();
  const firstRoute = useFirstPermittedRoute();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(firstRoute);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate, firstRoute]);

  return null;
};

export default Index;
