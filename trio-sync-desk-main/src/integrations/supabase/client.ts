import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY são obrigatórias.");
}

// Define the interface for the exposed auth API
interface AuthAPI {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// Extend the window interface
declare global {
  interface Window {
    auth?: AuthAPI;
  }
}

// Custom storage adapter — sessionStorage para sessão expirar ao fechar o navegador
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (window.auth) {
      return await window.auth.getItem(key);
    }
    return sessionStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (window.auth) {
      await window.auth.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (window.auth) {
      await window.auth.removeItem(key);
    } else {
      sessionStorage.removeItem(key);
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: customStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  }
});