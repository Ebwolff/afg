import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { TaskList } from "../components/TaskList";
import { TaskFormDialog } from "../components/TaskFormDialog";
import { useTasks } from "../hooks/useTasks";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";

export default function TasksPage() {
    const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <Layout>
            <div className="container mx-auto py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie suas tarefas e da equipe.
                        </p>
                    </div>
                    <TaskFormDialog
                        open={isCreateOpen}
                        onOpenChange={setIsCreateOpen}
                        onSubmit={async (data) => {
                            await createTask.mutateAsync(data);
                        }}
                        trigger={
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nova Tarefa
                            </Button>
                        }
                    />
                </div>

                <TaskList
                    tasks={tasks}
                    isLoading={isLoading}
                    onDelete={(id) => deleteTask.mutate(id)}
                    onUpdate={(id, updates) => updateTask.mutate({ id, updates })}
                />
            </div>
        </Layout>
    );
}
