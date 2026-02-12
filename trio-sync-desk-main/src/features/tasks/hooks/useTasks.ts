import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskFormData } from "../types";
import { toast } from "sonner";

export function useTasks() {
    const queryClient = useQueryClient();

    const { data: tasks, isLoading, error } = useQuery({
        queryKey: ["tasks"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tasks")
                .select(`
                    *,
                    assignee:assigned_to(nome, email),
                    creator:created_by(nome, email)
                `)
                .order("created_at", { ascending: false });

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
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast.success("Tarefa criada com sucesso!");
        },
        onError: (error) => {
            console.error("Erro ao criar tarefa:", error);
            toast.error("Erro ao criar tarefa.");
        },
    });

    const updateTask = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskFormData> }) => {
            const { data, error } = await supabase
                .from("tasks")
                .update({
                    ...updates,
                    due_date: updates.due_date?.toISOString(),
                })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast.success("Tarefa atualizada!");
        },
        onError: (error) => {
            console.error("Erro ao atualizar tarefa:", error);
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
        onError: (error) => {
            console.error("Erro ao excluir tarefa:", error);
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
