import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeServer } from '@/lib/stripe';

// Signature verification needs the Node.js runtime and the untouched raw body.
export const runtime = 'nodejs';

/**
 * POST /api/stripe/webhook
 * Stripe-signed events. Configure the endpoint in the Stripe Dashboard (or
 * `stripe listen --forward-to localhost:3000/api/stripe/webhook`) and put its
 * signing secret in STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  // Placeholder secrets (e.g. "whsec_replace_me") count as not configured.
  if (!webhookSecret || !/^whsec_[A-Za-z0-9]{10,}/.test(webhookSecret)) {
    return NextResponse.json({ error: 'Webhooks are not configured.' }, { status: 503 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    // constructEvent is local HMAC verification; it needs no API key.
    const webhooks = getStripeServer()?.webhooks ?? Stripe.webhooks;
    event = webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    console.warn('[stripe/webhook] signature verification failed:', reason);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  // This app has no database yet: persist entitlements (customer -> plan, status, period end) here, keyed by customer/subscription id.
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.info(
        `[stripe/webhook] ${event.type} session=${session.id} plan=${session.metadata?.planId ?? '?'} cycle=${session.metadata?.billingCycle ?? '?'} payment_status=${session.payment_status}`
      );
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.info(
        `[stripe/webhook] ${event.type} subscription=${subscription.id} status=${subscription.status} plan=${subscription.metadata?.planId ?? '?'}`
      );
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.info(
        `[stripe/webhook] ${event.type} invoice=${invoice.id ?? '?'} attempt=${invoice.attempt_count} amount_due=${invoice.amount_due} ${invoice.currency}`
      );
      break;
    }
    default:
      // Acknowledge everything else so Stripe does not retry.
      break;
  }

  return NextResponse.json({ received: true });
}
