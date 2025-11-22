import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ParceladoFormData } from "../types";

interface ParceladoFormDialogProps {
    onSubmit: (data: ParceladoFormData) => void;
    isLoading: boolean;
    type: "receita" | "despesa";
}

export function ParceladoFormDialog({ onSubmit, isLoading, type }: ParceladoFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<ParceladoFormData>({
        descricao: "",
        valor_total: "",
        categoria: "",
        numero_parcelas: "",
        data_primeiro_vencimento: new Date(),
        fornecedor_cliente: "",
        documento: "",
        conta_bancaria: "",
        observacoes: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        setOpen(false);
        setFormData({
            descricao: "",
            valor_total: "",
            categoria: "",
            numero_parcelas: "",
            data_primeiro_vencimento: new Date(),
            fornecedor_cliente: "",
            documento: "",
            conta_bancaria: "",
            observacoes: "",
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Conta Parcelada
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Nova {type === "receita" ? "Receita" : "Despesa"} Parcelada</DialogTitle>
                        <DialogDescription>Crie múltiplas parcelas automaticamente</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="descricao-p">Descrição</Label>
                            <Input
                                id="descricao-p"
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="valor-total">Valor Total</Label>
                                <Input
                                    id="valor-total"
                                    type="number"
                                    step="0.01"
                                    value={formData.valor_total}
                                    onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="numero-parcelas">Número de Parcelas</Label>
                                <Input
                                    id="numero-parcelas"
                                    type="number"
                                    min="2"
                                    value={formData.numero_parcelas}
                                    onChange={(e) => setFormData({ ...formData, numero_parcelas: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Primeiro Vencimento</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("justify-start text-left font-normal", !formData.data_primeiro_vencimento && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.data_primeiro_vencimento ? format(formData.data_primeiro_vencimento, "PPP", { locale: ptBR }) : "Selecione uma data"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.data_primeiro_vencimento}
                                        onSelect={(date) => date && setFormData({ ...formData, data_primeiro_vencimento: date })}
                                        initialFocus
                                        className="pointer-events-auto"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="cliente-p">{type === "receita" ? "Cliente" : "Fornecedor"}</Label>
                                <Input
                                    id="cliente-p"
                                    value={formData.fornecedor_cliente}
                                    onChange={(e) => setFormData({ ...formData, fornecedor_cliente: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="categoria-p">Categoria</Label>
                                <Input
                                    id="categoria-p"
                                    value={formData.categoria}
                                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="observacoes-p">Observações</Label>
                            <Textarea
                                id="observacoes-p"
                                value={formData.observacoes}
                                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Criando..." : "Criar Parcelas"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
