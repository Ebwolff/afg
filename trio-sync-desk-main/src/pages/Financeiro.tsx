import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOfflineMutation } from "@/hooks/useOfflineMutation";
import { createTransaction, deleteTransaction } from "@/features/financeiro/api/transactions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TransactionSkeleton } from "@/components/skeletons/TransactionSkeleton";

const CATEGORIAS_RECEITA = [
  "Vendas",
  "Serviços",
  "Comissões",
  "Rendimentos",
  "Outros"
];

const CATEGORIAS_DESPESA = [
  "Aluguel",
  "Água/Luz/Internet",
  "Fornecedores",
  "Salários",
  "Impostos",
  "Marketing",
  "Manutenção",
  "Alimentação",
  "Transporte",
  "Outros"
];

export default function Financeiro() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    tipo: "receita" as "receita" | "despesa",
    descricao: "",
    valor: "",
    categoria: "",
  });

  const categorias = formData.tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  const { data: transacoes, isLoading } = useQuery({
    queryKey: ["transacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes")
        .select("*")
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useOfflineMutation({
    mutationFn: createTransaction,
    mutationKey: ["createTransaction"],
    meta: { offlineKey: "createTransaction" },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      toast({ title: "Transação cadastrada com sucesso!" });
      setOpen(false);
      setFormData({
        tipo: "receita",
        descricao: "",
        valor: "",
        categoria: "",
      });
      if (window.notification) {
        window.notification.send(
          "Nova Transação",
          "Transação cadastrada com sucesso!"
        );
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useOfflineMutation({
    mutationFn: deleteTransaction,
    mutationKey: ["deleteTransaction"],
    meta: { offlineKey: "deleteTransaction" },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      toast({ title: "Transação excluída com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <TransactionSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">Controle de entradas e saídas</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate({
                    ...formData,
                    tipo: formData.tipo,
                    data_vencimento: new Date(),
                    fornecedor_cliente: "",
                    documento: "",
                    conta_bancaria: "",
                    metodo_pagamento: "",
                    observacoes: "",
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: "receita" | "despesa") =>
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) =>
                      setFormData({ ...formData, valor: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoria: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Criar Transação
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transacoes?.map((transacao) => (
                <div
                  key={transacao.id}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{transacao.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transacao.data), "dd/MM/yyyy", { locale: ptBR })}
                      {transacao.categoria && ` • ${transacao.categoria}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-lg font-bold ${transacao.tipo === "receita"
                        ? "text-success"
                        : "text-destructive"
                        }`}
                    >
                      {transacao.tipo === "receita" ? "+" : "-"}R${" "}
                      {Number(transacao.valor).toFixed(2)}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A transação será
                            permanentemente excluída do sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(transacao.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              {!transacoes?.length && (
                <p className="text-center text-muted-foreground">
                  Nenhuma transação registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
