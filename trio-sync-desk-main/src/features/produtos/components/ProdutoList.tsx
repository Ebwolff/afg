import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, CreditCard, Home, DollarSign, FileText } from "lucide-react";
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
import { Produto } from "../types";

interface ProdutoListProps {
    produtos: Produto[] | undefined;
    onDelete: (id: string) => void;
}

export function ProdutoList({ produtos, onDelete }: ProdutoListProps) {
    const getCategoriaIcon = (categoria: string) => {
        switch (categoria) {
            case "cartas_credito":
                return <CreditCard className="h-5 w-5" />;
            case "financiamentos":
                return <DollarSign className="h-5 w-5" />;
            case "consignados":
                return <FileText className="h-5 w-5" />;
            case "venda_imoveis":
            case "aluguel_imoveis":
                return <Home className="h-5 w-5" />;
            default:
                return <FileText className="h-5 w-5" />;
        }
    };

    const getCategoriaLabel = (categoria: string) => {
        const labels: Record<string, string> = {
            cartas_credito: "Cartas de Crédito",
            financiamentos: "Financiamentos",
            consignados: "Consignados",
            venda_imoveis: "Venda de Imóveis",
            aluguel_imoveis: "Aluguel de Imóveis",
        };
        return labels[categoria] || categoria;
    };

    if (!produtos?.length) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                        Nenhum produto ou serviço cadastrado ainda.
                        <br />
                        Clique no botão acima para adicionar o primeiro.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {produtos.map((produto) => (
                <Card key={produto.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                {getCategoriaIcon(produto.categoria)}
                                <div>
                                    <CardTitle className="text-lg">{produto.nome}</CardTitle>
                                    <CardDescription>{getCategoriaLabel(produto.categoria)}</CardDescription>
                                </div>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tem certeza que deseja remover este produto/serviço? Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onDelete(produto.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Remover
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {produto.descricao && (
                            <p className="text-sm text-muted-foreground">{produto.descricao}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-sm">
                            <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                                {produto.tipo === "produto" ? "Produto" : "Serviço"}
                            </span>
                            {produto.valor_base && (
                                <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                                    R$ {typeof produto.valor_base === 'number' ? produto.valor_base.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : parseFloat(produto.valor_base).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                            )}
                            {produto.comissao_percentual && (
                                <span className="px-2 py-1 rounded-md bg-accent/10 text-accent font-medium">
                                    {typeof produto.comissao_percentual === 'number' ? produto.comissao_percentual.toFixed(2) : parseFloat(produto.comissao_percentual).toFixed(2)}% comissão
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
