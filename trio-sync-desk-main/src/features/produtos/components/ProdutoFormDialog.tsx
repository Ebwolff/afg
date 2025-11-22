import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { ProdutoFormData } from "../types";

interface ProdutoFormDialogProps {
    onSubmit: (data: ProdutoFormData) => void;
    isLoading: boolean;
}

export function ProdutoFormDialog({ onSubmit, isLoading }: ProdutoFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<ProdutoFormData>({
        nome: "",
        descricao: "",
        categoria: "",
        tipo: "produto",
        valor_base: "",
        comissao_percentual: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        setOpen(false);
        setFormData({
            nome: "",
            descricao: "",
            categoria: "",
            tipo: "produto",
            valor_base: "",
            comissao_percentual: "",
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Produto/Serviço
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Cadastrar Produto/Serviço</DialogTitle>
                    <DialogDescription>
                        Adicione um novo produto ou serviço ao portfólio da AFG
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome *</Label>
                            <Input
                                id="nome"
                                required
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tipo">Tipo *</Label>
                            <Select
                                value={formData.tipo}
                                onValueChange={(value: "produto" | "servico") => setFormData({ ...formData, tipo: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="produto">Produto</SelectItem>
                                    <SelectItem value="servico">Serviço</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="categoria">Categoria *</Label>
                        <Select
                            value={formData.categoria}
                            onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cartas_credito">Cartas de Crédito</SelectItem>
                                <SelectItem value="financiamentos">Financiamentos</SelectItem>
                                <SelectItem value="consignados">Consignados</SelectItem>
                                <SelectItem value="venda_imoveis">Venda de Imóveis</SelectItem>
                                <SelectItem value="aluguel_imoveis">Aluguel de Imóveis</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                            id="descricao"
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="valor_base">Valor Base (R$)</Label>
                            <Input
                                id="valor_base"
                                type="number"
                                step="0.01"
                                value={formData.valor_base}
                                onChange={(e) => setFormData({ ...formData, valor_base: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="comissao_percentual">Comissão (%)</Label>
                            <Input
                                id="comissao_percentual"
                                type="number"
                                step="0.01"
                                value={formData.comissao_percentual}
                                onChange={(e) => setFormData({ ...formData, comissao_percentual: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Cadastrando..." : "Cadastrar"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
