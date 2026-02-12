import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "../types";
import { TaskFormDialog } from "./TaskFormDialog";

interface TaskListProps {
    tasks: Task[] | undefined;
    isLoading: boolean;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: any) => void;
}

export function TaskList({ tasks, isLoading, onDelete, onUpdate }: TaskListProps) {
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case "high":
                return "text-red-500 font-medium";
            case "medium":
                return "text-yellow-600 font-medium";
            case "low":
                return "text-green-600 font-medium";
            default:
                return "";
        }
    };

    const getStatusBadge = (status: TaskStatus) => {
        const variants: Record<TaskStatus, "default" | "secondary" | "outline" | "destructive"> = {
            pending: "secondary",
            in_progress: "default",
            completed: "outline", // Greenish outline would be nice, but stick to standard variants for now
            cancelled: "destructive",
        };

        const labels: Record<TaskStatus, string> = {
            pending: "Pendente",
            in_progress: "Em Andamento",
            completed: "Concluída",
            cancelled: "Cancelada",
        };

        return <Badge variant={variants[status]}>{labels[status]}</Badge>;
    };

    if (isLoading) {
        return <div className="p-4 text-center">Carregando tarefas...</div>;
    }

    if (!tasks || tasks.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/10">
                Nenhuma tarefa encontrada.
            </div>
        );
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Prioridade</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Atribuído a</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{task.title}</span>
                                        {task.description && (
                                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {task.description}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={getPriorityColor(task.priority)}>
                                        {task.priority === "high"
                                            ? "Alta"
                                            : task.priority === "medium"
                                                ? "Média"
                                                : "Baixa"}
                                    </span>
                                </TableCell>
                                <TableCell>{getStatusBadge(task.status)}</TableCell>
                                <TableCell>
                                    {task.assignee ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                                {task.assignee.nome.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm">{task.assignee.nome}</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {task.due_date
                                        ? format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })
                                        : "-"}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Abrir menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditingTask(task)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            {task.status !== "completed" && (
                                                <DropdownMenuItem onClick={() => onUpdate(task.id, { status: "completed" })}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Marcar com Concluída
                                                </DropdownMenuItem>
                                            )}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Excluir Tarefa?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a tarefa.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onDelete(task.id)} className="bg-red-600 hover:bg-red-700">
                                                            Excluir
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {editingTask && (
                <TaskFormDialog
                    open={!!editingTask}
                    onOpenChange={(open) => !open && setEditingTask(null)}
                    initialData={editingTask}
                    onSubmit={async (data) => {
                        await onUpdate(editingTask.id, {
                            ...data,
                            // Ensure priority and status types are correct
                            priority: data.priority,
                            status: data.status,
                        });
                        setEditingTask(null);
                    }}
                />
            )}
        </>
    );
}
