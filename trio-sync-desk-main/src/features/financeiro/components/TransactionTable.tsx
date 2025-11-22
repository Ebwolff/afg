import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Check, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Transacao } from "../types";

interface TransactionTableProps {
    transacoes: Transacao[] | undefined;
    isLoading: boolean;
    onRegistrarPagamento: (transacao: Transacao) => void;
    onCancelar: (transacao: Transacao) => void;
    onDelete: (id: string) => void;
}

export function TransactionTable({ transacoes, isLoading, onRegistrarPagamento, onCancelar, onDelete }: TransactionTableProps) {
    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            pendente: "secondary",
            pago: "default",
            vencido: "destructive",
            cancelado: "outline",
        };
        return <Badge variant={variants[status] || "default"}>{status.toUpperCase()}</Badge>;
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    if (!transacoes || transacoes.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Nenhuma conta a pagar encontrada
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transacoes.map((transacao) => (
                    <TableRow key={transacao.id}>
                        <TableCell>
                            {transacao.data_vencimento
                                ? format(new Date(transacao.data_vencimento), "dd/MM/yyyy", { locale: ptBR })
                                : "-"}
                        </TableCell>
                        <TableCell>{transacao.fornecedor_cliente || "-"}</TableCell>
                        <TableCell>{transacao.descricao}</TableCell>
                        <TableCell>R$ {transacao.valor.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(transacao.status)}</TableCell>
                        <TableCell>
                            {transacao.parcela_numero && transacao.parcela_total
                                ? `${transacao.parcela_numero}/${transacao.parcela_total}`
                                : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                {transacao.status === "pendente" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onRegistrarPagamento(transacao)}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                )}
                                {transacao.status === "pendente" && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Cancelar Conta</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem certeza que deseja cancelar esta conta?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Não</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onCancelar(transacao)}>
                                                    Sim, cancelar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDelete(transacao.id)}>
                                                Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
