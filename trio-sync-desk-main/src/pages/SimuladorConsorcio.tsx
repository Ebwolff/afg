import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, FileDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function SimuladorConsorcio() {
  const [clienteNome, setClienteNome] = useState("");
  const [tipoBem, setTipoBem] = useState("");
  const [valorCarta, setValorCarta] = useState("");
  const [prazoMeses, setPrazoMeses] = useState("");
  const [taxaAdmin, setTaxaAdmin] = useState("10");
  const [observacoes, setObservacoes] = useState("");
  const [valorParcela, setValorParcela] = useState(0);

  const calcularParcela = () => {
    const valor = parseFloat(valorCarta);
    const prazo = parseInt(prazoMeses);
    const taxa = parseFloat(taxaAdmin) / 100;

    if (valor && prazo && taxa >= 0) {
      const valorComTaxa = valor * (1 + taxa);
      const parcela = valorComTaxa / prazo;
      setValorParcela(parcela);
    }
  };

  const salvarSimulacao = async () => {
    if (!clienteNome || !tipoBem || !valorCarta || !prazoMeses) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    const { error } = await supabase.from("simulacoes_consorcio").insert({
      cliente_nome: clienteNome,
      tipo_bem: tipoBem,
      valor_carta: parseFloat(valorCarta),
      prazo_meses: parseInt(prazoMeses),
      valor_parcela: valorParcela,
      taxa_administracao: parseFloat(taxaAdmin),
      observacoes: observacoes || null,
      created_by: user.id,
    });

    if (error) {
      toast.error("Erro ao salvar simulação");
      console.error(error);
      return;
    }

    toast.success("Simulação salva com sucesso!");
    limparFormulario();
  };

  const gerarPDF = () => {
    toast.info("Funcionalidade de geração de PDF em desenvolvimento");
  };

  const limparFormulario = () => {
    setClienteNome("");
    setTipoBem("");
    setValorCarta("");
    setPrazoMeses("");
    setTaxaAdmin("10");
    setObservacoes("");
    setValorParcela(0);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Simulador de Consórcio</h1>
          <p className="text-muted-foreground">Simule e salve propostas de consórcio para seus clientes</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Dados da Simulação
              </CardTitle>
              <CardDescription>Preencha os dados para calcular as parcelas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Nome do Cliente *</Label>
                <Input
                  id="cliente"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoBem">Tipo de Bem *</Label>
                <Select value={tipoBem} onValueChange={setTipoBem}>
                  <SelectTrigger id="tipoBem">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imovel">Imóvel</SelectItem>
                    <SelectItem value="veiculo">Veículo</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor da Carta *</Label>
                <Input
                  id="valor"
                  type="number"
                  value={valorCarta}
                  onChange={(e) => setValorCarta(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo (meses) *</Label>
                <Input
                  id="prazo"
                  type="number"
                  value={prazoMeses}
                  onChange={(e) => setPrazoMeses(e.target.value)}
                  placeholder="60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxa">Taxa de Administração (%)</Label>
                <Input
                  id="taxa"
                  type="number"
                  value={taxaAdmin}
                  onChange={(e) => setTaxaAdmin(e.target.value)}
                  placeholder="10"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="obs">Observações</Label>
                <Textarea
                  id="obs"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>

              <Button onClick={calcularParcela} className="w-full">
                Calcular Parcelas
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultado da Simulação</CardTitle>
              <CardDescription>Valores calculados automaticamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {valorParcela > 0 ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                      <span className="text-sm text-muted-foreground">Valor da Parcela</span>
                      <span className="text-2xl font-bold text-primary">
                        R$ {valorParcela.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between p-3 border-b">
                      <span className="text-sm text-muted-foreground">Valor da Carta</span>
                      <span className="font-medium">R$ {parseFloat(valorCarta).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 border-b">
                      <span className="text-sm text-muted-foreground">Taxa de Administração</span>
                      <span className="font-medium">{taxaAdmin}%</span>
                    </div>
                    <div className="flex justify-between p-3 border-b">
                      <span className="text-sm text-muted-foreground">Prazo</span>
                      <span className="font-medium">{prazoMeses} meses</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-sm text-muted-foreground">Valor Total</span>
                      <span className="font-medium">
                        R$ {(valorParcela * parseInt(prazoMeses)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button onClick={salvarSimulacao} className="w-full">
                      Salvar Simulação
                    </Button>
                    <Button onClick={gerarPDF} variant="outline" className="w-full">
                      <FileDown className="h-4 w-4 mr-2" />
                      Gerar PDF
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Preencha os dados e clique em "Calcular Parcelas"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
