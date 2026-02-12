import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/features/financeiro/hooks/useTransactions";
import { TransactionSummaryCards } from "@/features/financeiro/components/TransactionSummaryCards";
import { TransactionFilters } from "@/features/financeiro/components/TransactionFilters";
import { TransactionTable } from "@/features/financeiro/components/TransactionTable";
import { TransactionFormDialog } from "@/features/financeiro/components/TransactionFormDialog";
import { ParceladoFormDialog } from "@/features/financeiro/components/ParceladoFormDialog";
import { Transacao } from "@/features/financeiro/types";

export default function ContasPagar() {
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const {
    transacoes,
    isLoading,
    createMutation,
    createParceladoMutation,
    updateMutation,
    deleteMutation
  } = useTransactions("despesa", statusFilter);

  const handleRegistrarPagamento = (transacao: Transacao) => {
    updateMutation.mutate({
      id: transacao.id,
      status: "pago",
      data_pagamento: new Date().toISOString(),
    });
  };

  const handleCancelar = (transacao: Transacao) => {
    updateMutation.mutate({
      id: transacao.id,
      status: "cancelado",
    });
  };

  const handleEdit = (transacao: Transacao) => {
    setEditingTransaction(transacao);
    setIsEditOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = (data: any) => {
    updateMutation.mutate({
      ...data,
      valor: parseFloat(data.valor),
      data_vencimento: data.data_vencimento instanceof Date ? data.data_vencimento.toISOString() : data.data_vencimento,
      data_pagamento: data.data_pagamento instanceof Date ? data.data_pagamento.toISOString() : data.data_pagamento,
      id: editingTransaction?.id,
    });
    setIsEditOpen(false);
    setEditingTransaction(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
          <p className="text-muted-foreground">Gerencie todas as suas contas a pagar</p>
        </div>

        <TransactionSummaryCards transacoes={transacoes} isLoading={isLoading} type="despesa" />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Contas a Pagar</CardTitle>
                <CardDescription>Filtre e gerencie suas contas</CardDescription>
              </div>
              <div className="flex gap-2">
                <ParceladoFormDialog
                  onSubmit={(data) => createParceladoMutation.mutate(data)}
                  isLoading={createParceladoMutation.isPending}
                  type="despesa"
                />
                <TransactionFormDialog
                  onSubmit={(data) => createMutation.mutate(data)}
                  isLoading={createMutation.isPending}
                  type="despesa"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TransactionFilters
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />

            <TransactionTable
              transacoes={transacoes}
              isLoading={isLoading}
              onRegistrarPagamento={handleRegistrarPagamento}
              onCancelar={handleCancelar}
              onDelete={(id) => deleteMutation.mutate(id)}
              onEdit={handleEdit}
            />
          </CardContent>
        </Card>

        <TransactionFormDialog
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) setEditingTransaction(null);
          }}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
          type="despesa"
          initialData={editingTransaction}
        />
      </div>
    </Layout>
  );
}