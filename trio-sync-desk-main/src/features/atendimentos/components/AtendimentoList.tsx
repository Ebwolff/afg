import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trash2 } from "lucide-react";
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
import { Atendimento } from "../types";

interface AtendimentoListProps {
    atendimentos: Atendimento[] | undefined;
    onAttend: (id: string) => void;
    onDelete: (id: string) => void;
}

export function AtendimentoList({ atendimentos, onAttend, onDelete }: AtendimentoListProps) {
    if (!atendimentos?.length) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        Nenhum atendimento registrado
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4">
            {atendimentos.map((atendimento) => (
                <Card key={atendimento.id}>
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-lg">
                                    {atendimento.cliente_nome}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {atendimento.cliente_contato}
                                </p>
                            </div>
                            <Badge
                                variant={
                                    atendimento.status === "aguardando"
                                        ? "secondary"
                                        : "default"
                                }
                            >
                                {atendimento.status === "aguardando"
                                    ? "Aguardando"
                                    : "Em atendimento"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-sm">
                                <span className="font-medium">Tipo:</span>{" "}
                                {atendimento.tipo_solicitacao.replace(/_/g, " ")}
                            </p>
                            {atendimento.descricao && (
                                <p className="text-sm">
                                    <span className="font-medium">Descrição:</span>{" "}
                                    {atendimento.descricao}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Solicitado por: {atendimento.solicitado_por?.nome}
                            </p>
                            <div className="flex gap-2 mt-2">
                                {atendimento.status === "aguardando" && (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() => onAttend(atendimento.id)}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Atender
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta ação não pode ser desfeita. O atendimento de{" "}
                                                        <strong>{atendimento.cliente_nome}</strong> será
                                                        permanentemente excluído do sistema.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => onDelete(atendimento.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Excluir
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
