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
import { AtendimentoFormData } from "../types";
import { useClientes } from "@/features/clientes/hooks/useClientes";

interface AtendimentoFormDialogProps {
    onSubmit: (data: AtendimentoFormData) => void;
    isLoading: boolean;
}

export function AtendimentoFormDialog({ onSubmit, isLoading }: AtendimentoFormDialogProps) {
    const [open, setOpen] = useState(false);
    const { clientes } = useClientes();
    const [formData, setFormData] = useState<AtendimentoFormData>({
        cliente_id: "",
        cliente_nome: "",
        cliente_contato: "",
        tipo_solicitacao: "",
        descricao: "",
    });

    // Quando selecionar um cliente, preencher automaticamente nome e contato
    const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const clienteId = e.target.value;
        const cliente = clientes?.find(c => c.id === clienteId);

        if (cliente) {
            setFormData({
                ...formData,
                cliente_id: clienteId,
                cliente_nome: cliente.nome,
                cliente_contato: cliente.telefone || cliente.email || "",
            });
        } else {
            // "novo" - limpar campos para permitir digitação manual
            setFormData({
                ...formData,
                cliente_id: "",
                cliente_nome: "",
                cliente_contato: "",
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        setOpen(false);
        setFormData({
            cliente_id: "",
            cliente_nome: "",
            cliente_contato: "",
            tipo_solicitacao: "",
            descricao: "",
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Atendimento
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Atendimento</DialogTitle>
                    <DialogDescription>
                        Selecione um cliente existente ou cadastre um novo
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="cliente_select">Cliente</Label>
                        <select
                            id="cliente_select"
                            value={formData.cliente_id || "novo"}
                            onChange={handleClienteChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="novo">+ Novo Cliente (digitar manualmente)</option>
                            {clientes?.map((cliente) => (
                                <option key={cliente.id} value={cliente.id}>
                                    {cliente.nome} - {cliente.telefone || cliente.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cliente_nome">Nome do Cliente</Label>
                        <Input
                            id="cliente_nome"
                            value={formData.cliente_nome}
                            onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                            disabled={!!formData.cliente_id}
                            required
                            placeholder={formData.cliente_id ? "Preenchido automaticamente" : "Digite o nome"}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cliente_contato">Contato</Label>
                        <Input
                            id="cliente_contato"
                            value={formData.cliente_contato}
                            onChange={(e) => setFormData({ ...formData, cliente_contato: e.target.value })}
                            disabled={!!formData.cliente_id}
                            required
                            placeholder={formData.cliente_id ? "Preenchido automaticamente" : "Telefone ou email"}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tipo_solicitacao">Tipo de Solicitação</Label>
                        <Select
                            value={formData.tipo_solicitacao}
                            onValueChange={(value) => setFormData({ ...formData, tipo_solicitacao: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="financiamento_imovel">Financiamento Imobiliário</SelectItem>
                                <SelectItem value="financiamento_auto">Financiamento de Automóvel</SelectItem>
                                <SelectItem value="credito_pessoal">Crédito Pessoal</SelectItem>
                                <SelectItem value="consorcio">Consórcio</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                            id="descricao"
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            placeholder="Detalhes do atendimento..."
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Criando..." : "Criar Atendimento"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
