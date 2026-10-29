import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  NO_STORE_HEADERS,
  getStripeServer,
  isBillingCycle,
  isPaidPlanId,
  toSafeStripeError,
} from '@/lib/stripe';
import { formatMinorAmount, getCurrency, isSupportedCurrency } from '@/lib/currency';

export const runtime = 'nodejs';

const SESSION_ID_PATTERN = /^cs_(test|live)_[A-Za-z0-9]+$/;

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: NO_STORE_HEADERS });
}

/**
 * POST /api/stripe/session  body: { sessionId }
 * Verifies a Checkout Session with Stripe before the client grants a plan.
 *  -> 200 { id, planId, billingCycle, currency, amountTotal, formattedTotal, customerEmail, subscriptionId }
 *  (customerEmail is always null: the payer email is never returned)
 *  -> 402 when the session is not paid or the subscription is not active/trialing; other 4xx/5xx { error }
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid request body.', 400);
  }
  const sessionId =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>).sessionId
      : undefined;
  if (typeof sessionId !== 'string' || sessionId.length > 255 || !SESSION_ID_PATTERN.test(sessionId)) {
    return fail('Invalid checkout session.', 400);
  }

  const stripe = getStripeServer();
  if (!stripe) {
    return fail('Payments are not configured yet.', 503);
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError && error.statusCode === 404) {
      return fail('Checkout session not found.', 404);
    }
    console.error('[stripe/session] failed to retrieve session', error);
    const safe = toSafeStripeError(error, 'Unable to verify your payment. Please try again.');
    return fail(safe.message, safe.status);
  }

  const paid =
    session.status === 'complete' &&
    (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');
  if (!paid) {
    return fail('This checkout has not been paid.', 402);
  }

  const { planId, billingCycle, currency: metaCurrency } = session.metadata ?? {};
  const currencyCode = (session.currency ?? metaCurrency ?? '').toUpperCase();
  if (!isPaidPlanId(planId) || !isBillingCycle(billingCycle) || !isSupportedCurrency(currencyCode)) {
    console.error('[stripe/session] session has unexpected metadata', session.id);
    return fail('This checkout could not be matched to a Hashtagger plan.', 422);
  }
  if (session.mode !== 'subscription') {
    console.error('[stripe/session] unexpected session mode', session.id, session.mode);
    return fail('This checkout could not be matched to a Hashtagger plan.', 422);
  }

  // A paid checkout is not enough: the subscription itself must still be live
  // (a canceled/unpaid subscription must not re-grant the plan via an old receipt link).
  const subscription = session.subscription;
  if (!subscription || typeof subscription === 'string') {
    console.error('[stripe/session] subscription was not expanded', session.id);
    return fail('This subscription is no longer active.', 402);
  }
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return fail('This subscription is no longer active.', 402);
  }

  const currency = getCurrency(currencyCode).code;
  const amountTotal = session.amount_total ?? 0;
  const subscriptionId = subscription.id;

  return NextResponse.json(
    {
      id: session.id,
      planId,
      billingCycle,
      currency,
      amountTotal,
      formattedTotal: formatMinorAmount(amountTotal, currency),
      // Never echo the payer's email to whoever holds the session id; the
      // field stays (always null) for response-shape compatibility.
      customerEmail: null,
      subscriptionId,
    },
    { headers: NO_STORE_HEADERS }
  );
}
