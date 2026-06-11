export const CURRENCY_SYMBOL = '€'
export const CURRENCY_CODE = 'EUR'

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return `${Number(amount).toFixed(2)} ${CURRENCY_SYMBOL}`
}

export function formatCurrencyShort(amount: number): string {
  return `${CURRENCY_SYMBOL}${Number(amount).toFixed(2)}`
}
