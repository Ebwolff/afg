import { Layout } from "@/components/Layout";
import { ProductivityPanel } from "@/components/ProductivityPanel";

export default function Produtividade() {
    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Produtividade</h1>
                    <p className="text-muted-foreground">
                        Score de performance da equipe baseado na execução de tarefas
                    </p>
                </div>
                <ProductivityPanel />
            </div>
        </Layout>
    );
}
