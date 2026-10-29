import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe client
let stripeClient: Stripe | null = null;

export function getStripeServer(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: '2026-02-05' as any,
      typescript: true,
    });
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Client-side Stripe promise
let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripeClient() {
  const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!pubKey) {
    return null;
  }
  if (!stripePromise) {
    stripePromise = loadStripe(pubKey);
  }
  return stripePromise;
}

