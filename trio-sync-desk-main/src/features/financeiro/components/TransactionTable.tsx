import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Check, X, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Transacao } from "../types";
import { useHideValues } from "@/hooks/useHideValues";

interface TransactionTableProps {
    transacoes: Transacao[] | undefined;
    isLoading: boolean;
    onRegistrarPagamento: (transacao: Transacao) => void;
    onCancelar: (transacao: Transacao) => void;
    onDelete: (id: string) => void;
    onEdit: (transacao: Transacao) => void;
}

export function TransactionTable({ transacoes, isLoading, onRegistrarPagamento, onCancelar, onDelete, onEdit }: TransactionTableProps) {
    const { mask } = useHideValues();
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);

    useEffect(() => { setPage(1); }, [transacoes?.length]);

    const totalItems = transacoes?.length || 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    const paginatedData = transacoes?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) || [];

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
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <X className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm font-medium">Nenhuma transação encontrada</p>
                <p className="text-xs mt-1">Adicione uma nova transação clicando no botão acima.</p>
            </div>
        );
    }

    return (
        <>
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
                {paginatedData.map((transacao) => (
                    <TableRow key={transacao.id}>
                        <TableCell>
                            {(() => {
                                if (!transacao.data_vencimento) return "-";
                                const date = new Date(transacao.data_vencimento);
                                return isNaN(date.getTime()) ? "Data Inválida" : format(date, "dd/MM/yyyy", { locale: ptBR });
                            })()}
                        </TableCell>
                        <TableCell>{transacao.fornecedor_cliente || "-"}</TableCell>
                        <TableCell>{transacao.descricao}</TableCell>
                        <TableCell>
                            {mask(Number(transacao.valor || 0))}
                        </TableCell>
                        <TableCell>{getStatusBadge(transacao.status)}</TableCell>
                        <TableCell>
                            {transacao.parcela_numero && transacao.parcela_total
                                ? `${transacao.parcela_numero}/${transacao.parcela_total}`
                                : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(transacao)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
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

        {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-3 border-t">
                <span className="text-sm text-muted-foreground">
                    {totalItems} registro(s) • Página {page} de {totalPages}
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                    >
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )}
      </>
    );
}
