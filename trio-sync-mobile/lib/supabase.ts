import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://lkaayiobaddjeponhafb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrYWF5aW9iYWRkamVwb25oYWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDYxMjcsImV4cCI6MjA3OTc4MjEyN30.SXAJzPANk1-tkkMPXws9O7bhPJHkab8l02cZbQ3URvA';

// Debug: Log de inicialização
console.log('[Supabase] Inicializando cliente...');
console.log('[Supabase] URL:', supabaseUrl);

// Custom storage adapter para persistência de sessão
const customStorage = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.error('Error getting item from storage:', error);
            return null;
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error('Error setting item in storage:', error);
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing item from storage:', error);
        }
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: customStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
    },
    global: {
        fetch: async (url, options) => {
            console.log('[Supabase] Requisição:', typeof url === 'string' ? url : url.toString());
            try {
                const response = await fetch(url, options);
                console.log('[Supabase] Resposta status:', response.status);
                return response;
            } catch (error) {
                console.error('[Supabase] Erro de rede:', error);
                throw error;
            }
        }
    }
});

// Helper para verificar sessão existente
export const checkSession = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('Error checking session:', error);
        return null;
    }
};

// Helper para logout
export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error signing out:', error);
        return false;
    }
};
