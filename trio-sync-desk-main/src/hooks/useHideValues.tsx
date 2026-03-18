import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface HideValuesContextType {
    hidden: boolean;
    toggle: () => void;
    mask: (value: string | number) => string;
}

const HideValuesContext = createContext<HideValuesContextType | null>(null);

const STORAGE_KEY = "afg-hide-values";

export function HideValuesProvider({ children }: { children: ReactNode }) {
    const [hidden, setHidden] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
    });

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, String(hidden)); } catch { /* noop */ }
    }, [hidden]);

    const toggle = useCallback(() => setHidden((h) => !h), []);

    const mask = useCallback(
        (value: string | number): string => {
            if (!hidden) {
                if (typeof value === "number") {
                    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                }
                return String(value);
            }
            return "R$ •••••";
        },
        [hidden]
    );

    return (
        <HideValuesContext.Provider value={{ hidden, toggle, mask }}>
            {children}
        </HideValuesContext.Provider>
    );
}

export function useHideValues() {
    const context = useContext(HideValuesContext);
    if (!context) {
        throw new Error("useHideValues deve ser usado dentro de HideValuesProvider");
    }
    return context;
}
