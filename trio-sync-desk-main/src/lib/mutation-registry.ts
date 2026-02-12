import { createTransaction, createParceladoTransaction, updateTransaction, deleteTransaction } from "@/features/financeiro/api/transactions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutationFn = (variables: any) => Promise<void>;

export const mutationRegistry: Record<string, MutationFn> = {
    "createTransaction": createTransaction,
    "createParceladoTransaction": createParceladoTransaction,
    "updateTransaction": updateTransaction,
    "deleteTransaction": deleteTransaction,
};

export const getMutationFn = (key: string): MutationFn | undefined => {
    return mutationRegistry[key];
};
