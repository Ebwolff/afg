import { PostgrestError } from "@supabase/supabase-js";
import { toast } from "sonner";

export class AppError extends Error {
    constructor(message: string, public originalError?: unknown) {
        super(message);
        this.name = "AppError";
    }
}

export function handleSupabaseError(error: PostgrestError | null, customMessage?: string) {
    if (!error) return;

    const errorMessage = customMessage || error.message || "Ocorreu um erro inesperado.";

    console.error(`Supabase Error: ${errorMessage}`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
        original: error
    });

    // Optional: Integration with toast here if we want immediate feedback, 
    // but usually we want the caller to decide how to show it (UI vs Logic).
    // For now, we just throw a standardized error.

    throw new AppError(errorMessage, error);
}

// Helper to wrap async Supabase calls and handle errors automatically
export async function safeSupabaseQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    errorMessage: string
): Promise<T> {
    const { data, error } = await queryFn();
    if (error) {
        handleSupabaseError(error, errorMessage);
    }
    // If no error but data is null (and T doesn't allow null), this might be an issue. 
    // But for most 'select' queries, empty list is valid data, and 'single' returns null if not found.
    return data as T;
}
