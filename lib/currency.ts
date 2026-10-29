import { PRICING_PLANS, type BillingCycle, type PlanTierId } from '@/lib/hashtag-data';

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  /** Units of this currency per 1 EUR. EUR = 1.0 */
  rateAgainstEUR: number;
  /** Minor-unit exponent Stripe uses for this currency (0 = zero-decimal). */
  stripeDecimals: 0 | 2;
  /** Locale used for Intl.NumberFormat display. */
  locale: string;
  /** ISO 3-letter lowercase code for Stripe. */
  stripeCurrency: string;
}

/**
 * EUR is the baseline. All plan prices live in EUR in PRICING_PLANS and are
 * converted with the static rates below. Converted monthly prices are rounded
 * to whole units so the pricing page shows clean numbers, and the amount
 * charged is always derived from that same rounded display price.
 */
export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateAgainstEUR: 1.0, stripeDecimals: 2, locale: 'de-DE', stripeCurrency: 'eur' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rateAgainstEUR: 1.08, stripeDecimals: 2, locale: 'en-US', stripeCurrency: 'usd' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rateAgainstEUR: 0.85, stripeDecimals: 2, locale: 'en-GB', stripeCurrency: 'gbp' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', rateAgainstEUR: 1.48, stripeDecimals: 2, locale: 'en-CA', stripeCurrency: 'cad' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', rateAgainstEUR: 1.65, stripeDecimals: 2, locale: 'en-AU', stripeCurrency: 'aud' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rateAgainstEUR: 165, stripeDecimals: 0, locale: 'ja-JP', stripeCurrency: 'jpy' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', rateAgainstEUR: 0.95, stripeDecimals: 2, locale: 'de-CH', stripeCurrency: 'chf' },
  // INR is NOT zero-decimal in Stripe: amounts are in paise (1/100 rupee).
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rateAgainstEUR: 90, stripeDecimals: 2, locale: 'en-IN', stripeCurrency: 'inr' },
];

export const DEFAULT_CURRENCY_CODE = 'EUR';

export function isSupportedCurrency(code: unknown): code is string {
  return (
    typeof code === 'string' &&
    SUPPORTED_CURRENCIES.some((c) => c.code === code.toUpperCase())
  );
}

export function getCurrency(code?: string | null): CurrencyConfig {
  if (!code) return SUPPORTED_CURRENCIES[0];
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === code.toUpperCase()) ||
    SUPPORTED_CURRENCIES[0]
  );
}

/** Converts a whole-unit EUR amount to whole units of the target currency. */
export function convertEurAmount(eurAmount: number, targetCode: string): number {
  if (eurAmount === 0) return 0;
  const curr = getCurrency(targetCode);
  if (curr.code === 'EUR') return eurAmount;
  return Math.round(eurAmount * curr.rateAgainstEUR);
}

/** Formats a whole-unit amount that is ALREADY in the target currency. */
export function formatMoney(
  amount: number,
  currencyCode: string = DEFAULT_CURRENCY_CODE,
  options?: { withDecimals?: boolean }
): string {
  const curr = getCurrency(currencyCode);
  const showDecimals = Boolean(options?.withDecimals) && curr.stripeDecimals > 0 && curr.code !== 'JPY';
  return new Intl.NumberFormat(curr.locale, {
    style: 'currency',
    currency: curr.code,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

/** Formats a Stripe minor-unit amount (e.g. cents) in the given currency. */
export function formatMinorAmount(minorAmount: number, currencyCode: string): string {
  const curr = getCurrency(currencyCode);
  const major = curr.stripeDecimals === 0 ? minorAmount : minorAmount / 100;
  return formatMoney(major, curr.code, { withDecimals: true });
}

/**
 * Converts a whole-unit EUR amount and formats it in the target currency.
 * formatCurrencyPrice(19, 'EUR') -> "19 €" (de-DE) ; formatCurrencyPrice(19, 'USD') -> "$21"
 */
export function formatCurrencyPrice(
  eurAmount: number,
  targetCode: string = DEFAULT_CURRENCY_CODE,
  options?: { withDecimals?: boolean; suffix?: string }
): string {
  const formatted = formatMoney(convertEurAmount(eurAmount, targetCode), targetCode, options);
  return options?.suffix ? `${formatted} ${options.suffix}` : formatted;
}

/** Whole units -> Stripe minor units for the currency. */
export function toStripeMinor(amount: number, currencyCode: string): number {
  const curr = getCurrency(currencyCode);
  return curr.stripeDecimals === 0 ? Math.round(amount) : Math.round(amount * 100);
}

/** @deprecated use getPlanCharge(). Kept for callers that pass a raw EUR amount. */
export function getStripeAmount(eurAmount: number, targetCode: string): number {
  return toStripeMinor(convertEurAmount(eurAmount, targetCode), targetCode);
}

export interface PlanCharge {
  planId: PlanTierId;
  billingCycle: BillingCycle;
  currency: string;
  /** Per-month price shown on the pricing cards, whole units of `currency`. */
  perMonth: number;
  /** Amount charged per billing interval, whole units (perMonth × 12 for annual). */
  total: number;
  /** Stripe unit_amount (minor units) for one billing interval. */
  unitAmountMinor: number;
  /** Stripe recurring interval. */
  interval: 'month' | 'year';
  formattedPerMonth: string;
  formattedTotal: string;
}

/**
 * Single source of truth for what a plan costs in a currency.
 * The pricing UI, paywall modal, checkout route and receipt must all use this
 * so the displayed price always equals the charged price.
 */
export function getPlanCharge(
  planId: PlanTierId,
  billingCycle: BillingCycle,
  currencyCode: string = DEFAULT_CURRENCY_CODE
): PlanCharge {
  const plan = PRICING_PLANS[planId];
  const curr = getCurrency(currencyCode);
  const eurPerMonth = billingCycle === 'annual' ? plan.annualPricePerMonth : plan.monthlyPrice;
  const perMonth = convertEurAmount(eurPerMonth, curr.code);
  const total = billingCycle === 'annual' ? perMonth * 12 : perMonth;
  return {
    planId,
    billingCycle,
    currency: curr.code,
    perMonth,
    total,
    unitAmountMinor: toStripeMinor(total, curr.code),
    interval: billingCycle === 'annual' ? 'year' : 'month',
    formattedPerMonth: formatMoney(perMonth, curr.code),
    formattedTotal: formatMoney(total, curr.code, { withDecimals: true }),
  };
}
