import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useLeads } from "../hooks/useLeads";

const leadSchema = z.object({
    nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    whatsapp: z.string().optional(),
    instagram_handle: z.string().optional(),
    tipo_credito: z.string().min(1, "Selecione o tipo de crédito"),
    valor_desejado: z.string().optional().transform((val) => (val ? Number(val) : 0)),
});

export const CreateLeadDialog: React.FC = () => {
    const { createLead } = useLeads();
    const [open, setOpen] = React.useState(false);

    const form = useForm<z.infer<typeof leadSchema>>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            nome: "",
            whatsapp: "",
            instagram_handle: "",
            tipo_credito: "consorcio",
            valor_desejado: 0 as any,
        },
    });

    const onSubmit = (values: z.infer<typeof leadSchema>) => {
        createLead({
            ...values,
            status: "Novo Lead",
            origem: "Manual",
        });
        setOpen(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Lead
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cadastrar Novo Lead</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome Completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome do lead" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="whatsapp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>WhatsApp</FormLabel>
                                        <FormControl>
                                            <Input placeholder="(00) 00000-0000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="instagram_handle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Instagram (@)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="usuario" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="tipo_credito"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Crédito</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="consorcio">Consórcio</SelectItem>
                                            <SelectItem value="financiamento">Financiamento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="valor_desejado"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor da Carta/Crédito</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">Salvar Lead</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
