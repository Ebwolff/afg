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
import { jsPDF } from "jspdf";
import logoImg from "@/assets/logo.jpg";

export default function SimuladorConsorcio() {
  const [clienteNome, setClienteNome] = useState("");
  const [tipoBem, setTipoBem] = useState("");
  const [valorCarta, setValorCarta] = useState("");
  const [prazoMeses, setPrazoMeses] = useState("");
  const [taxaAdmin, setTaxaAdmin] = useState("10");
  const [observacoes, setObservacoes] = useState("");
  const [valorParcela, setValorParcela] = useState(0);
  const [valorMeiaParcela, setValorMeiaParcela] = useState(0);

  const calcularParcela = () => {
    const valor = parseFloat(valorCarta);
    const prazo = parseInt(prazoMeses);
    const taxa = parseFloat(taxaAdmin) / 100;

    if (valor && prazo && taxa >= 0) {
      const valorComTaxa = valor * (1 + taxa);
      const parcela = valorComTaxa / prazo;
      setValorParcela(parcela);
      setValorMeiaParcela(parcela / 2);
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

  const gerarPDF = async () => {
    if (!clienteNome || !tipoBem || !valorCarta || !prazoMeses || valorParcela <= 0) {
      toast.error("Calcule a simulação antes de gerar o PDF");
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 20;
      const marginRight = pageWidth - 20;
      const contentWidth = marginRight - marginLeft;

      // Cores
      const primaryColor: [number, number, number] = [15, 87, 45];
      const secondaryColor: [number, number, number] = [31, 41, 55];
      const mutedColor: [number, number, number] = [107, 114, 128];

      // --- Borda da Página ---
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(1);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

      // --- Barra Superior ---
      doc.setFillColor(...primaryColor);
      doc.rect(6, 6, pageWidth - 12, 12, 'F');

      // --- Logo + Info da Empresa ---
      let yPos = 24;
      try {
        const img = new Image();
        img.src = logoImg;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        const imgWidth = 40;
        const imgHeight = (img.height * imgWidth) / img.width;
        doc.addImage(img, 'JPEG', marginLeft, yPos, imgWidth, Math.min(imgHeight, 25));
      } catch (e) {
        console.error("Erro ao carregar logo", e);
      }

      doc.setTextColor(...secondaryColor);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("AFG Soluções Financeiras", marginRight, yPos + 8, { align: "right" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...mutedColor);
      doc.text("Planejamento e Consultoria", marginRight, yPos + 15, { align: "right" });

      // --- Linha Divisória ---
      yPos = 56;
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, yPos, marginRight, yPos);

      // --- Título ---
      yPos += 12;
      doc.setTextColor(...primaryColor);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("SIMULAÇÃO DE CONSÓRCIO", pageWidth / 2, yPos, { align: "center" });

      yPos += 7;
      doc.setTextColor(...mutedColor);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Planejamento financeiro personalizado para sua conquista", pageWidth / 2, yPos, { align: "center" });

      // --- Info do Cliente ---
      yPos += 12;
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(clienteNome || "Cliente Preferencial", marginLeft, yPos);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...mutedColor);
      const dataStr = new Date().toLocaleDateString('pt-BR');
      doc.text(`Data: ${dataStr}`, marginRight, yPos, { align: "right" });

      // --- Linha Divisória ---
      yPos += 5;
      doc.setDrawColor(229, 231, 235);
      doc.line(marginLeft, yPos, marginRight, yPos);

      // --- Grid de Valores ---
      yPos += 10;

      const addRow = (label: string, value: string) => {
        doc.setFontSize(9);
        doc.setTextColor(...mutedColor);
        doc.setFont("helvetica", "bold");
        doc.text(label.toUpperCase(), marginLeft, yPos);

        doc.setFontSize(12);
        doc.setTextColor(...secondaryColor);
        doc.setFont("helvetica", "bold");
        doc.text(value, marginRight, yPos, { align: "right" });

        yPos += 4;
        doc.setDrawColor(243, 244, 246);
        doc.line(marginLeft, yPos, marginRight, yPos);
        yPos += 8;
      };

      addRow("Valor do Crédito", `R$ ${parseFloat(valorCarta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      addRow("Prazo do Plano", `${prazoMeses} meses`);
      addRow("Taxa Administrativa", `${taxaAdmin}%`);

      const custoAdmin = parseFloat(valorCarta) * (parseFloat(taxaAdmin) / 100);
      addRow("Custo Administrativo", `R$ ${custoAdmin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      addRow("Valor Total do Plano", `R$ ${(valorParcela * parseInt(prazoMeses)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

      // --- Destaque Parcela Cheia ---
      yPos += 4;
      const boxHeight = 28;
      doc.setFillColor(...primaryColor);
      doc.roundedRect(marginLeft, yPos, contentWidth, boxHeight, 3, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("PARCELA CHEIA", pageWidth / 2, yPos + 10, { align: "center" });

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(`R$ ${valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth / 2, yPos + 22, { align: "center" });

      // --- Destaque Meia Parcela ---
      yPos += boxHeight + 6;
      const halfBoxHeight = 22;
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(marginLeft, yPos, contentWidth, halfBoxHeight, 3, 3, 'FD');

      doc.setTextColor(...primaryColor);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("OPÇÃO DE MEIA PARCELA (ATÉ CONTEMPLAÇÃO)", pageWidth / 2, yPos + 8, { align: "center" });

      doc.setFontSize(14);
      doc.text(`R$ ${(valorParcela / 2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth / 2, yPos + 18, { align: "center" });

      // --- Aviso ---
      yPos += halfBoxHeight + 5;
      doc.setTextColor(...mutedColor);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("* Valores sujeitos a alteração sem aviso prévio. Consulte condições.", pageWidth / 2, yPos, { align: "center" });

      // --- Observações ---
      if (observacoes) {
        yPos += 10;
        doc.setFontSize(10);
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text("Observações", marginLeft, yPos);
        yPos += 6;
        doc.setTextColor(...secondaryColor);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const splitObs = doc.splitTextToSize(observacoes, contentWidth);
        doc.text(splitObs, marginLeft, yPos);
      }

      // --- Rodapé (posição fixa na parte inferior) ---
      const footerY = pageHeight - 38;

      doc.setFontSize(6);
      doc.setTextColor(...mutedColor);
      doc.setFont("helvetica", "normal");
      const disclaimer = "Esta simulação é de caráter meramente informativo e não constitui obrigação de negócio. Os valores apresentados são estimados e podem sofrer variações de acordo com a tabela vigente na data da contratação. A aprovação do crédito está sujeita à análise.";
      const splitDisclaimer = doc.splitTextToSize(disclaimer, contentWidth);
      doc.text(splitDisclaimer, marginLeft, footerY);

      // Contatos
      const contactY = pageHeight - 20;
      doc.setDrawColor(229, 231, 235);
      doc.line(marginLeft, contactY - 4, marginRight, contactY - 4);

      doc.setFontSize(7);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");

      const leftColX = pageWidth / 4;
      const rightColX = (pageWidth / 4) * 3;

      doc.text("Instagram: @afg_solucoesfinanceiras", leftColX, contactY, { align: "center" });
      doc.text("WhatsApp: +55 99 99168-5741", rightColX, contactY, { align: "center" });
      doc.text("End: Rua Bom Jesus, 309, Centro, Balsas - MA", leftColX, contactY + 5, { align: "center" });
      doc.text("Email: aafgsolucoesfinanceiras@gmail.com", rightColX, contactY + 5, { align: "center" });

      // Salvar
      const fileName = `Simulacao_Consorcio_${clienteNome.replace(/\s+/g, '_') || 'Cliente'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    }
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
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="text-sm font-medium text-primary">Parcela Cheia</span>
                      <span className="text-2xl font-bold text-primary">
                        R$ {valorParcela.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium text-[#0f572d]">Meia Parcela (até contemplação)</span>
                      <span className="text-2xl font-bold text-[#0f572d]">
                        R$ {valorMeiaParcela.toFixed(2)}
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
