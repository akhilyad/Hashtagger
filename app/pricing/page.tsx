'use client';

import React, { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Check,
  Trash2,
  Copy,
  Sparkles,
  Info,
  X,
  FlaskConical,
  ArrowRight,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CurrencySelector from '@/components/CurrencySelector';
import StripePaywallModal from '@/components/StripePaywallModal';
import {
  type BillingCycle,
  type PlanTierId,
  PRICING_PLANS,
  COMPARISON_MATRIX_ROWS,
  PLATFORM_SPECS,
} from '@/lib/hashtag-data';
import { formatMoney, getPlanCharge } from '@/lib/currency';
import { PAYMENTS_DEMO } from '@/lib/payments-config';
import { useHashtaggerStore } from '@/lib/use-hashtagger-store';

const PLAN_ORDER: PlanTierId[] = ['free', 'pro', 'agency'];
const BILLING_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

/** Percentage saved per month by paying annually, from the charged prices. */
function annualSavingPercent(planId: PlanTierId, currency: string): number {
  const monthly = getPlanCharge(planId, 'monthly', currency).perMonth;
  const annual = getPlanCharge(planId, 'annual', currency).perMonth;
  if (monthly <= 0) return 0;
  return Math.round((1 - annual / monthly) * 100);
}

/* ------------------------------------------------------------------ */
/* Billing segmented control                                           */
/* ------------------------------------------------------------------ */

function BillingToggle({
  value,
  onChange,
  savePercent,
  ready,
}: {
  value: BillingCycle;
  onChange: (next: BillingCycle) => void;
  savePercent: number;
  ready: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const current = BILLING_OPTIONS.findIndex((o) => o.value === value);
    let next = current;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = current - 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = current + 1;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = BILLING_OPTIONS.length - 1;
    next = (next + BILLING_OPTIONS.length) % BILLING_OPTIONS.length;
    onChange(BILLING_OPTIONS[next].value);
    buttonRefs.current[next]?.focus();
  };

  return (
    <div>
      <span id="billing-cadence-label" className="block text-[11px] font-medium text-slate-600 mb-1">
        Billing cadence
      </span>
      <div
        role="radiogroup"
        aria-labelledby="billing-cadence-label"
        aria-busy={!ready}
        onKeyDown={handleKeyDown}
        className="relative flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg"
      >
        {BILLING_OPTIONS.map((option, idx) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(option.value)}
              className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-md whitespace-nowrap cursor-pointer transition-colors ${FOCUS_RING} focus-visible:ring-offset-slate-200 ${
                isActive ? 'text-slate-950 font-semibold' : 'text-slate-600 font-medium hover:text-slate-950'
              }`}
            >
              {isActive && ready && (
                <motion.span
                  layoutId="billing-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-md bg-white shadow-xs ring-1 ring-slate-900/5"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', bounce: 0.2, duration: 0.35 }
                  }
                />
              )}
              <span className="relative z-10">{option.label}</span>
              {option.value === 'annual' && savePercent > 0 && (
                <span className="relative z-10 text-[10px] font-mono font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20">
                  Save {savePercent}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Animated price                                                      */
/* ------------------------------------------------------------------ */

function AnimatedPrice({ value, ready }: { value: string; ready: boolean }) {
  // useReducedMotion() can differ between the server render and the first
  // client render, so the animation targets stay identical and only the
  // transition timing changes (instant when reduced motion is preferred).
  const reduceMotion = useReducedMotion();
  return (
    <span
      aria-busy={!ready}
      className={`relative inline-flex overflow-hidden text-3xl sm:text-4xl font-bold font-mono tabular-nums tracking-tight text-slate-950 transition-opacity ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* ?canceled=true notice (needs Suspense for useSearchParams)          */
/* ------------------------------------------------------------------ */

function CanceledNotice() {
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const canceled = searchParams?.get('canceled') === 'true';

  if (!canceled || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      // Drop the query so a refresh does not bring the notice back.
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <Info aria-hidden className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
      <p className="flex-1 min-w-0">
        <span className="font-semibold">Checkout canceled.</span> You have not been
        charged and your plan has not changed. You can pick a plan again whenever
        you are ready.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss checkout canceled notice"
        className={`shrink-0 rounded-md p-1 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer ${FOCUS_RING} focus-visible:ring-offset-amber-50`}
      >
        <X aria-hidden className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  const {
    isLoaded,
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

  const isPaidPlan = isLoaded && (currentPlan === 'pro' || currentPlan === 'agency');
  const savePercent = annualSavingPercent('pro', selectedCurrency);

  // Stripe Paywall Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<PlanTierId>('pro');
  const [copiedBundleId, setCopiedBundleId] = useState<string | null>(null);
  const [confirmDowngrade, setConfirmDowngrade] = useState(false);
  const [planAnnouncement, setPlanAnnouncement] = useState('');
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downgradeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const freeHeadingRef = useRef<HTMLHeadingElement | null>(null);
  // Where focus should land once the downgrade confirmation closes.
  const pendingFocusRef = useRef<'trigger' | 'heading' | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Reset a pending downgrade confirmation if the plan changes underneath it.
  const [confirmForPlan, setConfirmForPlan] = useState(currentPlan);
  if (confirmForPlan !== currentPlan) {
    setConfirmForPlan(currentPlan);
    setConfirmDowngrade(false);
  }

  const openCheckout = (tierId: PlanTierId) => {
    setTargetUpgradePlan(tierId === 'free' ? 'pro' : tierId);
    setCheckoutModalOpen(true);
  };

  const cancelDowngrade = () => {
    pendingFocusRef.current = 'trigger';
    setConfirmDowngrade(false);
  };

  const handleDowngrade = () => {
    pendingFocusRef.current = 'heading';
    saveSubscription('free', billingCycle, 3, invoices, selectedCurrency);
    setConfirmDowngrade(false);
    setPlanAnnouncement(`Switched to ${PRICING_PLANS.free.name}`);
  };

  // Restore focus after the confirmation unmounts: back to the trigger on
  // cancel, or to the Free card heading after a confirmed switch.
  useLayoutEffect(() => {
    if (confirmDowngrade) return;
    const target = pendingFocusRef.current;
    if (!target) return;
    pendingFocusRef.current = null;
    if (target === 'trigger') downgradeTriggerRef.current?.focus();
    else freeHeadingRef.current?.focus();
  }, [confirmDowngrade, currentPlan]);

  const handleDeleteBundle = (id: string) => {
    saveBundles(savedBundles.filter((b) => b.id !== id));
  };

  const handleCopyBundle = async (id: string, tags: string[]) => {
    try {
      await navigator.clipboard.writeText(tags.join(' '));
    } catch {
      return;
    }
    setCopiedBundleId(id);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedBundleId(null), 1500);
  };

  const proCharge = getPlanCharge('pro', billingCycle, selectedCurrency);
  const agencyCharge = getPlanCharge('agency', billingCycle, selectedCurrency);
  const freeCharge = getPlanCharge('free', billingCycle, selectedCurrency);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-14 sm:space-y-16">
        <Suspense fallback={null}>
          <CanceledNotice />
        </Suspense>

        <p role="status" aria-live="polite" className="sr-only">
          {planAnnouncement}
        </p>

        {/* Header with Billing Switch & Currency Selector */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                <Sparkles aria-hidden className="w-3.5 h-3.5" />
                Plans &amp; Pricing
              </span>
              {PAYMENTS_DEMO && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                  <FlaskConical aria-hidden className="w-3.5 h-3.5" />
                  Demo mode — no real charges
                </span>
              )}
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 [text-wrap:balance]">
              Simple plans that grow with you
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Start with 3 free posts every day. Upgrade whenever you need unlimited
              posts, live real-time trend intelligence, and spreadsheet downloads.
              Prices are set in euros (€); other currencies use an approximate fixed
              rate and are charged exactly as shown.
            </p>
          </div>

          {/* Controls: billing segmented control + currency */}
          <div className="flex flex-wrap items-end gap-3 sm:gap-4 p-2.5 bg-slate-100/90 border border-slate-200/80 rounded-xl self-start lg:self-auto max-w-full">
            <BillingToggle
              value={billingCycle}
              onChange={setBillingCycle}
              savePercent={savePercent}
              ready={isLoaded}
            />
            <CurrencySelector
              value={selectedCurrency}
              onChange={setSelectedCurrency}
              size="sm"
              align="left"
              className={isLoaded ? '' : 'invisible'}
            />
          </div>
        </div>

        {/* 3 Tier Cards */}
        <section aria-label="Plans" className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-2">
          {PLAN_ORDER.map((tierId) => {
            const plan = PRICING_PLANS[tierId];
            const charge = getPlanCharge(tierId, billingCycle, selectedCurrency);
            const monthlyCharge = getPlanCharge(tierId, 'monthly', selectedCurrency);
            const isFree = tierId === 'free';
            const isCurrent = isLoaded && currentPlan === tierId;
            const isHighlighted = tierId === 'pro';
            const yearlySaving =
              billingCycle === 'annual' && !isFree
                ? monthlyCharge.perMonth * 12 - charge.total
                : 0;

            const card = (
              <div
                className={`relative h-full bg-white p-6 sm:p-7 flex flex-col justify-between gap-6 ${
                  isHighlighted
                    ? 'rounded-[15px]'
                    : `rounded-2xl border shadow-xs transition-colors ${
                        isCurrent ? 'border-indigo-300' : 'border-slate-200 hover:border-slate-300'
                      }`
                }`}
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2
                        ref={isFree ? freeHeadingRef : undefined}
                        tabIndex={isFree ? -1 : undefined}
                        className="font-heading text-xl font-bold text-slate-950 outline-none"
                      >
                        {plan.name}
                      </h2>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full ring-1 ring-indigo-600/20">
                          <Check aria-hidden className="w-3 h-3" />
                          Current plan
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-600">{plan.audience}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <AnimatedPrice value={charge.formattedPerMonth} ready={isLoaded} />
                      <span className="text-xs text-slate-600">/ month</span>
                    </div>
                    <p
                      className={`mt-1 min-h-[1.25rem] text-xs text-slate-600 transition-opacity ${
                        isLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {isFree ? (
                        'Free forever · no card needed'
                      ) : billingCycle === 'annual' ? (
                        <>
                          Billed {formatMoney(charge.total, charge.currency)}/year
                          {yearlySaving > 0 && (
                            <span className="ml-1.5 font-semibold text-emerald-700">
                              · save {formatMoney(yearlySaving, charge.currency)}
                            </span>
                          )}
                        </>
                      ) : (
                        'Billed monthly · cancel anytime'
                      )}
                    </p>
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                      {plan.summary}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs text-slate-700">
                    {plan.highlights.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <span
                          aria-hidden
                          className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                            isHighlighted
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-600/15'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  {!isLoaded ? (
                    <div aria-hidden className="h-[38px] w-full rounded-lg bg-slate-100 motion-safe:animate-pulse" />
                  ) : isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg whitespace-nowrap cursor-default"
                    >
                      Your active plan
                    </button>
                  ) : isFree ? (
                    confirmDowngrade ? (
                      <div
                        role="group"
                        aria-labelledby="downgrade-title"
                        aria-describedby="downgrade-desc"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelDowngrade();
                          }
                        }}
                        className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                      >
                        <p id="downgrade-title" className="text-xs font-semibold text-amber-950">
                          Switch to {PRICING_PLANS.free.name}?
                        </p>
                        <p id="downgrade-desc" className="text-xs text-amber-900 leading-relaxed">
                          You will lose {PRICING_PLANS[currentPlan]?.name ?? 'paid'} features and
                          go back to 3 posts per day. This switches your plan in this browser
                          only. To stop billing for a live subscription, contact us.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleDowngrade}
                            className={`flex-1 py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-[background-color,transform] active:scale-[0.98] motion-reduce:transform-none cursor-pointer ${FOCUS_RING} focus-visible:ring-offset-amber-50`}
                          >
                            Yes, switch
                          </button>
                          <button
                            type="button"
                            autoFocus
                            onClick={cancelDowngrade}
                            className={`flex-1 py-2 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-[background-color,transform] active:scale-[0.98] motion-reduce:transform-none cursor-pointer ${FOCUS_RING} focus-visible:ring-offset-amber-50`}
                          >
                            Keep my plan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        ref={downgradeTriggerRef}
                        type="button"
                        onClick={() => setConfirmDowngrade(true)}
                        className={`w-full py-2.5 px-4 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-[background-color,border-color,transform] active:scale-[0.98] motion-reduce:transform-none whitespace-nowrap cursor-pointer ${FOCUS_RING}`}
                      >
                        Switch to {PRICING_PLANS.free.name}
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCheckout(tierId)}
                      className={`group w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-white rounded-lg whitespace-nowrap cursor-pointer transition-[background-color,box-shadow,transform] hover:-translate-y-px active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none ${FOCUS_RING} ${
                        isHighlighted
                          ? 'bg-indigo-600 hover:bg-indigo-700 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-6px_rgb(79_70_229/0.55)]'
                          : 'bg-slate-900 hover:bg-slate-800 shadow-[inset_0_1px_0_rgb(255_255_255/0.15),0_6px_16px_-8px_rgb(15_23_42/0.6)]'
                      }`}
                    >
                      <span>{plan.ctaLabel}</span>
                      <ArrowRight
                        aria-hidden
                        className="w-3.5 h-3.5 transition-transform motion-safe:group-hover:translate-x-0.5"
                      />
                    </button>
                  )}
                </div>
              </div>
            );

            if (!isHighlighted) {
              return <div key={tierId}>{card}</div>;
            }

            // Featured card: 1px gradient border + "Most popular" badge.
            return (
              <div
                key={tierId}
                className="relative rounded-2xl p-px bg-gradient-to-b from-indigo-500 via-violet-500 to-emerald-400 shadow-xl shadow-indigo-500/15"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm ring-1 ring-white/30 font-mono whitespace-nowrap">
                  <Sparkles aria-hidden className="w-3 h-3" />
                  Most popular
                </div>
                {card}
              </div>
            );
          })}
        </section>

        {/* Feature Comparison Table */}
        <section className="space-y-4" aria-labelledby="comparison-heading">
          <div className="space-y-1">
            <h2 id="comparison-heading" className="font-heading text-2xl font-bold text-slate-950">
              Side-by-side comparison
            </h2>
            <p className="text-sm text-slate-600">
              See what is included in each plan in your chosen currency.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div
              role="region"
              aria-labelledby="comparison-heading"
              tabIndex={0}
              className="overflow-x-auto overscroll-x-contain rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
            >
              <table className="w-full min-w-[640px] text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/70 align-bottom">
                    <th scope="col" className="sticky left-0 z-10 bg-slate-50 py-3 px-4 font-semibold">
                      Feature
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold">Category</th>
                    {[
                      { id: 'free' as const, charge: freeCharge },
                      { id: 'pro' as const, charge: proCharge },
                      { id: 'agency' as const, charge: agencyCharge },
                    ].map(({ id, charge }) => (
                      <th
                        key={id}
                        scope="col"
                        className={`py-3 px-4 font-semibold ${
                          id === 'pro' ? 'text-indigo-700 bg-indigo-50/40' : 'text-slate-700'
                        }`}
                      >
                        <span className="block">{PRICING_PLANS[id].name}</span>
                        <span
                          className={`block font-mono font-medium tabular-nums transition-opacity ${
                            id === 'pro' ? 'text-indigo-700' : 'text-slate-600'
                          } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        >
                          {charge.formattedPerMonth}/mo
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {COMPARISON_MATRIX_ROWS.map((row) => (
                    <tr key={row.capability} className="group hover:bg-slate-50">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 py-3 px-4 font-semibold text-slate-900 max-w-[180px]"
                      >
                        {row.capability}
                      </th>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {row.category}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {row.freeValue}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-indigo-700 bg-indigo-50/30">
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
          <p className="text-xs text-slate-600 md:hidden">Swipe the table sideways to compare all plans.</p>
        </section>

        {/* Saved Collections Section */}
        <section className="space-y-4" aria-labelledby="saved-sets-heading">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 id="saved-sets-heading" className="font-heading text-2xl font-bold text-slate-950">
                Saved hashtag sets
              </h2>
              <p className={`text-sm text-slate-600 transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                Sets you have saved to reuse later ({savedBundles.length} /{' '}
                {isPaidPlan ? 'Unlimited' : `${PRICING_PLANS.free.maxSavedBundles} Free`} used).
              </p>
            </div>

            <Link
              href="/receipt"
              className={`text-xs font-semibold text-indigo-700 hover:underline rounded-sm ${FOCUS_RING}`}
            >
              View billing receipts &rarr;
            </Link>
          </div>

          {!isLoaded ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-hidden>
              {[0, 1].map((i) => (
                <div key={i} className="h-44 rounded-xl border border-slate-200 bg-white motion-safe:animate-pulse" />
              ))}
            </div>
          ) : savedBundles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedBundles.map((bundle) => {
                const spec =
                  PLATFORM_SPECS[bundle.platform] || PLATFORM_SPECS.instagram;
                return (
                  <div
                    key={bundle.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                        <span className="min-w-0 truncate">
                          {spec.shortLabel} · {bundle.tags.length} tags ·{' '}
                          {bundle.createdAt}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBundle(bundle.id)}
                          aria-label={`Delete ${bundle.name}`}
                          className={`shrink-0 rounded-md p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer ${FOCUS_RING}`}
                        >
                          <Trash2 aria-hidden className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-heading text-base font-bold text-slate-950">
                        {bundle.name}
                      </h3>

                      {bundle.captionSnippet && (
                        <p className="text-xs text-slate-600 line-clamp-2">
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
                        className={`px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap ${FOCUS_RING}`}
                      >
                        Open in Studio
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleCopyBundle(bundle.id, bundle.tags)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 rounded-md transition-[background-color,transform] active:scale-[0.97] motion-reduce:transform-none cursor-pointer ${FOCUS_RING}`}
                      >
                        {copiedBundleId === bundle.id ? (
                          <Check aria-hidden className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy aria-hidden className="w-3.5 h-3.5" />
                        )}
                        <span aria-live="polite">
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
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-[background-color,transform] active:scale-[0.98] motion-reduce:transform-none ${FOCUS_RING}`}
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
