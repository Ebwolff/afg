export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';
export type RelatedEntityType = 'atendimento' | 'cliente' | 'transacao' | 'servico';

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    assigned_to: string | null;
    created_by: string | null;
    related_entity_type: RelatedEntityType | null;
    related_entity_id: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    assignee?: {
        nome: string;
        email: string;
    };
    creator?: {
        nome: string;
        email: string;
    };
}

export interface TaskFormData {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: Date;
    assigned_to: string;
    related_entity_type?: RelatedEntityType;
    related_entity_id?: string;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    read: boolean;
    type: 'task_assigned' | 'task_update' | 'system';
    link: string | null;
    created_at: string;
}
