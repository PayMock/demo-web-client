import { useAuthStore } from '@/stores/auth';

/**
 * Returns true only if value can be converted to a finite, non-NaN number.
 * Rejects null, undefined, empty strings, and NaN.
 */
export function isValidNumber(value: unknown): boolean {
    if (value === null || value === undefined || value === '') {
        return false;
    }

    const converted = Number(value);

    if (isNaN(converted)) {
        return false;
    }

    if (!isFinite(converted)) {
        return false;
    }

    return true;
}

/**
 * Formats a value as a currency string.
 *
 * - Accepts any value type.
 * - Non-numeric values are treated as 0.00.
 * - Currency is read from the authenticated project (project.currency).
 *   Falls back to 'BRL' until the API returns the currency field.
 */
export function formatCurrency(value: unknown): string {
    const auth = useAuthStore();

    if (Array.isArray(value)) {
        value = value.reduce((a: number, i: any) => a + (i?.amount || 0), 0);
    }

    // TODO: replace with auth.project?.currency once the API returns this field
    const currency: string = (auth.project as any)?.currency ?? 'BRL';

    const numeric = isValidNumber(value) ? Number(value) : 0;

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
    }).format(numeric);
}
