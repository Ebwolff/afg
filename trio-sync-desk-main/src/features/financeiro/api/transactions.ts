import { supabase } from "@/integrations/supabase/client";
import { TransactionFormData, ParceladoFormData, Transacao } from "../types";

import { transactionFormSchema, parceladoFormSchema, updateTransactionSchema } from "../schemas";
import { handleSupabaseError } from "@/integrations/supabase/error-handler";

export const createTransaction = async (newTransacao: TransactionFormData & { tipo: "receita" | "despesa", created_by?: string }) => {
    const validatedData = transactionFormSchema.parse(newTransacao);

    let userId = newTransacao.created_by;
    if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
    }

    const payload = {
        descricao: validatedData.descricao,
        valor: parseFloat(validatedData.valor),
        categoria: validatedData.categoria,
        data_vencimento: validatedData.data_vencimento.toISOString(),
        fornecedor_cliente: validatedData.fornecedor_cliente,
        documento: validatedData.documento || null,
        conta_bancaria: validatedData.conta_bancaria,
        metodo_pagamento: validatedData.metodo_pagamento,
        observacoes: validatedData.observacoes || null,
        tipo: newTransacao.tipo,
        status: "pendente",
        created_by: userId,
        data: new Date().toISOString(),
    };

    const { error } = await supabase.from("transacoes").insert(payload);
    handleSupabaseError(error, "Erro ao criar transação");
};

export const createParceladoTransaction = async (data: ParceladoFormData & { type: "receita" | "despesa", created_by?: string }) => {
    const validatedData = parceladoFormSchema.parse(data);

    let userId = data.created_by;
    if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
    }

    const valorParcela = parseFloat(validatedData.valor_total) / parseInt(validatedData.numero_parcelas);
    const parcelas = [];

    const numeroParcelas = parseInt(validatedData.numero_parcelas);

    for (let i = 0; i < numeroParcelas; i++) {
        const dataVencimento = new Date(validatedData.data_primeiro_vencimento);
        dataVencimento.setMonth(dataVencimento.getMonth() + i);

        parcelas.push({
            descricao: validatedData.descricao,
            valor: valorParcela,
            categoria: validatedData.categoria,
            data_vencimento: dataVencimento.toISOString(),
            fornecedor_cliente: validatedData.fornecedor_cliente,
            documento: validatedData.documento || null,
            conta_bancaria: validatedData.conta_bancaria,
            observacoes: validatedData.observacoes || null,
            parcela_numero: i + 1,
            parcela_total: numeroParcelas,
            tipo: data.type,
            status: "pendente",
            created_by: userId,
            data: new Date().toISOString(),
            metodo_pagamento: null,
            data_pagamento: null
        });
    }

    const { error } = await supabase.from("transacoes").insert(parcelas);
    handleSupabaseError(error, "Erro ao criar transações parceladas");
};

export const updateTransaction = async ({ id, ...updates }: Partial<Transacao> & { id: string }) => {
    const validatedUpdates = updateTransactionSchema.parse(updates);

    const { error } = await supabase
        .from("transacoes")
        .update(validatedUpdates)
        .eq("id", id);
    handleSupabaseError(error, "Erro ao atualizar transação");
};

export const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from("transacoes").delete().eq("id", id);
    handleSupabaseError(error, "Erro ao excluir transação");
};
