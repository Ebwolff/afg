import { Layout } from "@/components/Layout";
import { useClientes } from "@/features/clientes/hooks/useClientes";
import { ClienteFormDialog } from "@/features/clientes/components/ClienteFormDialog";
import { ClienteList } from "@/features/clientes/components/ClienteList";

export default function Clientes() {
  const { clientes, createMutation, deleteMutation } = useClientes();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">
              Gestão da carteira de clientes
            </p>
          </div>
          <ClienteFormDialog
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
          />
        </div>

        <ClienteList
          clientes={clientes}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      </div>
    </Layout>
  );
}
