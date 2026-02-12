import { z } from "zod";

export const transactionFormSchema = z.object({
    descricao: z.string().min(1, "Descrição é obrigatória"),
    valor: z.string().min(1, "Valor é obrigatório"), // Keeping as string for input handling, parsing later
    categoria: z.string().min(1, "Categoria é obrigatória"),
    data_vencimento: z.date({
        required_error: "Data de vencimento é obrigatória",
    }),
    data_pagamento: z.date().optional(),
    fornecedor_cliente: z.string().min(1, "Fornecedor/Cliente é obrigatório"),
    documento: z.string().optional().default(""),
    conta_bancaria: z.string().min(1, "Conta bancária é obrigatória"),
    metodo_pagamento: z.string().min(1, "Método de pagamento é obrigatório"),
    observacoes: z.string().optional().default(""),
});

export const parceladoFormSchema = z.object({
    descricao: z.string().min(1, "Descrição é obrigatória"),
    valor_total: z.string().min(1, "Valor total é obrigatório"),
    categoria: z.string().min(1, "Categoria é obrigatória"),
    numero_parcelas: z.string().min(1, "Número de parcelas é obrigatório"),
    data_primeiro_vencimento: z.date({
        required_error: "Data do primeiro vencimento é obrigatória",
    }),
    fornecedor_cliente: z.string().min(1, "Fornecedor/Cliente é obrigatório"),
    documento: z.string().optional().default(""),
    conta_bancaria: z.string().min(1, "Conta bancária é obrigatória"),
    observacoes: z.string().optional().default(""),
});

export const transacaoSchema = z.object({
    id: z.string().uuid(),
    descricao: z.string(),
    valor: z.number(),
    data: z.string(), // ISO date string
    categoria: z.string().nullable(),
    status: z.string(),
    data_vencimento: z.string().nullable(),
    data_pagamento: z.string().nullable(),
    fornecedor_cliente: z.string().nullable(),
    documento: z.string().nullable(),
    conta_bancaria: z.string().nullable(),
    metodo_pagamento: z.string().nullable(),
    observacoes: z.string().nullable(),
    parcela_numero: z.number().nullable(),
    parcela_total: z.number().nullable(),
    tipo: z.enum(["despesa", "receita"]),
    created_by: z.string().nullable(),
});

export type TransactionFormSchema = z.infer<typeof transactionFormSchema>;
export type ParceladoFormSchema = z.infer<typeof parceladoFormSchema>;
export type TransacaoSchema = z.infer<typeof transacaoSchema>;
