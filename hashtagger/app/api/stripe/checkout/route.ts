import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer, isStripeConfigured } from '@/lib/stripe';
import { PRICING_PLANS, PlanTierId, BillingCycle } from '@/lib/hashtag-data';
import {
  getCurrency,
  convertEurAmount,
  getStripeAmount,
  formatCurrencyPrice,
} from '@/lib/currency';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      planId = 'pro',
      billingCycle = 'annual',
      currency = 'EUR',
      customerEmail,
      customerName,
    } = body as {
      planId: PlanTierId;
      billingCycle: BillingCycle;
      currency: string;
      customerEmail?: string;
      customerName?: string;
    };

    if (planId === 'free') {
      return NextResponse.json(
        { error: 'Free plan does not require checkout' },
        { status: 400 }
      );
    }

    const chosenPlan = PRICING_PLANS[planId];
    if (!chosenPlan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    const curr = getCurrency(currency);
    const eurBaseAmount =
      billingCycle === 'annual'
        ? chosenPlan.annualPricePerMonth * 12
        : chosenPlan.monthlyPrice;

    const convertedAmount = convertEurAmount(eurBaseAmount, curr.code);
    const stripeUnitAmount = getStripeAmount(eurBaseAmount, curr.code);
    const formattedPrice = formatCurrencyPrice(eurBaseAmount, curr.code, {
      withDecimals: true,
    });

    const origin =
      req.headers.get('origin') ||
      process.env.APP_URL ||
      'http://localhost:3000';

    // If Stripe secret key is configured, create an actual Stripe Checkout Session
    if (isStripeConfigured()) {
      const stripe = getStripeServer();
      if (stripe) {
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer_email: customerEmail || undefined,
          line_items: [
            {
              price_data: {
                currency: curr.stripeCurrency,
                unit_amount: stripeUnitAmount,
                product_data: {
                  name: `Hashtagger ${chosenPlan.name} (${
                    billingCycle === 'annual' ? 'Annual' : 'Monthly'
                  })`,
                  description: `Unlimited AI hashtag generation & visual trend discovery (${curr.code})`,
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            planId,
            billingCycle,
            currency: curr.code,
            customerName: customerName || '',
          },
          success_url: `${origin}/receipt?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&cycle=${billingCycle}&currency=${curr.code}`,
          cancel_url: `${origin}/pricing?canceled=true`,
        });

        return NextResponse.json({
          url: session.url,
          sessionId: session.id,
          isLiveStripe: true,
          currency: curr.code,
          amount: formattedPrice,
        });
      }
    }

    // Otherwise, simulate a successful Stripe paywall authorization for development/preview
    return NextResponse.json({
      isLiveStripe: false,
      simulated: true,
      planId,
      planName: chosenPlan.name,
      billingCycle,
      currency: curr.code,
      symbol: curr.symbol,
      convertedAmount,
      formattedPrice,
      clientSecret: 'mock_stripe_pi_' + Math.random().toString(36).substring(2),
    });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize Stripe checkout session' },
      { status: 500 }
    );
  }
}
