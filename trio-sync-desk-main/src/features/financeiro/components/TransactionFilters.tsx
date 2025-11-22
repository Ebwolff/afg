import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TransactionFiltersProps {
    statusFilter: string;
    setStatusFilter: (value: string) => void;
}

export function TransactionFilters({ statusFilter, setStatusFilter }: TransactionFiltersProps) {
    return (
        <div className="mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="pago">Pagas</SelectItem>
                    <SelectItem value="cancelado">Canceladas</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
