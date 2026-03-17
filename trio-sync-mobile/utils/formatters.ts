/**
 * Utilitários de formatação para o app mobile
 */

/**
 * Formata um número para o padrão de moeda brasileira
 * @param value - Valor numérico a ser formatado
 * @returns String formatada no padrão "R$ 52.354,25"
 */
export function formatCurrency(value: number): string {
    if (value === null || value === undefined || isNaN(value)) {
        return 'R$ 0,00';
    }

    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Formata uma data para o padrão brasileiro
 * @param date - String de data ou objeto Date
 * @returns String formatada no padrão "DD/MM/AAAA"
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';

    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('pt-BR');
    } catch {
        return '-';
    }
}

/**
 * Formata um número compacto para exibição em cards
 * @param value - Valor numérico
 * @returns String formatada compacta (ex: 52.3K)
 */
export function formatCompactNumber(value: number): string {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
}

/**
 * Formata CPF no padrão brasileiro
 * @param cpf - String com números do CPF
 * @returns CPF formatado "000.000.000-00"
 */
export function formatCPF(cpf: string | null | undefined): string {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata telefone no padrão brasileiro
 * @param phone - String com números do telefone
 * @returns Telefone formatado "(00) 00000-0000"
 */
export function formatPhone(phone: string | null | undefined): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
}
