'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Trash2,
  Copy,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CurrencySelector from '@/components/CurrencySelector';
import StripePaywallModal from '@/components/StripePaywallModal';
import {
  PlanTierId,
  PRICING_PLANS,
  COMPARISON_MATRIX_ROWS,
  PLATFORM_SPECS,
} from '@/lib/hashtag-data';
import { formatCurrencyPrice } from '@/lib/currency';
import { useHashtaggerStore } from '@/lib/use-hashtagger-store';

export default function PricingPage() {
  const {
    currentPlan,
    billingCycle,
    setBillingCycle,
    selectedCurrency,
    setSelectedCurrency,
    invoices,
    savedBundles,
    saveSubscription,
    saveBundles,
  } = useHashtaggerStore();

  const isPaidPlan = currentPlan === 'pro' || currentPlan === 'agency';

  // Stripe Paywall Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<PlanTierId>('pro');
  const [copiedBundleId, setCopiedBundleId] = useState<string | null>(null);

  const openCheckout = (tierId: PlanTierId) => {
    setTargetUpgradePlan(tierId === 'free' ? 'pro' : tierId);
    setCheckoutModalOpen(true);
  };

  const handleDowngrade = () => {
    saveSubscription('free', billingCycle, 3, invoices, selectedCurrency);
  };

  const handleDeleteBundle = (id: string) => {
    saveBundles(savedBundles.filter((b) => b.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-12 space-y-16">
        {/* Header with Currency Selector & Billing Switch */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold tracking-wider text-indigo-600 block">
              Plans &amp; Pricing
            </span>
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              Simple Plans That Grow With You
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Start with 3 free posts every day. Upgrade whenever you need unlimited
              posts, live real-time trend intelligence, and spreadsheet downloads.
            </p>
          </div>

          {/* Controls Bar: Currency Dropdown + Billing Cycle Toggle */}
          <div className="flex flex-wrap items-center gap-4 p-2 bg-slate-100/90 border border-slate-200/80 rounded-xl shrink-0 self-start lg:self-auto">
            {/* Currency Selector */}
            <CurrencySelector
              value={selectedCurrency}
              onChange={setSelectedCurrency}
              size="sm"
            />

            {/* Monthly vs Annual Toggle */}
            <div>
              <span className="block text-[11px] font-medium text-slate-500 mb-1">
                Billing Cadence
              </span>
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-slate-950 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    billingCycle === 'annual'
                      ? 'bg-white text-slate-950 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Annual · Save 20%
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Tier Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {(Object.keys(PRICING_PLANS) as PlanTierId[]).map((tierId) => {
            const plan = PRICING_PLANS[tierId];
            const isCurrent = currentPlan === tierId;
            const isHighlighted = tierId === 'pro';
            const eurPrice =
              billingCycle === 'annual'
                ? plan.annualPricePerMonth
                : plan.monthlyPrice;
            const formattedPrice = formatCurrencyPrice(eurPrice, selectedCurrency);

            return (
              <div
                key={tierId}
                className={`bg-white rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-200 border relative ${
                  isHighlighted
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xl shadow-indigo-500/10'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 font-mono">
                    <span>★ MOST POPULAR</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className="text-xl font-bold text-slate-950"
                        style={{ fontFamily: 'var(--font-display), sans-serif' }}
                      >
                        {plan.name}
                      </h3>
                      {tierId === 'pro' && (
                        <span className="text-[10px] font-mono font-semibold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Best Value
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      {plan.audience}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold font-mono tabular-nums text-slate-950">
                        {formattedPrice}
                      </span>
                      <span className="text-xs text-slate-500">
                        / month
                        {plan.monthlyPrice > 0 &&
                          (billingCycle === 'annual'
                            ? ' · billed yearly'
                            : ' · billed monthly')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {plan.summary}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs text-slate-700">
                    {plan.highlights.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-4 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg whitespace-nowrap cursor-default"
                    >
                      Your Active Plan
                    </button>
                  ) : tierId === 'free' ? (
                    <button
                      type="button"
                      onClick={handleDowngrade}
                      className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Switch to Starter Free
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCheckout(tierId)}
                      className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                        isHighlighted
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {plan.ctaLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Feature Comparison Table */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2
              className="text-2xl font-bold text-slate-950"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              Side-by-Side Comparison
            </h2>
            <p className="text-sm text-slate-600">
              See what is included in each plan in your chosen currency.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/70">
                    <th className="py-3 px-4 font-semibold">Feature</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">
                      Starter Free ({formatCurrencyPrice(0, selectedCurrency)})
                    </th>
                    <th className="py-3 px-4 font-semibold text-indigo-700 bg-indigo-50/30">
                      Creator Pro (
                      {formatCurrencyPrice(
                        billingCycle === 'annual' ? 15 : 19,
                        selectedCurrency
                      )}
                      /mo)
                    </th>
                    <th className="py-3 px-4 font-semibold">
                      Growth Agency (
                      {formatCurrencyPrice(
                        billingCycle === 'annual' ? 39 : 49,
                        selectedCurrency
                      )}
                      /mo)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {COMPARISON_MATRIX_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {row.capability}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {row.category}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                        {row.freeValue}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-indigo-700 bg-indigo-50/20">
                        {row.proValue}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-800">
                        {row.agencyValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Saved Collections Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2
                className="text-2xl font-bold text-slate-950"
                style={{ fontFamily: 'var(--font-display), sans-serif' }}
              >
                Saved Hashtag Sets
              </h2>
              <p className="text-sm text-slate-600">
                Sets you have saved to reuse later ({savedBundles.length} /{' '}
                {isPaidPlan ? 'Unlimited' : '2 Free'} used).
              </p>
            </div>

            <Link
              href="/receipt"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View Billing Receipts &rarr;
            </Link>
          </div>

          {savedBundles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedBundles.map((bundle) => {
                const spec =
                  PLATFORM_SPECS[bundle.platform] || PLATFORM_SPECS.instagram;
                return (
                  <div
                    key={bundle.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span>
                          {spec.shortLabel} · {bundle.tags.length} tags ·{' '}
                          {bundle.createdAt}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBundle(bundle.id)}
                          aria-label={`Delete ${bundle.name}`}
                          className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3
                        className="text-base font-bold text-slate-950"
                        style={{ fontFamily: 'var(--font-display), sans-serif' }}
                      >
                        {bundle.name}
                      </h3>

                      {bundle.captionSnippet && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          “{bundle.captionSnippet}”
                        </p>
                      )}

                      <p className="text-xs font-mono text-indigo-700 leading-relaxed pt-1 break-words">
                        {bundle.tags.join(' ')}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href="/live-studio"
                        className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
                      >
                        Open in Studio
                      </Link>

                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(
                            bundle.tags.join(' ')
                          );
                          setCopiedBundleId(bundle.id);
                          setTimeout(() => setCopiedBundleId(null), 1500);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>
                          {copiedBundleId === bundle.id ? 'Copied!' : 'Copy Tags'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
              <p className="text-sm text-slate-600">
                You have not saved any hashtag sets yet.
              </p>
              <Link
                href="/live-studio"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Go to Live Studio
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Stripe Paywall Modal with Currency Dropdown & Stripe Checkout */}
      <StripePaywallModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        initialPlan={targetUpgradePlan}
      />

      <Footer />
    </div>
  );
}
