export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateAgainstEUR: number; // EUR = 1.0
  decimals: number;
  stripeCurrency: string; // ISO 3-letter lowercase for Stripe
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: 'EUR',
    name: 'Euro (Primary)',
    symbol: '€',
    flag: '🇪🇺',
    rateAgainstEUR: 1.0,
    decimals: 2,
    stripeCurrency: 'eur',
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    rateAgainstEUR: 1.08,
    decimals: 2,
    stripeCurrency: 'usd',
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    rateAgainstEUR: 0.85,
    decimals: 2,
    stripeCurrency: 'gbp',
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    flag: '🇨🇦',
    rateAgainstEUR: 1.48,
    decimals: 2,
    stripeCurrency: 'cad',
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    rateAgainstEUR: 1.65,
    decimals: 2,
    stripeCurrency: 'aud',
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    rateAgainstEUR: 165,
    decimals: 0,
    stripeCurrency: 'jpy',
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF ',
    flag: '🇨🇭',
    rateAgainstEUR: 0.95,
    decimals: 2,
    stripeCurrency: 'chf',
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    rateAgainstEUR: 90,
    decimals: 0,
    stripeCurrency: 'inr',
  },
];

export const DEFAULT_CURRENCY_CODE = 'EUR';

export function getCurrency(code?: string): CurrencyConfig {
  if (!code) return SUPPORTED_CURRENCIES[0];
  const found = SUPPORTED_CURRENCIES.find(
    (c) => c.code.toUpperCase() === code.toUpperCase()
  );
  return found || SUPPORTED_CURRENCIES[0];
}

/**
 * Converts a base EUR amount to the target currency amount.
 * Rounds to nice integer if appropriate or standard decimal representation.
 */
export function convertEurAmount(eurAmount: number, targetCode: string): number {
  if (eurAmount === 0) return 0;
  const curr = getCurrency(targetCode);
  if (curr.code === 'EUR') return eurAmount;
  
  const converted = eurAmount * curr.rateAgainstEUR;
  if (curr.decimals === 0) {
    return Math.round(converted);
  }
  return Math.round(converted);
}

/**
 * Formats a base EUR amount into the target currency display string.
 * Example:
 * formatCurrencyPrice(19, 'EUR') -> "€19"
 * formatCurrencyPrice(19, 'USD') -> "$21"
 * formatCurrencyPrice(19, 'EUR', { withDecimals: true }) -> "€19.00"
 */
export function formatCurrencyPrice(
  eurAmount: number,
  targetCode: string = DEFAULT_CURRENCY_CODE,
  options?: { withDecimals?: boolean; suffix?: string }
): string {
  const curr = getCurrency(targetCode);
  const converted = convertEurAmount(eurAmount, targetCode);
  
  let formattedNumber: string;
  if (options?.withDecimals) {
    formattedNumber = curr.decimals === 0 ? `${converted}` : converted.toFixed(2);
  } else {
    formattedNumber = `${converted}`;
  }

  const suffix = options?.suffix ? ` ${options.suffix}` : '';
  return `${curr.symbol}${formattedNumber}${suffix}`;
}

/**
 * Calculates line items and Stripe amounts in cents/smallest units.
 * For example:
 * EUR 19 -> 1900 cents
 * JPY 3135 -> 3135 (zero-decimal currency)
 */
export function getStripeAmount(eurAmount: number, targetCode: string): number {
  const curr = getCurrency(targetCode);
  const converted = convertEurAmount(eurAmount, targetCode);
  if (curr.decimals === 0) {
    return Math.round(converted);
  }
  return Math.round(converted * 100);
}

