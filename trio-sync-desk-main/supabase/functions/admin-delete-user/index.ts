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

    // Verificar caller
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar admin
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

    // Usar SQL direto para limpar TODAS as referências de uma vez
    // Isso garante que nenhuma FK seja esquecida
    const { error: cleanupError } = await adminClient.rpc("admin_cleanup_user_refs", {
      target_user_id: userId,
    });

    // Se a função RPC não existir, limpar manualmente
    if (cleanupError) {
      // Limpar FKs que referenciam profiles(id)
      const profileTables = [
        { table: "clientes", col: "created_by" },
        { table: "servicos", col: "atendido_por" },
        { table: "atendimentos", col: "solicitado_por" },
        { table: "atendimentos", col: "atendido_por" },
        { table: "atendimentos", col: "vendedor_id" },
        { table: "atendimentos", col: "digitador_id" },
        { table: "transacoes", col: "created_by" },
        { table: "eventos", col: "created_by" },
      ];

      for (const { table, col } of profileTables) {
        await adminClient.from(table).update({ [col]: null }).eq(col, userId);
      }

      // Limpar FKs que referenciam auth.users(id)
      const authTables = [
        { table: "produtos", col: "created_by" },
        { table: "simulacoes_consorcio", col: "created_by" },
      ];

      for (const { table, col } of authTables) {
        await adminClient.from(table).update({ [col]: null }).eq(col, userId);
      }
    }

    // Remover user_roles
    await adminClient.from("user_roles").delete().eq("user_id", userId);

    // Remover profile diretamente (antes de auth, para evitar FK cascade issues)
    await adminClient.from("profiles").delete().eq("id", userId);

    // Deletar de auth.users
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      // Se ainda falhar, tentar com softDelete
      const { error: softDeleteError } = await adminClient.auth.admin.deleteUser(userId, true);
      if (softDeleteError) {
        return new Response(
          JSON.stringify({ error: `Falha ao deletar: ${deleteError.message}. Soft delete: ${softDeleteError.message}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
