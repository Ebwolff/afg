import { Layout } from "@/components/Layout";
import { useAtendimentos } from "@/features/atendimentos/hooks/useAtendimentos";
import { AtendimentoFormDialog } from "@/features/atendimentos/components/AtendimentoFormDialog";
import { AtendimentoList } from "@/features/atendimentos/components/AtendimentoList";

export default function Atendimentos() {
  const {
    atendimentos,
    createMutation,
    atenderMutation,
    deleteMutation
  } = useAtendimentos();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Atendimentos</h1>
            <p className="text-muted-foreground">
              Solicitações de serviços dos clientes
            </p>
          </div>
          <AtendimentoFormDialog
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
          />
        </div>

        <AtendimentoList
          atendimentos={atendimentos}
          onAttend={(id) => atenderMutation.mutate(id)}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      </div>
    </Layout>
  );
}
