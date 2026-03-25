import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type TableName = 'clientes' | 'transacoes' | 'produtos' | 'atendimentos' | 'eventos' | 'tasks' | 'leads';

interface UseRealtimeSubscriptionOptions {
    table: TableName;
    queryKey: string[];
}

/**
 * Hook para sincronização em tempo real com Supabase.
 * Invalida automaticamente as queries quando há mudanças no banco de dados.
 */
export function useRealtimeSubscription({ table, queryKey }: UseRealtimeSubscriptionOptions) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel(`realtime-${table}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey });
                    queryClient.invalidateQueries({ queryKey: [`${table}-count`] });
                    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, queryKey, queryClient]);
}

/**
 * Hook para sincronizar múltiplas tabelas de uma vez.
 */
export function useRealtimeSync() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const tables: { table: TableName; queryKey: string[] }[] = [
            { table: 'clientes', queryKey: ['clientes'] },
            { table: 'transacoes', queryKey: ['transacoes'] },
            { table: 'produtos', queryKey: ['produtos'] },
            { table: 'eventos', queryKey: ['eventos'] },
            { table: 'atendimentos', queryKey: ['atendimentos'] },
            { table: 'tasks', queryKey: ['tasks'] },
            { table: 'leads', queryKey: ['leads'] },
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
                    () => {
                        queryClient.invalidateQueries({ queryKey });
                        queryClient.invalidateQueries({ queryKey: [`${table}-count`] });
                        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                    }
                )
                .subscribe();
        });

        return () => {
            channels.forEach((channel) => {
                supabase.removeChannel(channel);
            });
        };
    }, [queryClient]);
}

