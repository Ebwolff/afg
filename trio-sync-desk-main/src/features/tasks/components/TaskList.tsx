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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Pencil, Trash2, CheckCircle2, CalendarDays, User, Flag, Clock } from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "../types";
import { TaskFormDialog } from "./TaskFormDialog";

interface TaskListProps {
    tasks: Task[] | undefined;
    isLoading: boolean;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: any) => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
    high: { label: "Alta", color: "text-red-500 font-medium" },
    medium: { label: "Média", color: "text-yellow-600 font-medium" },
    low: { label: "Baixa", color: "text-green-600 font-medium" },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    pending: { label: "Pendente", variant: "secondary" },
    in_progress: { label: "Em Andamento", variant: "default" },
    completed: { label: "Concluída", variant: "outline" },
    cancelled: { label: "Cancelada", variant: "destructive" },
};

export function TaskList({ tasks, isLoading, onDelete, onUpdate }: TaskListProps) {
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);

    const getStatusBadge = (status: TaskStatus) => {
        const cfg = STATUS_CONFIG[status];
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
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
                            <TableRow
                                key={task.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setViewingTask(task)}
                            >
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
                                    <span className={PRIORITY_CONFIG[task.priority].color}>
                                        {PRIORITY_CONFIG[task.priority].label}
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
                                <TableCell onClick={(e) => e.stopPropagation()}>
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

            {/* Task Detail Modal */}
            <Dialog open={!!viewingTask} onOpenChange={(open) => !open && setViewingTask(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{viewingTask?.title}</DialogTitle>
                    </DialogHeader>
                    {viewingTask && (
                        <div className="space-y-5">
                            {viewingTask.description && (
                                <div className="rounded-lg bg-muted/50 p-4">
                                    <p className="text-sm whitespace-pre-wrap">{viewingTask.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <Flag className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        {getStatusBadge(viewingTask.status)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Prioridade</p>
                                        <span className={PRIORITY_CONFIG[viewingTask.priority].color}>
                                            {PRIORITY_CONFIG[viewingTask.priority].label}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Atribuído a</p>
                                        <p className="text-sm font-medium">
                                            {viewingTask.assignee?.nome || "Não atribuído"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Vencimento</p>
                                        <p className="text-sm font-medium">
                                            {viewingTask.due_date
                                                ? format(new Date(viewingTask.due_date), "dd/MM/yyyy", { locale: ptBR })
                                                : "Sem prazo"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4 flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    Criada por: {viewingTask.creator?.nome || "—"} em{" "}
                                    {format(new Date(viewingTask.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {editingTask && (
                <TaskFormDialog
                    open={!!editingTask}
                    onOpenChange={(open) => !open && setEditingTask(null)}
                    initialData={editingTask}
                    onSubmit={async (data) => {
                        await onUpdate(editingTask.id, {
                            ...data,
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

