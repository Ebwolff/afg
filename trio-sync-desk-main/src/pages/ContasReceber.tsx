import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { useTransactions } from "@/features/financeiro/hooks/useTransactions";
import { TransactionSummaryCards } from "@/features/financeiro/components/TransactionSummaryCards";
import { TransactionFilters } from "@/features/financeiro/components/TransactionFilters";
import { TransactionTable } from "@/features/financeiro/components/TransactionTable";
import { TransactionFormDialog } from "@/features/financeiro/components/TransactionFormDialog";
import { ParceladoFormDialog } from "@/features/financeiro/components/ParceladoFormDialog";
import { Transacao } from "@/features/financeiro/types";

export default function ContasReceber() {
  const [statusFilter, setStatusFilter] = useState("todas");
  const {
    transacoes,
    isLoading,
    createMutation,
    createParceladoMutation,
    updateMutation,
    deleteMutation
  } = useTransactions("receita", statusFilter);

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

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas a Receber</h1>
          <p className="text-muted-foreground">Gerencie todas as suas contas a receber</p>
        </div>

        <TransactionSummaryCards transacoes={transacoes} isLoading={isLoading} type="receita" />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transações</CardTitle>
              <div className="flex gap-2">
                <ParceladoFormDialog
                  onSubmit={(data) => createParceladoMutation.mutate(data)}
                  isLoading={createParceladoMutation.isPending}
                  type="receita"
                />
                <TransactionFormDialog
                  onSubmit={(data) => createMutation.mutate(data)}
                  isLoading={createMutation.isPending}
                  type="receita"
                />
              </div>
            </div>
            <TransactionFilters statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
          </CardHeader>
          <CardContent>
            <TransactionTable
              transacoes={transacoes}
              isLoading={isLoading}
              onRegistrarPagamento={handleRegistrarPagamento}
              onCancelar={handleCancelar}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}