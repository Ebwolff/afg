import { useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    MoreHorizontal, Pencil, Trash2, CheckCircle2, CalendarDays, User,
    Flag, Clock, Paperclip, FileIcon, Download, Play, X, Loader2,
} from "lucide-react";
import { Task, TaskPriority, TaskStatus, TaskAttachment } from "../types";
import { TaskFormDialog } from "./TaskFormDialog";
import { useTasks, useTaskComments, useTaskAttachments } from "../hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";

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

function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentList({ attachments, phase }: { attachments: TaskAttachment[]; phase: string }) {
    const filtered = attachments.filter((a) => a.phase === phase);
    if (filtered.length === 0) return null;

    const handleDownload = async (att: TaskAttachment) => {
        const { data } = await supabase.storage
            .from("task-attachments")
            .createSignedUrl(att.file_path, 300);
        if (data?.signedUrl) {
            window.open(data.signedUrl, "_blank");
        }
    };

    return (
        <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {phase === "creation" ? "📎 Anexos da Criação" : "📄 Anexos de Conclusão"}
            </p>
            {filtered.map((att) => (
                <div
                    key={att.id}
                    className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 group"
                >
                    <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{att.file_name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(att.file_size)}</p>
                    </div>
                    <button
                        onClick={() => handleDownload(att)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                    >
                        <Download className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

export function TaskList({ tasks, isLoading, onDelete, onUpdate }: TaskListProps) {
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewingTask, setViewingTask] = useState<Task | null>(null);
    const [completingTask, setCompletingTask] = useState<Task | null>(null);
    const [completionNotes, setCompletionNotes] = useState("");
    const [completionFiles, setCompletionFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { createTaskComment } = useTasks();
    const { data: viewAttachments } = useTaskAttachments(viewingTask?.id);
    const { data: comments } = useTaskComments(viewingTask?.id);

    const [newComment, setNewComment] = useState("");
    const [commentFiles, setCommentFiles] = useState<File[]>([]);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const commentFileInputRef = useRef<HTMLInputElement>(null);

    const getStatusBadge = (status: TaskStatus) => {
        const cfg = STATUS_CONFIG[status];
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    };

    const handleStartTask = (task: Task) => {
        onUpdate(task.id, { status: "in_progress" });
    };

    const openCompleteDialog = (task: Task) => {
        setCompletingTask(task);
        setCompletionNotes("");
        setCompletionFiles([]);
    };

    const handleCompleteTask = async () => {
        if (!completingTask) return;
        setIsSubmitting(true);
        try {
            await onUpdate(completingTask.id, {
                status: "completed",
                completion_notes: completionNotes || null,
                files: completionFiles.length > 0 ? completionFiles : undefined,
            });
            setCompletingTask(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompletionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        setCompletionFiles((prev) => [...prev, ...newFiles]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeCompletionFile = (index: number) => {
        setCompletionFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCommentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        setCommentFiles((prev) => [...prev, ...newFiles]);
        if (commentFileInputRef.current) commentFileInputRef.current.value = "";
    };

    const removeCommentFile = (index: number) => {
        setCommentFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAddComment = async () => {
        if (!viewingTask || (!newComment.trim() && commentFiles.length === 0)) return;
        setIsSubmittingComment(true);
        try {
            await createTaskComment.mutateAsync({
                taskId: viewingTask.id,
                content: newComment,
                files: commentFiles,
            });
            setNewComment("");
            setCommentFiles([]);
        } finally {
            setIsSubmittingComment(false);
        }
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
                                            {task.status === "pending" && (
                                                <DropdownMenuItem onClick={() => handleStartTask(task)}>
                                                    <Play className="mr-2 h-4 w-4" />
                                                    Iniciar Tarefa
                                                </DropdownMenuItem>
                                            )}
                                            {(task.status === "pending" || task.status === "in_progress") && (
                                                <DropdownMenuItem onClick={() => openCompleteDialog(task)}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    Concluir Tarefa
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
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">{viewingTask?.title}</DialogTitle>
                        <DialogDescription>Detalhes, andamentos e anexos da tarefa.</DialogDescription>
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

                            {/* Notas de conclusão */}
                            {viewingTask.completion_notes && (
                                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 p-4">
                                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">
                                        Notas de Conclusão Final
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap">{viewingTask.completion_notes}</p>
                                </div>
                            )}

                            {/* Timeline de Andamentos */}
                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="text-sm font-medium">Histórico de Andamentos</h4>

                                {comments && comments.length > 0 ? (
                                    <div className="space-y-4">
                                        {comments.map((comment) => {
                                            const commentAtts = viewAttachments?.filter(a => a.comment_id === comment.id) || [];
                                            return (
                                                <div key={comment.id} className="bg-muted/30 rounded-lg p-3 text-sm">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-medium">{comment.user?.nome || "Usuário"}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                                        </span>
                                                    </div>
                                                    <p className="whitespace-pre-wrap mt-1">{comment.content}</p>
                                                    {commentAtts.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {commentAtts.map(att => (
                                                                <div key={att.id} className="flex items-center gap-2 text-xs bg-background border p-1.5 rounded">
                                                                    <FileIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                    <span className="truncate flex-1">{att.file_name}</span>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-5 w-5"
                                                                        onClick={async () => {
                                                                            const { data } = await supabase.storage.from("task-attachments").createSignedUrl(att.file_path, 300);
                                                                            if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                                                                        }}
                                                                    >
                                                                        <Download className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Nenhum andamento registrado ainda.</p>
                                )}

                                {/* Área de novo comentário (apenas se a tarefa não estiver concluída/cancelada) */}
                                {(viewingTask.status === "pending" || viewingTask.status === "in_progress") && (
                                    <div className="mt-4 border rounded-lg p-3 bg-card">
                                        <Label className="text-xs mb-2 block">Adicionar Novo Andamento</Label>
                                        <Textarea
                                            placeholder="Descreva o que foi feito..."
                                            className="text-sm min-h-[80px] mb-2"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />

                                        {/* Lista de arquivos a enviar */}
                                        {commentFiles.length > 0 && (
                                            <div className="space-y-1 mb-2">
                                                {commentFiles.map((f, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-xs bg-muted/50 p-1 rounded">
                                                        <FileIcon className="h-3 w-3" />
                                                        <span className="flex-1 truncate">{f.name}</span>
                                                        <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-red-500" onClick={() => removeCommentFile(idx)} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <input
                                                    type="file"
                                                    ref={commentFileInputRef}
                                                    className="hidden"
                                                    multiple
                                                    onChange={handleCommentFileChange}
                                                />
                                                <Button type="button" variant="outline" size="sm" onClick={() => commentFileInputRef.current?.click()}>
                                                    <Paperclip className="h-3 w-3 mr-1" /> Anexar
                                                </Button>
                                            </div>
                                            <Button size="sm" onClick={handleAddComment} disabled={isSubmittingComment || (!newComment.trim() && commentFiles.length === 0)}>
                                                {isSubmittingComment && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                                Salvar Andamento
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Outros Anexos Gerais (Creation & Completion) */}
                            {viewAttachments && viewAttachments.filter(a => !a.comment_id).length > 0 && (
                                <div className="space-y-3 border-t pt-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                            Outros Anexos ({viewAttachments.filter(a => !a.comment_id).length})
                                        </span>
                                    </div>
                                    <AttachmentList attachments={viewAttachments.filter(a => !a.comment_id)} phase="creation" />
                                    <AttachmentList attachments={viewAttachments.filter(a => !a.comment_id)} phase="completion" />
                                </div>
                            )}

                            {/* Actions */}
                            {(viewingTask.status === "pending" || viewingTask.status === "in_progress") && (
                                <div className="border-t pt-4 flex gap-2">
                                    {viewingTask.status === "pending" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                handleStartTask(viewingTask);
                                                setViewingTask(null);
                                            }}
                                        >
                                            <Play className="mr-2 h-4 w-4" />
                                            Iniciar Tarefa
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setViewingTask(null);
                                            openCompleteDialog(viewingTask);
                                        }}
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Concluir Tarefa
                                    </Button>
                                </div>
                            )}

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

            {/* Complete Task Dialog */}
            <Dialog open={!!completingTask} onOpenChange={(open) => !open && setCompletingTask(null)}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            Concluir Tarefa
                        </DialogTitle>
                        <DialogDescription>Adicione notas e anexos de conclusão antes de finalizar.</DialogDescription>
                    </DialogHeader>
                    {completingTask && (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-muted/50 p-3">
                                <p className="font-medium">{completingTask.title}</p>
                                {completingTask.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {completingTask.description}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Notas de Conclusão (opcional)</Label>
                                <Textarea
                                    value={completionNotes}
                                    onChange={(e) => setCompletionNotes(e.target.value)}
                                    placeholder="Descreva o que foi feito, resultados obtidos..."
                                    rows={4}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Anexar Documentos de Conclusão (opcional)</Label>
                                <div
                                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Paperclip className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Clique para anexar comprovantes
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleCompletionFileChange}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.csv,.txt"
                                    />
                                </div>

                                {completionFiles.length > 0 && (
                                    <div className="space-y-2">
                                        {completionFiles.map((file, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                                            >
                                                <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatFileSize(file.size)}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeCompletionFile(idx)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCompletingTask(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCompleteTask} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Conclusão
                        </Button>
                    </DialogFooter>
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
