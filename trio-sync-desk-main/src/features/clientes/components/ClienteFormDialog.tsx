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
import { Plus } from "lucide-react";
import { ClienteFormData } from "../types";

interface ClienteFormDialogProps {
    onSubmit: (data: ClienteFormData) => void;
    isLoading: boolean;
}

export function ClienteFormDialog({ onSubmit, isLoading }: ClienteFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<ClienteFormData>({
        nome: "",
        cpf: "",
        nis: "",
        data_nascimento: "",
        telefone: "",
        email: "",
        endereco: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        setOpen(false);
        setFormData({
            nome: "",
            cpf: "",
            nis: "",
            data_nascimento: "",
            telefone: "",
            email: "",
            endereco: "",
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Cliente
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Novo Cliente</DialogTitle>
                    <DialogDescription>
                        Preencha os dados do novo cliente
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nome">Nome completo</Label>
                        <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                            id="cpf"
                            value={formData.cpf}
                            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nis">Nº Cadastro / NIS</Label>
                        <Input
                            id="nis"
                            value={formData.nis}
                            onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                            placeholder="Número de Cadastro ou NIS"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                        <Input
                            id="data_nascimento"
                            type="date"
                            value={formData.data_nascimento}
                            onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                            id="telefone"
                            value={formData.telefone}
                            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endereco">Endereço</Label>
                        <Textarea
                            id="endereco"
                            value={formData.endereco}
                            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Cadastrando..." : "Cadastrar Cliente"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
