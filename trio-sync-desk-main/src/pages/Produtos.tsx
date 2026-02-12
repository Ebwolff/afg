import { Layout } from "@/components/Layout";
import { useProdutos } from "@/features/produtos/hooks/useProdutos";
import { ProdutoFormDialog } from "@/features/produtos/components/ProdutoFormDialog";
import { ProdutoList } from "@/features/produtos/components/ProdutoList";

import { ProductSkeleton } from "@/components/skeletons/ProductSkeleton";

export default function Produtos() {
  const { produtos, isLoading, createMutation, deleteMutation } = useProdutos();

  if (isLoading) {
    return (
      <Layout>
        <ProductSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produtos e Serviços</h1>
            <p className="text-muted-foreground">Gerencie o portfólio de produtos e serviços da AFG</p>
          </div>
          <ProdutoFormDialog
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
          />
        </div>

        <ProdutoList
          produtos={produtos}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      </div>
    </Layout>
  );
}
