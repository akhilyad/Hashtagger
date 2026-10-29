/**
 * Server-only Stripe helpers. Import this module ONLY from route handlers or
 * other server code: it reads STRIPE_SECRET_KEY and wraps the Node Stripe SDK.
 * (The `server-only` guard package is not installed in this project, so the
 * boundary is enforced by convention: no client component imports this file.)
 */
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/** Real Stripe secret (sk_test_/sk_live_) or restricted (rk_test_/rk_live_) key. */
const SECRET_KEY_PATTERN = /^(sk|rk)_(test|live)_[A-Za-z0-9]{10,}/;

function getSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key && SECRET_KEY_PATTERN.test(key) ? key : null;
}

/** True only for a real-looking key; placeholders such as "sk_test_..." are rejected. */
export function isStripeConfigured(): boolean {
  return getSecretKey() !== null;
}

/**
 * Demo mode: no real charge is ever attempted. On when STRIPE_DEMO_MODE=true,
 * or automatically in development when no valid secret key is set.
 * Never enabled implicitly in production, and never at all in production with
 * a live key (STRIPE_DEMO_MODE would otherwise hand out paid plans for free).
 */
let warnedDemoWithLiveKey = false;

export function isDemoMode(): boolean {
  if (process.env.STRIPE_DEMO_MODE === 'true') {
    const key = getSecretKey();
    const isLiveKey = key !== null && /^(sk|rk)_live_/.test(key);
    if (process.env.NODE_ENV === 'production' && isLiveKey) {
      if (!warnedDemoWithLiveKey) {
        warnedDemoWithLiveKey = true;
        console.error('[stripe] STRIPE_DEMO_MODE=true is ignored in production with a live Stripe key');
      }
      return false;
    }
    return true;
  }
  return !isStripeConfigured() && process.env.NODE_ENV !== 'production';
}

/**
 * Server-side Stripe client. Uses the API version pinned by the installed SDK
 * (stripe@23 -> '2026-09-30.endive'), so request shapes always match its types.
 */
export function getStripeServer(): Stripe | null {
  const secretKey = getSecretKey();
  if (!secretKey) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      appInfo: { name: 'Hashtagger' },
      maxNetworkRetries: 2,
    });
  }
  return stripeClient;
}

/**
 * Canonical absolute base URL (origin + base path, no trailing slash) used for
 * Stripe success/cancel redirects. Comes from server config only: APP_URL, or
 * the request's own URL outside production. The client-controlled Origin
 * header is never trusted. Returns null when it cannot be determined safely.
 */
export function getAppBaseUrl(req: { nextUrl: { origin: string } }): string | null {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');
  const configured = process.env.APP_URL?.trim();

  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        const base = `${url.origin}${url.pathname}`.replace(/\/+$/, '');
        // Avoid doubling the base path if APP_URL already includes it.
        return basePath && base.endsWith(basePath) ? base : `${base}${basePath}`;
      }
    } catch {
      // fall through: invalid APP_URL
    }
    if (process.env.NODE_ENV === 'production') {
      console.error('[stripe] APP_URL is not a valid absolute http(s) URL');
      return null;
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    return `${req.nextUrl.origin}${basePath}`;
  }

  console.error('[stripe] APP_URL must be set in production');
  return null;
}

// ---------------------------------------------------------------------------
// Shared request validation for the /api/stripe/* route handlers
// ---------------------------------------------------------------------------

export const PAID_PLAN_IDS = ['pro', 'agency'] as const;
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export const BILLING_CYCLES = ['monthly', 'annual'] as const;

const PAID_PLAN_LOOKUP: Record<PaidPlanId, true> = { pro: true, agency: true };
const BILLING_CYCLE_LOOKUP: Record<(typeof BILLING_CYCLES)[number], true> = {
  monthly: true,
  annual: true,
};

/** Own-property check, so prototype keys like 'constructor' or '__proto__' never match. */
export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PAID_PLAN_LOOKUP, value);
}

export function isBillingCycle(value: unknown): value is (typeof BILLING_CYCLES)[number] {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(BILLING_CYCLE_LOOKUP, value);
}

/** Optional Stripe Price override, e.g. STRIPE_PRICE_PRO_ANNUAL=price_123. */
export function getConfiguredPriceId(planId: PaidPlanId, billingCycle: 'monthly' | 'annual'): string | null {
  const name = `STRIPE_PRICE_${planId.toUpperCase()}_${billingCycle.toUpperCase()}`;
  const value = process.env[name]?.trim();
  if (!value) return null;
  if (!/^price_[A-Za-z0-9]+$/.test(value)) {
    console.error(`[stripe] ${name} is set but is not a valid Price id; using inline price_data`);
    return null;
  }
  return value;
}

/** Headers for every payment API response: never cache. */
export const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const;

/**
 * Maps any thrown error to a user-safe message + HTTP status. Stripe internals
 * (key fragments, request ids, raw API messages) never reach the client;
 * callers log the original error server-side.
 */
export function toSafeStripeError(
  error: unknown,
  fallback = 'Something went wrong with the payment request. Please try again.'
): { message: string; status: number } {
  if (error instanceof Stripe.errors.StripeConnectionError) {
    return { message: 'Could not reach the payment provider. Please try again in a moment.', status: 502 };
  }
  if (error instanceof Stripe.errors.StripeRateLimitError) {
    return { message: 'Too many payment requests right now. Please wait a moment and retry.', status: 429 };
  }
  if (
    error instanceof Stripe.errors.StripeAuthenticationError ||
    error instanceof Stripe.errors.StripePermissionError
  ) {
    return { message: 'Payments are temporarily unavailable.', status: 503 };
  }
  return { message: fallback, status: 500 };
}
