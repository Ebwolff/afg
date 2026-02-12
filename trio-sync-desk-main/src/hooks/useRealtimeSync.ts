import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TableName = 'clientes' | 'transacoes' | 'produtos' | 'atendimentos' | 'eventos';

interface UseRealtimeSubscriptionOptions {
    table: TableName;
    queryKey: string[];
}

/**
 * Hook para sincronização em tempo real com Supabase.
 * Invalida automaticamente as queries quando há mudanças no banco de dados.
 * Isso permite que mudanças feitas no mobile sejam refletidas no desktop automaticamente.
 */
export function useRealtimeSubscription({ table, queryKey }: UseRealtimeSubscriptionOptions) {
    const queryClient = useQueryClient();

    useEffect(() => {
        console.log(`[Realtime] Subscrevendo à tabela: ${table}`);

        const channel = supabase
            .channel(`realtime-${table}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: table,
                },
                (payload) => {
                    console.log(`[Realtime] Mudança detectada em ${table}:`, payload.eventType);

                    // Invalida a query para forçar um refetch
                    queryClient.invalidateQueries({ queryKey });

                    // Também invalida queries relacionadas de contagem
                    queryClient.invalidateQueries({ queryKey: [`${table}-count`] });

                    // Invalida dashboard data para refletir mudanças em tempo real
                    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                }
            )
            .subscribe((status) => {
                console.log(`[Realtime] Status da subscrição ${table}:`, status);
            });

        return () => {
            console.log(`[Realtime] Cancelando subscrição da tabela: ${table}`);
            supabase.removeChannel(channel);
        };
    }, [table, queryKey, queryClient]);
}

/**
 * Hook para sincronizar múltiplas tabelas de uma vez.
 * Útil para usar no App.tsx ou em um componente de layout raiz.
 */
export function useRealtimeSync() {
    const queryClient = useQueryClient();

    useEffect(() => {
        console.log('[Realtime] Iniciando sincronização em tempo real...');

        const tables: { table: TableName; queryKey: string[] }[] = [
            { table: 'clientes', queryKey: ['clientes'] },
            { table: 'transacoes', queryKey: ['transacoes'] },
            { table: 'produtos', queryKey: ['produtos'] },
            { table: 'eventos', queryKey: ['eventos'] },
        ];

        const channels = tables.map(({ table, queryKey }) => {
            return supabase
                .channel(`realtime-sync-${table}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: table,
                    },
                    (payload) => {
                        console.log(`[Realtime Sync] ${table}:`, payload.eventType);
                        queryClient.invalidateQueries({ queryKey });
                        queryClient.invalidateQueries({ queryKey: [`${table}-count`] });
                        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                    }
                )
                .subscribe();
        });

        return () => {
            console.log('[Realtime] Cancelando todas as subscrições...');
            channels.forEach((channel) => {
                supabase.removeChannel(channel);
            });
        };
    }, [queryClient]);
}
