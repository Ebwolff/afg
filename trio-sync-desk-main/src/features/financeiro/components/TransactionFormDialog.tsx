import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TransactionFormData } from "../types";

interface TransactionFormDialogProps {
    onSubmit: (data: TransactionFormData) => void;
    isLoading: boolean;
    type: "receita" | "despesa";
}

export function TransactionFormDialog({ onSubmit, isLoading, type }: TransactionFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<TransactionFormData>({
        descricao: "",
        valor: "",
        categoria: "",
        data_vencimento: new Date(),
        fornecedor_cliente: "",
        documento: "",
        conta_bancaria: "",
        metodo_pagamento: "",
        observacoes: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        setOpen(false);
        setFormData({
            descricao: "",
            valor: "",
            categoria: "",
            data_vencimento: new Date(),
            fornecedor_cliente: "",
            documento: "",
            conta_bancaria: "",
            metodo_pagamento: "",
            observacoes: "",
        });
    };

    const title = type === "receita" ? "Nova Conta a Receber" : "Nova Conta a Pagar";
    const description = type === "receita" ? "Adicione uma nova conta a receber" : "Adicione uma nova conta a pagar";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Conta
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="descricao">Descrição</Label>
                            <Input
                                id="descricao"
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="valor">Valor</Label>
                                <Input
                                    id="valor"
                                    type="number"
                                    step="0.01"
                                    value={formData.valor}
                                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="categoria">Categoria</Label>
                                <Input
                                    id="categoria"
                                    value={formData.categoria}
                                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Data de Vencimento</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("justify-start text-left font-normal", !formData.data_vencimento && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.data_vencimento ? format(formData.data_vencimento, "PPP", { locale: ptBR }) : "Selecione uma data"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.data_vencimento}
                                        onSelect={(date) => date && setFormData({ ...formData, data_vencimento: date })}
                                        initialFocus
                                        className="pointer-events-auto"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="cliente">{type === "receita" ? "Cliente" : "Fornecedor"}</Label>
                                <Input
                                    id="cliente"
                                    value={formData.fornecedor_cliente}
                                    onChange={(e) => setFormData({ ...formData, fornecedor_cliente: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="documento">Documento/NF</Label>
                                <Input
                                    id="documento"
                                    value={formData.documento}
                                    onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="conta">Conta Bancária</Label>
                                <Input
                                    id="conta"
                                    value={formData.conta_bancaria}
                                    onChange={(e) => setFormData({ ...formData, conta_bancaria: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="metodo">Método de Pagamento</Label>
                                <Select value={formData.metodo_pagamento} onValueChange={(value) => setFormData({ ...formData, metodo_pagamento: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="boleto">Boleto</SelectItem>
                                        <SelectItem value="pix">PIX</SelectItem>
                                        <SelectItem value="transferencia">Transferência</SelectItem>
                                        <SelectItem value="cartao">Cartão</SelectItem>
                                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="observacoes">Observações</Label>
                            <Textarea
                                id="observacoes"
                                value={formData.observacoes}
                                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
