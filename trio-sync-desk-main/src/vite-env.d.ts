/// <reference types="vite/client" />

interface Window {
    auth?: {
        getItem: (key: string) => Promise<string | null>;
        setItem: (key: string, value: string) => Promise<void>;
        removeItem: (key: string) => Promise<void>;
    };
    notification?: {
        send: (title: string, body: string) => Promise<void>;
    };
}
