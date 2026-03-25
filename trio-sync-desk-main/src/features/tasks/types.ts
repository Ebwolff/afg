export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';
export type RelatedEntityType = 'atendimento' | 'cliente' | 'transacao' | 'servico';
export type AttachmentPhase = 'creation' | 'completion' | 'progress';

export interface TaskAttachment {
    id: string;
    task_id: string;
    uploaded_by: string | null;
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string | null;
    phase: AttachmentPhase;
    comment_id: string | null;
    created_at: string;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    assigned_to: string | null;
    created_by: string | null;
    completion_notes: string | null;
    completed_at: string | null;
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
    // Loaded separately
    attachments?: TaskAttachment[];
}

export interface TaskComment {
    id: string;
    task_id: string;
    user_id: string | null;
    content: string;
    created_at: string;
    // Joined fields
    user?: {
        nome: string;
        email: string;
    };
    // Loaded separately
    attachments?: TaskAttachment[];
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
    files?: File[];
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    read: boolean;
    type: 'task_assigned' | 'task_update' | 'conta_pagar_vencimento' | 'conta_receber_vencimento' | 'system';
    link: string | null;
    created_at: string;
}
