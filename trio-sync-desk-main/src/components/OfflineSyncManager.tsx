import { useEffect, useState } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { getQueue, removeFromQueue, OfflineMutation } from "@/lib/mutation-queue";
import { getMutationFn } from "@/lib/mutation-registry";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Wifi, WifiOff } from "lucide-react";

export function OfflineSyncManager() {
    const isOnline = useNetworkStatus();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (isOnline) {
            processQueue();
        }
    }, [isOnline]);

    const processQueue = async () => {
        const queue = getQueue();
        if (queue.length === 0) return;

        setIsSyncing(true);
        toast({
            title: "Sincronizando...",
            description: `Enviando ${queue.length} alterações pendentes.`,
        });

        let successCount = 0;
        let errorCount = 0;

        for (const item of queue) {
            try {
                const mutationFn = getMutationFn(item.offlineKey);
                if (!mutationFn) {
                    console.error(`Mutation function not found for key: ${item.offlineKey}`);
                    errorCount++;
                    continue;
                }

                await mutationFn(item.variables);
                removeFromQueue(item.id);
                successCount++;
            } catch (error) {
                console.error("Error syncing item", item, error);
                errorCount++;
            }
        }

        setIsSyncing(false);

        if (successCount > 0) {
            toast({
                title: "Sincronização concluída",
                description: `${successCount} alterações enviadas com sucesso.`,
            });
            // Invalidate all queries to refresh data
            queryClient.invalidateQueries();
        }

        if (errorCount > 0) {
            toast({
                title: "Erro na sincronização",
                description: `${errorCount} alterações falharam e continuam na fila.`,
                variant: "destructive",
            });
        }
    };

    if (!isOnline) {
        return (
            <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">Sem Conexão</span>
            </div>
        );
    }

    if (isSyncing) {
        return (
            <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Sincronizando...</span>
            </div>
        );
    }

    return null;
}
