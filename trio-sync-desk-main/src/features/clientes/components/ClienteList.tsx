import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
import { Cliente } from "../types";

interface ClienteListProps {
    clientes: Cliente[] | undefined;
    onDelete: (id: string) => void;
}

export function ClienteList({ clientes, onDelete }: ClienteListProps) {
    if (!clientes?.length) {
        return (
            <Card className="col-span-full">
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        Nenhum cliente cadastrado
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clientes.map((cliente) => (
                <Card key={cliente.id}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. O cliente{" "}
                                            <strong>{cliente.nome}</strong> será permanentemente
                                            excluído do sistema. Isso pode impactar históricos de
                                            atendimentos e serviços.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onDelete(cliente.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1 text-sm">
                            <p>
                                <span className="font-medium">CPF:</span> {cliente.cpf}
                            </p>
                            {cliente.telefone && (
                                <p>
                                    <span className="font-medium">Telefone:</span>{" "}
                                    {cliente.telefone}
                                </p>
                            )}
                            {cliente.email && (
                                <p>
                                    <span className="font-medium">Email:</span> {cliente.email}
                                </p>
                            )}
                            {cliente.endereco && (
                                <p>
                                    <span className="font-medium">Endereço:</span>{" "}
                                    {cliente.endereco}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
