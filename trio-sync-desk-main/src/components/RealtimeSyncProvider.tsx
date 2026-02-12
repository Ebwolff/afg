import React from 'react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

/**
 * Componente que ativa a sincronização em tempo real com Supabase.
 * Deve ser colocado dentro do QueryClientProvider no App.tsx.
 * 
 * Este componente escuta mudanças nas tabelas do Supabase e invalida
 * automaticamente as queries do React Query, permitindo que mudanças
 * feitas no mobile sejam refletidas no desktop em tempo real.
 */
export function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
    useRealtimeSync();

    return <>{children}</>;
}
