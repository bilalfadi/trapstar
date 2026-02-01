// Single currency: USD (Dollar) only
export const CURRENCY_RATES: Record<string, number> = {
  USD: 1.0,
}

export const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$' },
]

export interface CurrencyInfo {
  code: string
  symbol: string
  rate: number
}

export function getCurrencyInfo(_countryCode?: string): CurrencyInfo {
  return {
    code: 'USD',
    symbol: '$',
    rate: 1.0,
  }
}

export function convertPrice(price: number, _fromCurrency: string = 'USD', _toCurrency: string = 'USD'): number {
  return price
}

export function formatPrice(price: number, currency: string, symbol: string): string {
  const roundedPrice = Math.round(price * 100) / 100
  return `${symbol}${roundedPrice.toFixed(2)}`
}
