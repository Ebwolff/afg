import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";

interface RelatorioItem {
  id: string;
  created_at: string;
  cliente_nome: string;
  tipo_solicitacao: string;
  status: string;
  vendedor?: { nome: string };
  digitador?: { nome: string };
}

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState("digitador");
  const [pessoaSelecionada, setPessoaSelecionada] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const { data: usuarios } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .order("nome");

      if (error) throw error;
      return data;
    },
  });

  const { data: atendimentos, isLoading } = useQuery({
    queryKey: ["relatorio", tipoRelatorio, pessoaSelecionada, dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase
        .from("atendimentos")
        .select(`
          *,
          vendedor:vendedor_id(nome),
          digitador:digitador_id(nome),
          solicitante:solicitado_por(nome)
        `);

      if (tipoRelatorio === "digitador" && pessoaSelecionada) {
        query = query.eq("digitador_id", pessoaSelecionada);
      } else if (tipoRelatorio === "vendedor" && pessoaSelecionada) {
        query = query.eq("vendedor_id", pessoaSelecionada);
      }

      if (dataInicio) {
        query = query.gte("created_at", dataInicio);
      }
      if (dataFim) {
        query = query.lte("created_at", dataFim);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!pessoaSelecionada,
  });

  const exportarRelatorio = () => {
    if (!atendimentos || atendimentos.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    const csv = [
      ["Data", "Cliente", "Tipo", "Status", "Vendedor", "Digitador"],
      ...atendimentos.map((a: RelatorioItem) => [
        format(new Date(a.created_at), "dd/MM/yyyy"),
        a.cliente_nome,
        a.tipo_solicitacao,
        a.status,
        a.vendedor?.nome || "-",
        a.digitador?.nome || "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${tipoRelatorio}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Visualize e exporte relatórios gerenciais</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Filtros do Relatório
            </CardTitle>
            <CardDescription>Selecione os critérios para gerar o relatório</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Relatório</Label>
                <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digitador">Por Digitador</SelectItem>
                    <SelectItem value="vendedor">Por Vendedor</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pessoa">
                  {tipoRelatorio === "digitador" ? "Digitador" : "Vendedor"}
                </Label>
                <Select value={pessoaSelecionada} onValueChange={setPessoaSelecionada}>
                  <SelectTrigger id="pessoa">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios?.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={exportarRelatorio} disabled={!atendimentos || atendimentos.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </CardContent>
        </Card>

        {pessoaSelecionada && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
              <CardDescription>
                {atendimentos?.length || 0} atendimento(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : atendimentos && atendimentos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Digitador</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atendimentos.map((atendimento: RelatorioItem) => (
                      <TableRow key={atendimento.id}>
                        <TableCell>
                          {format(new Date(atendimento.created_at), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>{atendimento.cliente_nome}</TableCell>
                        <TableCell>{atendimento.tipo_solicitacao}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${atendimento.status === "concluido"
                              ? "bg-green-100 text-green-800"
                              : atendimento.status === "em_atendimento"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                              }`}
                          >
                            {atendimento.status}
                          </span>
                        </TableCell>
                        <TableCell>{atendimento.vendedor?.nome || "-"}</TableCell>
                        <TableCell>{atendimento.digitador?.nome || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum atendimento encontrado com os filtros selecionados
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
