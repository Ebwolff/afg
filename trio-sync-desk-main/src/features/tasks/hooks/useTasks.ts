import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskFormData, TaskAttachment } from "../types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const PRIORITY_LABELS: Record<string, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
};

async function sendTaskNotification(
    assignedTo: string,
    taskTitle: string,
    priority: string,
    type: "task_assigned" | "task_update"
) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id === assignedTo) return;

    const { data: creator } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", user.id)
        .single();

    const creatorName = creator?.nome || "Alguém";
    const prioLabel = PRIORITY_LABELS[priority] || priority;

    const isNew = type === "task_assigned";
    const title = isNew ? "Nova tarefa atribuída" : "Tarefa atualizada";
    const message = isNew
        ? `${creatorName} atribuiu a tarefa "${taskTitle}" para você. Prioridade: ${prioLabel}.`
        : `${creatorName} atualizou a tarefa "${taskTitle}". Prioridade: ${prioLabel}.`;

    await supabase.from("notifications").insert({
        user_id: assignedTo,
        title,
        message,
        type,
        link: "/tasks",
        read: false,
    });
}

async function uploadTaskFiles(taskId: string, files: File[], phase: "creation" | "completion") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const file of files) {
        const ext = file.name.split(".").pop() || "";
        const filePath = `tasks/${taskId}/${phase}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
            .from("task-attachments")
            .upload(filePath, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
        }

        await supabase.from("task_attachments").insert({
            task_id: taskId,
            uploaded_by: user.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type || ext,
            phase,
        });
    }
}

export function useTaskAttachments(taskId: string | undefined) {
    return useQuery({
        queryKey: ["task-attachments", taskId],
        queryFn: async () => {
            if (!taskId) return [];
            const { data, error } = await supabase
                .from("task_attachments")
                .select("*")
                .eq("task_id", taskId)
                .order("created_at", { ascending: true });
            if (error) throw error;
            return (data || []) as TaskAttachment[];
        },
        enabled: !!taskId,
    });
}

export function useTasks() {
    const queryClient = useQueryClient();
    const { isAdmin, user } = useAuth();

    const { data: tasks, isLoading, error } = useQuery({
        queryKey: ["tasks", isAdmin, user?.id],
        queryFn: async () => {
            let query = supabase
                .from("tasks")
                .select(`
                    *,
                    assignee:assigned_to(nome, email),
                    creator:created_by(nome, email)
                `)
                .order("created_at", { ascending: false });

            if (!isAdmin && user?.id) {
                query = query.eq("assigned_to", user.id);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Task[];
        },
    });

    const createTask = useMutation({
        mutationFn: async (newTask: TaskFormData) => {
            const { data, error } = await supabase
                .from("tasks")
                .insert({
                    title: newTask.title,
                    description: newTask.description,
                    status: newTask.status,
                    priority: newTask.priority,
                    due_date: newTask.due_date?.toISOString(),
                    assigned_to: newTask.assigned_to || null,
                    related_entity_type: newTask.related_entity_type,
                    related_entity_id: newTask.related_entity_id,
                })
                .select()
                .single();

            if (error) throw error;

            // Upload anexos da criação
            if (newTask.files && newTask.files.length > 0) {
                await uploadTaskFiles(data.id, newTask.files, "creation");
            }

            if (newTask.assigned_to) {
                await sendTaskNotification(
                    newTask.assigned_to,
                    newTask.title,
                    newTask.priority,
                    "task_assigned"
                );
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast.success("Tarefa criada com sucesso!");
        },
        onError: () => {
            toast.error("Erro ao criar tarefa.");
        },
    });

    const updateTask = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskFormData> & { status?: string; completion_notes?: string } }) => {
            const payload: Record<string, unknown> = { ...updates };
            delete payload.files;

            if (updates.due_date) {
                payload.due_date = updates.due_date.toISOString();
            }

            if (updates.status === "completed") {
                payload.completed_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from("tasks")
                .update(payload)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            // Upload anexos de conclusão
            if (updates.files && updates.files.length > 0) {
                await uploadTaskFiles(id, updates.files, "completion");
            }

            if (updates.assigned_to) {
                await sendTaskNotification(
                    updates.assigned_to,
                    updates.title || data.title,
                    updates.priority || data.priority,
                    "task_update"
                );
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["task-attachments"] });
            toast.success("Tarefa atualizada!");
        },
        onError: () => {
            toast.error("Erro ao atualizar tarefa.");
        },
    });

    const deleteTask = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("tasks").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast.success("Tarefa excluída.");
        },
        onError: () => {
            toast.error("Erro ao excluir tarefa.");
        },
    });

    return {
        tasks,
        isLoading,
        error,
        createTask,
        updateTask,
        deleteTask,
    };
}
