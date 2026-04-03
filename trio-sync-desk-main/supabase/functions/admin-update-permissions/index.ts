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

    // Verificar identidade do chamador
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se o chamador é admin
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
    const { roleId, permissions, userId } = body;

    if (!roleId || !Array.isArray(permissions)) {
      return new Response(JSON.stringify({ error: "roleId e permissions são obrigatórios" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Atualizar permissões da role (via service_role, bypassa RLS)
    const { data: updatedRole, error: updateError } = await adminClient
      .from("custom_roles")
      .update({ permissions })
      .eq("id", roleId)
      .select("id, name, permissions")
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: `Erro ao atualizar role: ${updateError.message}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!updatedRole) {
      return new Response(JSON.stringify({ error: "Role não encontrada" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Se userId fornecido, garantir que user_roles tenha o role_id correto (UPSERT)
    if (userId) {
      // Tentar update primeiro
      const { data: existingRole } = await adminClient
        .from("user_roles")
        .select("user_id")
        .eq("user_id", userId)
        .single();

      if (existingRole) {
        // Row existe, fazer update
        const { error: userRoleError } = await adminClient
          .from("user_roles")
          .update({ role_id: roleId, role: updatedRole.name })
          .eq("user_id", userId);

        if (userRoleError) {
          return new Response(JSON.stringify({ error: `Erro ao atualizar user_role: ${userRoleError.message}` }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        // Row não existe, inserir
        const { error: insertError } = await adminClient
          .from("user_roles")
          .insert({ user_id: userId, role_id: roleId, role: updatedRole.name });

        if (insertError) {
          return new Response(JSON.stringify({ error: `Erro ao inserir user_role: ${insertError.message}` }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // 3. Verificar se a permissão realmente persistiu (re-read)
    const { data: verifyRole } = await adminClient
      .from("custom_roles")
      .select("id, name, permissions")
      .eq("id", roleId)
      .single();

    const finalPermissions = (verifyRole?.permissions as string[]) || [];

    return new Response(JSON.stringify({
      success: true,
      role: updatedRole,
      savedPermissions: finalPermissions,
      verified: finalPermissions.length === permissions.length,
    }), {
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
