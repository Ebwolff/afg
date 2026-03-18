import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, DollarSign, CheckSquare, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
    type: "cliente" | "transacao" | "tarefa";
    id: string;
    title: string;
    subtitle: string;
    route: string;
}

export function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const search = useCallback(async (term: string) => {
        if (term.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        const allResults: SearchResult[] = [];

        try {
            // Buscar clientes
            const { data: clientes } = await supabase
                .from("clientes")
                .select("id, nome, email")
                .or(`nome.ilike.%${term}%,email.ilike.%${term}%`)
                .limit(5);

            if (clientes) {
                allResults.push(
                    ...clientes.map((c) => ({
                        type: "cliente" as const,
                        id: c.id,
                        title: c.nome,
                        subtitle: c.email || "Sem email",
                        route: "/clientes",
                    }))
                );
            }

            // Buscar transações
            const { data: transacoes } = await supabase
                .from("transacoes")
                .select("id, descricao, fornecedor_cliente, tipo")
                .or(`descricao.ilike.%${term}%,fornecedor_cliente.ilike.%${term}%`)
                .limit(5);

            if (transacoes) {
                allResults.push(
                    ...transacoes.map((t) => ({
                        type: "transacao" as const,
                        id: t.id,
                        title: t.descricao || "Transação",
                        subtitle: t.fornecedor_cliente || t.tipo,
                        route: t.tipo === "receita" ? "/contas-receber" : "/contas-pagar",
                    }))
                );
            }

            // Buscar tarefas
            const { data: tarefas } = await supabase
                .from("tarefas")
                .select("id, titulo, descricao")
                .or(`titulo.ilike.%${term}%,descricao.ilike.%${term}%`)
                .limit(5);

            if (tarefas) {
                allResults.push(
                    ...tarefas.map((t) => ({
                        type: "tarefa" as const,
                        id: t.id,
                        title: t.titulo,
                        subtitle: t.descricao?.substring(0, 50) || "Sem descrição",
                        route: "/tarefas",
                    }))
                );
            }
        } catch {
            // silently fail
        }

        setResults(allResults);
        setIsOpen(allResults.length > 0);
        setLoading(false);
    }, []);

    const handleChange = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(value), 300);
    };

    const handleSelect = (result: SearchResult) => {
        navigate(result.route);
        setQuery("");
        setResults([]);
        setIsOpen(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "cliente": return <Users className="h-4 w-4 text-blue-500" />;
            case "transacao": return <DollarSign className="h-4 w-4 text-green-500" />;
            case "tarefa": return <CheckSquare className="h-4 w-4 text-orange-500" />;
            default: return <Search className="h-4 w-4" />;
        }
    };

    const getLabel = (type: string) => {
        switch (type) {
            case "cliente": return "Cliente";
            case "transacao": return "Transação";
            case "tarefa": return "Tarefa";
            default: return "";
        }
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-sm">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Buscar clientes, transações, tarefas..."
                    className="pl-9 pr-8 h-9 text-sm bg-muted/50"
                    value={query}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setResults([]); setIsOpen(false); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
                    ) : (
                        results.map((result) => (
                            <button
                                key={`${result.type}-${result.id}`}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/10 transition-colors border-b last:border-0"
                                onClick={() => handleSelect(result)}
                            >
                                {getIcon(result.type)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{result.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                                    {getLabel(result.type)}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
