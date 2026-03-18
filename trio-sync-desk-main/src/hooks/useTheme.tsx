import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "afg-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
            if (stored === "dark" || stored === "light") return stored;
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        } catch {
            return "light";
        }
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* noop */ }
    }, [theme]);

    const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
    return context;
}
