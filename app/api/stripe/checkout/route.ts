import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import {
  NO_STORE_HEADERS,
  getAppBaseUrl,
  getConfiguredPriceId,
  getStripeServer,
  isBillingCycle,
  isDemoMode,
  isPaidPlanId,
  toSafeStripeError,
} from '@/lib/stripe';
import { PRICING_PLANS } from '@/lib/hashtag-data';
import { DEFAULT_CURRENCY_CODE, getCurrency, getPlanCharge, isSupportedCurrency } from '@/lib/currency';
import { MAX_EMAIL_LENGTH, isValidEmail } from '@/lib/payments-config';

// The Stripe Node SDK needs the Node.js runtime (not Edge).
export const runtime = 'nodejs';

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: NO_STORE_HEADERS });
}

/** Configured Stripe Prices, retrieved once per process (with currency options). */
const priceCache = new Map<string, Promise<Stripe.Price>>();

function retrievePrice(stripe: Stripe, priceId: string): Promise<Stripe.Price> {
  let cached = priceCache.get(priceId);
  if (!cached) {
    cached = stripe.prices.retrieve(priceId, { expand: ['currency_options'] });
    // Don't cache failures: a transient error should not disable the Price forever.
    cached.catch(() => priceCache.delete(priceId));
    priceCache.set(priceId, cached);
  }
  return cached;
}

/**
 * Returns the configured Price id only when it charges exactly what the UI
 * displays (same amount in the selected currency, same interval); otherwise
 * null so the caller falls back to inline price_data.
 */
async function resolveMatchingPriceId(
  stripe: Stripe,
  priceId: string,
  stripeCurrency: string,
  expected: { unitAmountMinor: number; interval: 'month' | 'year' }
): Promise<string | null> {
  let price: Stripe.Price;
  try {
    price = await retrievePrice(stripe, priceId);
  } catch (error) {
    console.warn('[stripe/checkout] could not retrieve configured Price; using inline price_data', priceId, error);
    return null;
  }
  const unitAmount =
    price.currency_options?.[stripeCurrency]?.unit_amount ??
    (price.currency === stripeCurrency ? price.unit_amount : null);
  const interval = price.recurring?.interval ?? null;
  if (unitAmount !== expected.unitAmountMinor || interval !== expected.interval) {
    console.warn(
      `[stripe/checkout] Price ${priceId} mismatch for ${stripeCurrency}: ` +
        `${unitAmount ?? 'none'}/${interval ?? 'none'} vs displayed ${expected.unitAmountMinor}/${expected.interval}; using inline price_data`
    );
    return null;
  }
  return priceId;
}

/**
 * POST /api/stripe/checkout
 * body: { planId: 'pro'|'agency', billingCycle: 'monthly'|'annual', currency?: string, customerEmail?: string }
 *  -> 200 { mode: 'live', url, sessionId }
 *  -> 200 { mode: 'demo', planId, billingCycle, currency, formattedTotal }  (demo mode only)
 *  -> 4xx/5xx { error }
 */
export async function POST(req: NextRequest) {
  // ---- Parse & validate input -------------------------------------------
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid request body.', 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail('Invalid request body.', 400);
  }
  const { planId, billingCycle, currency, customerEmail } = body as Record<string, unknown>;

  if (planId === 'free') {
    return fail('The free plan does not require checkout.', 400);
  }
  if (!isPaidPlanId(planId)) {
    return fail('Invalid plan selected.', 400);
  }
  if (!isBillingCycle(billingCycle)) {
    return fail('Invalid billing cycle.', 400);
  }
  if (currency !== undefined && currency !== null && currency !== '' && !isSupportedCurrency(currency)) {
    return fail('Unsupported currency.', 400);
  }
  const curr = getCurrency(isSupportedCurrency(currency) ? currency : DEFAULT_CURRENCY_CODE);

  let email: string | undefined;
  if (customerEmail !== undefined && customerEmail !== null && customerEmail !== '') {
    if (
      typeof customerEmail !== 'string' ||
      customerEmail.trim().length > MAX_EMAIL_LENGTH ||
      !isValidEmail(customerEmail)
    ) {
      return fail('Please enter a valid email address.', 400);
    }
    email = customerEmail.trim();
  }

  // Single source of truth for the price (same numbers the UI displays).
  const charge = getPlanCharge(planId, billingCycle, curr.code);
  if (!Number.isInteger(charge.unitAmountMinor) || charge.unitAmountMinor <= 0) {
    console.error('[stripe/checkout] computed invalid amount', { planId, billingCycle, currency: curr.code });
    return fail('Unable to price this plan right now.', 500);
  }

  // ---- Demo mode: never touches Stripe, never a real charge -------------
  if (isDemoMode()) {
    return NextResponse.json(
      {
        mode: 'demo',
        planId,
        billingCycle,
        currency: curr.code,
        formattedTotal: charge.formattedTotal,
      },
      { headers: NO_STORE_HEADERS }
    );
  }

  const stripe = getStripeServer();
  if (!stripe) {
    // Production without a valid key: fail closed.
    return fail('Payments are not configured yet.', 503);
  }

  const baseUrl = getAppBaseUrl(req);
  if (!baseUrl) {
    return fail('Payments are not configured yet.', 503);
  }

  // ---- Live Stripe Checkout (subscription) ------------------------------
  const plan = PRICING_PLANS[planId];
  const cycleLabel = billingCycle === 'annual' ? 'Annual' : 'Monthly';
  const metadata = { planId, billingCycle, currency: curr.code };

  // Optional: a pre-created Stripe Price (should be a multi-currency Price so
  // `currency` below can select the matching currency option). Used only when
  // it matches the displayed amount/interval exactly.
  const configuredPriceId = getConfiguredPriceId(planId, billingCycle);
  const priceId = configuredPriceId
    ? await resolveMatchingPriceId(stripe, configuredPriceId, curr.stripeCurrency, charge)
    : null;
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        quantity: 1,
        price_data: {
          currency: curr.stripeCurrency,
          unit_amount: charge.unitAmountMinor,
          recurring: { interval: charge.interval },
          product_data: {
            name: `Hashtagger ${plan.name} (${cycleLabel})`,
            description: plan.summary,
          },
        },
      };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [lineItem],
      ...(priceId ? { currency: curr.stripeCurrency } : {}),
      ...(email ? { customer_email: email } : {}),
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata,
      subscription_data: { metadata },
      // {CHECKOUT_SESSION_ID} must stay literal: Stripe substitutes it.
      success_url: `${baseUrl}/receipt?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
    });

    if (!session.url) {
      console.error('[stripe/checkout] session created without a redirect url', session.id);
      return fail('Unable to start checkout. Please try again.', 502);
    }

    return NextResponse.json(
      { mode: 'live', url: session.url, sessionId: session.id },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error('[stripe/checkout] failed to create session', error);
    const safe = toSafeStripeError(error, 'Unable to start checkout. Please try again.');
    return fail(safe.message, safe.status);
  }
}
