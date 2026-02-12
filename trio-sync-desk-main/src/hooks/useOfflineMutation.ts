import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useNetworkStatus } from "./useNetworkStatus";
import { addToQueue } from "../lib/mutation-queue";
import { useToast } from "./use-toast";

export function useOfflineMutation<TData = unknown, TError = unknown, TVariables = unknown, TContext = unknown>(
    options: UseMutationOptions<TData, TError, TVariables, TContext> & { mutationKey: unknown[] }
) {
    const isOnline = useNetworkStatus();
    const { toast } = useToast();
    const mutation = useMutation(options);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mutate = (variables: TVariables, mutateOptions?: any) => {
        if (isOnline) {
            return mutation.mutate(variables, mutateOptions);
        } else {
            // Offline mode
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const offlineKey = (options.meta as any)?.offlineKey;

            if (!offlineKey) {
                console.warn("Offline mutation missing 'offlineKey' in meta options. Cannot queue.");
                return;
            }

            addToQueue({
                mutationKey: options.mutationKey,
                variables,
                offlineKey,
            });

            // Optimistic update or just notification
            toast({
                title: "Salvo offline",
                description: "Sua alteração será sincronizada quando a conexão voltar.",
            });

            // Trigger onSuccess if provided (to update UI optimistically)
            if (options.onSuccess) {
                // @ts-expect-error - simulating success with null/void
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                options.onSuccess(null as any, variables, null);
            }
        }
    };

    return {
        ...mutation,
        mutate,
        isPending: mutation.isPending, // In offline, it's instant, so not pending
    };
}
