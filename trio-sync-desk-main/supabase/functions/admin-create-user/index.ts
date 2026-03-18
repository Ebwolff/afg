import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar admin via custom_roles JOIN
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role, role_id, custom_role:role_id(name)")
      .eq("user_id", caller.id)
      .single();

    const callerRoleName = callerRole?.custom_role?.name || callerRole?.role;
    if (callerRoleName !== "admin") {
      return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, password, nome, role, roleId } = body;

    if (!email || !password || !nome) {
      return new Response(JSON.stringify({ error: "Email, senha e nome são obrigatórios" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolver role_id: se veio roleId direto, usar; senão buscar por nome
    let resolvedRoleId = roleId || null;
    let resolvedRoleName = role || "servicos";

    if (resolvedRoleId) {
      // roleId é na verdade o UUID da custom_roles
      const { data: cr } = await adminClient
        .from("custom_roles")
        .select("id, name")
        .eq("id", resolvedRoleId)
        .single();
      if (cr) {
        resolvedRoleName = cr.name;
        resolvedRoleId = cr.id;
      }
    } else if (resolvedRoleName) {
      // Buscar por nome
      const { data: cr } = await adminClient
        .from("custom_roles")
        .select("id, name")
        .eq("name", resolvedRoleName)
        .single();
      if (cr) {
        resolvedRoleId = cr.id;
      }
    }

    // Criar usuário via admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (newUser?.user) {
      // Atualizar nome no profile
      await adminClient
        .from("profiles")
        .update({ nome })
        .eq("id", newUser.user.id);

      // Inserir role com role_id
      await adminClient.from("user_roles").insert({
        user_id: newUser.user.id,
        role: resolvedRoleName,
        role_id: resolvedRoleId,
      });
    }

    return new Response(JSON.stringify({ success: true, user: newUser?.user }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
