import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollText, Search, Eye, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  user_email: string;
  user_nome: string;
  action: string;
  module: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

const MODULE_LABELS: Record<string, string> = {
  clientes: "Clientes",
  transacoes: "Financeiro",
  atendimentos: "Atendimentos",
  tasks: "Tarefas",
  eventos: "Agenda",
  produtos: "Produtos",
  servicos: "Serviços",
};

const ACTION_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  INSERT: { label: "Criação", variant: "default" },
  UPDATE: { label: "Alteração", variant: "secondary" },
  DELETE: { label: "Exclusão", variant: "destructive" },
};

const PAGE_SIZE = 15;

export default function AuditLogs() {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(0);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, moduleFilter, actionFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (moduleFilter !== "all") query = query.eq("module", moduleFilter);
      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (searchTerm) query = query.or(`user_email.ilike.%${searchTerm}%,user_nome.ilike.%${searchTerm}%`);

      const { data: logs, error, count } = await query;
      if (error) throw error;
      return { logs: (logs || []) as AuditLog[], total: count || 0 };
    },
    enabled: isAdmin,
  });

  const logs = data?.logs || [];
  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const exportCSV = () => {
    if (!logs.length) return;
    const header = "Data,Usuário,Email,Ação,Módulo,Registro";
    const rows = logs.map((l) =>
      `"${format(new Date(l.created_at), "dd/MM/yyyy HH:mm")}","${l.user_nome}","${l.user_email}","${ACTION_CONFIG[l.action]?.label || l.action}","${MODULE_LABELS[l.module] || l.module}","${l.record_id || ""}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderChanges = (log: AuditLog) => {
    if (log.action === "INSERT" && log.new_data) {
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium text-emerald-600">Dados criados:</p>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-60">
            {JSON.stringify(log.new_data, null, 2)}
          </pre>
        </div>
      );
    }

    if (log.action === "DELETE" && log.old_data) {
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium text-red-600">Dados removidos:</p>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-60">
            {JSON.stringify(log.old_data, null, 2)}
          </pre>
        </div>
      );
    }

    if (log.action === "UPDATE" && log.old_data && log.new_data) {
      const changes: { field: string; from: unknown; to: unknown }[] = [];
      for (const key of Object.keys(log.new_data)) {
        if (JSON.stringify(log.old_data[key]) !== JSON.stringify(log.new_data[key])) {
          changes.push({ field: key, from: log.old_data[key], to: log.new_data[key] });
        }
      }

      if (changes.length === 0) {
        return <p className="text-sm text-muted-foreground">Nenhuma alteração detectada.</p>;
      }

      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">Campos alterados:</p>
          <div className="space-y-1.5">
            {changes.map((c) => (
              <div key={c.field} className="text-xs bg-muted p-2 rounded">
                <span className="font-medium">{c.field}</span>
                <div className="flex gap-2 mt-1">
                  <span className="text-red-500 line-through">{String(c.from ?? "vazio")}</span>
                  <span>→</span>
                  <span className="text-emerald-600">{String(c.to ?? "vazio")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Logs de Auditoria</h1>
            <p className="text-muted-foreground">
              Rastreamento completo de ações no sistema
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!logs.length}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                  className="pl-9"
                />
              </div>
              <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Módulos</SelectItem>
                  {Object.entries(MODULE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Ações</SelectItem>
                  <SelectItem value="INSERT">Criação</SelectItem>
                  <SelectItem value="UPDATE">Alteração</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Registros
            </CardTitle>
            <CardDescription>
              {data?.total || 0} registro(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : logs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhum registro encontrado.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead className="text-right">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const actionCfg = ACTION_CONFIG[log.action] || { label: log.action, variant: "outline" as const };
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{log.user_nome}</p>
                              <p className="text-xs text-muted-foreground">{log.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={actionCfg.variant}>{actionCfg.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{MODULE_LABELS[log.module] || log.module}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetailLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {page + 1} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialog: Detalhes do Log */}
        <Dialog open={!!detailLog} onOpenChange={() => setDetailLog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Registro</DialogTitle>
              <DialogDescription>Informações completas da ação registrada no log de auditoria.</DialogDescription>
            </DialogHeader>
            {detailLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Usuário</p>
                    <p className="font-medium">{detailLog.user_nome}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{detailLog.user_email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data/Hora</p>
                    <p className="font-medium">
                      {format(new Date(detailLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Módulo</p>
                    <p className="font-medium">{MODULE_LABELS[detailLog.module] || detailLog.module}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ação</p>
                    <Badge variant={ACTION_CONFIG[detailLog.action]?.variant || "outline"}>
                      {ACTION_CONFIG[detailLog.action]?.label || detailLog.action}
                    </Badge>
                  </div>
                  {detailLog.record_id && (
                    <div>
                      <p className="text-muted-foreground">ID do Registro</p>
                      <p className="font-mono text-xs">{detailLog.record_id}</p>
                    </div>
                  )}
                </div>
                <hr />
                {renderChanges(detailLog)}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
