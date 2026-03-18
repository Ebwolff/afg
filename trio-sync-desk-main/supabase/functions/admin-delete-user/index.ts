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

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId é obrigatório" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: "Você não pode excluir a si mesmo" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========================================================
    // STEP 1: Limpar TODAS as FK references
    // ========================================================
    const fkCleanup = [
      // FKs que referenciam profiles(id)
      { table: "clientes", col: "created_by" },
      { table: "servicos", col: "atendido_por" },
      { table: "atendimentos", col: "solicitado_por" },
      { table: "atendimentos", col: "atendido_por" },
      { table: "atendimentos", col: "vendedor_id" },
      { table: "atendimentos", col: "digitador_id" },
      { table: "transacoes", col: "created_by" },
      { table: "eventos", col: "created_by" },
      { table: "tarefas", col: "assigned_to" },
      { table: "tarefas", col: "created_by" },
      // FKs que referenciam auth.users(id)
      { table: "produtos", col: "created_by" },
      { table: "simulacoes_consorcio", col: "created_by" },
    ];

    const errors = [];

    for (const { table, col } of fkCleanup) {
      const { error } = await adminClient
        .from(table)
        .update({ [col]: null })
        .eq(col, userId);
      if (error) {
        errors.push(`${table}.${col}: ${error.message}`);
      }
    }

    // Deletar notificações do usuário (não SET NULL, DELETE)
    await adminClient.from("notifications").delete().eq("user_id", userId);

    // ========================================================
    // STEP 2: Remover user_roles
    // ========================================================
    await adminClient.from("user_roles").delete().eq("user_id", userId);

    // ========================================================
    // STEP 3: Deletar profile explicitamente
    // ========================================================
    const { error: profileDelError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDelError) {
      errors.push(`profiles: ${profileDelError.message}`);
    }

    // ========================================================
    // STEP 4: Deletar de auth.users
    // ========================================================
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      // Se profile ja foi deletado, tá ok — retornar sucesso parcial
      if (profileDelError) {
        return new Response(
          JSON.stringify({
            error: `Profile: ${profileDelError.message}. Auth: ${deleteError.message}. FK cleanup errors: ${errors.join("; ")}`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Profile deletado mas auth falhou  — still partial success
      return new Response(
        JSON.stringify({
          error: `Auth delete falhou: ${deleteError.message}. Mas o perfil foi removido.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
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
