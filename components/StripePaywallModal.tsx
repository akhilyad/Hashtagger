'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Check,
  FlaskConical,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import {
  PRICING_PLANS,
  type BillingCycle,
  type InvoiceRecord,
  type PlanTierId,
} from '@/lib/hashtag-data';
import { formatMoney, getCurrency, getPlanCharge } from '@/lib/currency';
import { PAYMENTS_DEMO, apiUrl, isValidEmail } from '@/lib/payments-config';
import { useHashtaggerStore } from '@/lib/use-hashtagger-store';
import CurrencySelector from '@/components/CurrencySelector';

interface StripePaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: PlanTierId;
  reason?: string;
}

type PaidPlanId = Exclude<PlanTierId, 'free'>;

const PAID_PLANS: PaidPlanId[] = ['pro', 'agency'];
const GENERIC_CHECKOUT_ERROR =
  'Checkout is unavailable right now. You have not been charged. Please try again in a moment.';
const NETWORK_CHECKOUT_ERROR =
  "We couldn't reach the payment server. Check your connection and try again. You have not been charged.";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function demoInvoiceId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return `DEMO-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`;
}

function isSafeCheckoutUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Paywall dialog. Card details are never collected here: in live mode the user
 * is redirected to Stripe-hosted Checkout, and in demo mode nothing is charged.
 */
export default function StripePaywallModal(props: StripePaywallModalProps) {
  return (
    <AnimatePresence>
      {props.isOpen && <PaywallDialog key="stripe-paywall" {...props} />}
    </AnimatePresence>
  );
}

function PaywallDialog({ onClose, initialPlan = 'pro', reason }: StripePaywallModalProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  const emailId = `${uid}-email`;
  const emailHintId = `${uid}-email-hint`;
  const emailErrorId = `${uid}-email-error`;
  const currencyLabelId = `${uid}-currency`;
  const cycleLabelId = `${uid}-cycle`;

  const {
    isLoaded,
    billingCycle,
    setBillingCycle,
    selectedCurrency,
    setSelectedCurrency,
    invoices,
    saveSubscription,
  } = useHashtaggerStore();

  const [selectedPlanId, setSelectedPlanId] = useState<PaidPlanId>(
    initialPlan === 'agency' ? 'agency' : 'pro'
  );
  const [customerEmail, setCustomerEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'redirecting'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Set when the server answers {mode:'demo'} (no Stripe keys configured) even
  // though this build expects live payments. Nothing is granted until the user
  // explicitly confirms with the "Activate demo plan" button.
  const [serverDemo, setServerDemo] = useState(false);
  const isDemoMode = PAYMENTS_DEMO || serverDemo;
  const serverDemoNoteId = `${uid}-server-demo`;

  const panelRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const aliveRef = useRef(true);
  const busyRef = useRef(false);
  // Callers pass inline arrow functions, so keep the latest one in a ref
  // instead of re-running the focus/scroll-lock effect on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  function updateStatus(next: 'idle' | 'loading' | 'redirecting') {
    busyRef.current = next !== 'idle';
    setStatus(next);
  }

  // The dialog remounts on every open, so the initial plan is picked up via
  // the useState initialiser above; no syncing effect is needed.

  // Focus management, focus trap, Escape, body scroll lock.
  useEffect(() => {
    aliveRef.current = true;
    const opener = document.activeElement as HTMLElement | null;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    panelRef.current?.focus({ preventScroll: true });

    function getFocusable(): HTMLElement[] {
      const panel = panelRef.current;
      if (!panel) return [];
      return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.getClientRects().length > 0
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      const panel = panelRef.current;
      if (!panel) return;

      if (e.key === 'Escape') {
        // A nested control (e.g. the currency listbox) already handled it.
        if (e.defaultPrevented) return;
        const openPopup = panel.querySelector<HTMLElement>('[aria-expanded="true"]');
        if (openPopup) {
          e.preventDefault();
          openPopup.click();
          openPopup.focus();
          return;
        }
        if (busyRef.current) return;
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const outside = !active || !panel.contains(active) || active === panel;
      if (e.shiftKey && (outside || active === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (outside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    }

    // Restore the page after a back-navigation from Stripe (bfcache).
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        busyRef.current = false;
        setStatus('idle');
      }
    }

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      aliveRef.current = false;
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pageshow', onPageShow);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) {
        opener.focus({ preventScroll: true });
      }
    };
  }, []);

  const currency = getCurrency(selectedCurrency).code;
  const plan = PRICING_PLANS[selectedPlanId];
  const charge = getPlanCharge(selectedPlanId, billingCycle, currency);
  const monthlyCharge = getPlanCharge(selectedPlanId, 'monthly', currency);
  const annualCharge = getPlanCharge(selectedPlanId, 'annual', currency);
  const annualSavings = Math.max(0, monthlyCharge.perMonth * 12 - annualCharge.total);
  const annualSavingsPct =
    monthlyCharge.perMonth > 0
      ? Math.round((annualSavings / (monthlyCharge.perMonth * 12)) * 100)
      : 0;
  const isBusy = status !== 'idle';

  function fail(message: string) {
    if (!aliveRef.current) return;
    setErrorMessage(message);
    updateStatus('idle');
  }

  function completeDemoCheckout() {
    const demoCharge = getPlanCharge(selectedPlanId, billingCycle, currency);
    const invoice: InvoiceRecord = {
      id: demoInvoiceId(),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      planName: plan.name,
      billingCycle,
      amount: demoCharge.formattedTotal,
      status: 'Demo',
      currency,
    };
    saveSubscription(selectedPlanId, billingCycle, 9999, [invoice, ...invoices], currency);
    onCloseRef.current();
    router.push('/receipt?demo=1');
  }

  // Keep focus on the (re-labelled) submit button once the demo state appears;
  // it was disabled while loading, which drops focus to the document body.
  useEffect(() => {
    if (serverDemo) submitRef.current?.focus();
  }, [serverDemo]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busyRef.current || !isLoaded) return;
    setErrorMessage(null);

    // Second, explicit confirmation after the server reported demo mode.
    if (serverDemo) {
      completeDemoCheckout();
      return;
    }

    const email = customerEmail.trim();
    if (email && !isValidEmail(email)) {
      setEmailError('Enter a valid email address, or leave it empty.');
      emailRef.current?.focus();
      return;
    }
    setEmailError(null);
    updateStatus('loading');

    if (PAYMENTS_DEMO) {
      await new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : 500));
      if (aliveRef.current) completeDemoCheckout();
      return;
    }

    let response: Response;
    try {
      response = await fetch(apiUrl('/api/stripe/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          billingCycle,
          currency,
          ...(email ? { customerEmail: email } : {}),
        }),
      });
    } catch {
      fail(NETWORK_CHECKOUT_ERROR);
      return;
    }

    const data: unknown = await response.json().catch(() => null);
    const payload = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;

    if (!response.ok) {
      fail(
        typeof payload.error === 'string' && payload.error.trim()
          ? `${payload.error} You have not been charged.`
          : GENERIC_CHECKOUT_ERROR
      );
      return;
    }

    if (payload.mode === 'live' && isSafeCheckoutUrl(payload.url)) {
      if (aliveRef.current) updateStatus('redirecting');
      window.location.assign(payload.url);
      return;
    }

    if (payload.mode === 'demo') {
      if (!aliveRef.current) return;
      if (PAYMENTS_DEMO) {
        completeDemoCheckout();
        return;
      }
      // Live build but the server has no Stripe keys: never grant silently.
      setServerDemo(true);
      updateStatus('idle');
      return;
    }

    fail(GENERIC_CHECKOUT_ERROR);
  }

  const fade = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 24, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 16, scale: 0.98 },
      };

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busyRef.current) onCloseRef.current();
      }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        {...fade}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }
        }
        className="relative flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-slate-900/10 outline-none sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-xl sm:rounded-2xl"
      >
        {/* Gradient hairline accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-500/70 to-transparent"
        />

        {/* Header */}
        <div className="relative shrink-0 border-b border-slate-100 px-4 pb-4 pt-5 sm:px-7 sm:pt-6">
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            disabled={isBusy}
            aria-label="Close checkout"
            className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50 sm:right-5 sm:top-5 ${focusRing}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="space-y-2 pr-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-linear-to-b from-indigo-50 to-white px-2.5 py-0.5 text-xs font-semibold text-indigo-700 shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Upgrade
              </span>
              {isDemoMode ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                  <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                  Demo — no real charge
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Secure checkout by Stripe
                </span>
              )}
            </div>

            <h2
              id={titleId}
              className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              Unlock unlimited high-reach hashtags
            </h2>

            {reason ? (
              <p
                id={descId}
                className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900"
              >
                <Zap className="mt-px h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                <span>{reason}</span>
              </p>
            ) : (
              <p id={descId} className="text-sm text-slate-600">
                Unlimited AI post scans, live breaking trends and one-click CSV exports.
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          {/* Scrollable body */}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-7">
            {/* Currency + billing cycle */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-end sm:justify-between">
              <div role="group" aria-labelledby={currencyLabelId}>
                <span id={currencyLabelId} className="mb-1 block text-xs font-medium text-slate-700">
                  Currency
                </span>
                <CurrencySelector
                  value={currency}
                  onChange={setSelectedCurrency}
                  size="sm"
                  showLabel={false}
                  align="left"
                />
              </div>

              <div role="group" aria-labelledby={cycleLabelId}>
                <span id={cycleLabelId} className="mb-1 block text-xs font-medium text-slate-700">
                  Billing cycle
                </span>
                <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-medium">
                  {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => {
                    const active = billingCycle === cycle;
                    return (
                      <button
                        key={cycle}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setBillingCycle(cycle)}
                        className={`relative rounded-md px-3 py-1.5 transition-colors ${focusRing} ${
                          active ? 'text-slate-950' : 'text-slate-700 hover:text-slate-950'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId={`${uid}-cycle-pill`}
                            aria-hidden="true"
                            className="absolute inset-0 rounded-md bg-white shadow-xs ring-1 ring-slate-900/5"
                            transition={
                              reduceMotion
                                ? { duration: 0 }
                                : { type: 'spring', bounce: 0.2, duration: 0.35 }
                            }
                          />
                        )}
                        <span className={`relative z-10 ${active ? 'font-semibold' : ''}`}>
                          {cycle === 'monthly' ? 'Monthly' : 'Annual'}
                          {cycle === 'annual' && annualSavingsPct > 0 && (
                            <span className="ml-1 font-semibold text-emerald-700">
                              −{annualSavingsPct}%
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Plan choice */}
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-slate-800">Choose your plan</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PAID_PLANS.map((tierId) => {
                  const p = PRICING_PLANS[tierId];
                  const tierCharge = getPlanCharge(tierId, billingCycle, currency);
                  const isSelected = selectedPlanId === tierId;
                  return (
                    <label
                      key={tierId}
                      className={`relative flex cursor-pointer flex-col rounded-xl border p-4 text-left transition-[box-shadow,border-color,transform] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500 has-[:focus-visible]:ring-offset-2 motion-safe:active:scale-[0.99] ${
                        isSelected
                          ? 'border-transparent shadow-[0_6px_20px_-8px_rgb(79_70_229/0.45)]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                      style={
                        isSelected
                          ? {
                              background:
                                'linear-gradient(#ffffff, #f8faff) padding-box, linear-gradient(135deg, #6366f1, #8b5cf6 55%, #a5b4fc) border-box',
                            }
                          : undefined
                      }
                    >
                      <input
                        type="radio"
                        name={`${uid}-plan`}
                        value={tierId}
                        checked={isSelected}
                        onChange={() => setSelectedPlanId(tierId)}
                        className="sr-only"
                      />
                      {tierId === 'pro' && (
                        <span className="absolute -top-2.5 right-3 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]">
                          Recommended
                        </span>
                      )}
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-950">{p.name}</span>
                        <span
                          aria-hidden="true"
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-400 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </span>
                      </span>
                      <span className="mt-2 flex items-baseline gap-1">
                        <span className="font-mono text-xl font-bold tabular-nums text-slate-950">
                          {tierCharge.formattedPerMonth}
                        </span>
                        <span className="text-xs text-slate-600">/ month</span>
                      </span>
                      <span className="mt-1 line-clamp-2 text-xs text-slate-600">{p.summary}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* What you unlock */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <span className="mb-2 block text-xs font-semibold text-slate-700">
                What you unlock with {plan.name}
              </span>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {plan.highlights.slice(0, 4).map((feat) => (
                  <li key={feat} className="flex items-start gap-1.5 text-xs leading-snug text-slate-700">
                    <Check className="mt-px h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden="true" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Optional email */}
            <div>
              <label htmlFor={emailId} className="mb-1 block text-xs font-medium text-slate-800">
                Email for your receipt <span className="font-normal text-slate-600">(optional)</span>
              </label>
              <input
                ref={emailRef}
                id={emailId}
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? `${emailErrorId} ${emailHintId}` : emailHintId}
                placeholder="you@example.com"
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                  emailError ? 'border-red-500' : 'border-slate-300 focus:border-indigo-600'
                }`}
              />
              {emailError && (
                <p id={emailErrorId} className="mt-1 text-xs font-medium text-red-700">
                  {emailError}
                </p>
              )}
              <p id={emailHintId} className="mt-1 text-xs text-slate-600">
                {isDemoMode
                  ? 'Not sent anywhere in demo mode.'
                  : "Card details are entered on Stripe's secure checkout page, never here."}
              </p>
            </div>

            {/* Price breakdown */}
            <dl className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-600">
                  {plan.name} · {billingCycle === 'annual' ? 'Annual' : 'Monthly'}
                </dt>
                <dd className="font-mono tabular-nums text-slate-900">
                  {charge.formattedPerMonth} / month
                </dd>
              </div>
              {billingCycle === 'annual' && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-600">Billed for 12 months</dt>
                  <dd className="font-mono tabular-nums text-slate-900">
                    {charge.formattedPerMonth} × 12
                  </dd>
                </div>
              )}
              {annualSavings > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-emerald-800">
                    {billingCycle === 'annual' ? 'You save vs monthly' : 'Save with annual billing'}
                  </dt>
                  <dd className="font-mono font-semibold tabular-nums text-emerald-800">
                    {formatMoney(annualSavings, currency)} / year
                  </dd>
                </div>
              )}
              <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-2">
                <dt>
                  <span className="block font-semibold text-slate-950">Due today</span>
                  <span className="block text-xs text-slate-600">
                    Renews every {charge.interval} · cancel anytime
                  </span>
                </dt>
                <dd className="text-right">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={charge.formattedTotal}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      transition={{ duration: reduceMotion ? 0 : 0.18 }}
                      className="block font-mono text-xl font-bold tabular-nums text-slate-950"
                    >
                      {charge.formattedTotal}
                    </motion.span>
                  </AnimatePresence>
                  <span className="block text-xs text-slate-600">
                    {charge.currency} / {charge.interval}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 space-y-3 border-t border-slate-100 bg-white px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
            <div role="alert" aria-live="assertive">
              {errorMessage && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-800">
                  {errorMessage}
                </p>
              )}
            </div>

            <div role="status" aria-live="polite">
              {serverDemo && (
                <div
                  id={serverDemoNoteId}
                  className="space-y-1.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950"
                >
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2 py-0.5 font-semibold text-amber-900">
                    <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                    Demo — no real charge
                  </span>
                  <p>
                    The payment server has no Stripe keys configured, so it can only run a demo
                    checkout. No card will be charged and nothing is billed. Activate the demo plan
                    to try {plan.name} in this browser only.
                  </p>
                </div>
              )}
            </div>

            <button
              ref={submitRef}
              type="submit"
              disabled={isBusy || !isLoaded}
              aria-busy={isBusy}
              aria-describedby={serverDemo ? serverDemoNoteId : undefined}
              className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_8px_20px_-6px_rgb(79_70_229/0.55)] transition-[background-color,box-shadow,transform] hover:bg-indigo-700 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_10px_24px_-6px_rgb(79_70_229/0.6)] disabled:cursor-not-allowed disabled:opacity-70 motion-safe:active:scale-[0.98] ${focusRing}`}
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{status === 'redirecting' ? 'Redirecting to Stripe…' : 'Preparing checkout…'}</span>
                </>
              ) : serverDemo ? (
                <>
                  <FlaskConical className="h-4 w-4" aria-hidden="true" />
                  <span>Activate demo plan</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span>{PAYMENTS_DEMO ? 'Continue to demo checkout' : 'Continue to secure checkout'}</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>

            {isDemoMode ? (
              <p className="flex items-start justify-center gap-1.5 text-center text-xs font-medium text-amber-900">
                <FlaskConical className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Demo — no real charge. This preview simulates checkout; no card is needed.</span>
              </p>
            ) : (
              <p className="flex items-start justify-center gap-1.5 text-center text-xs text-slate-600">
                <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
                <span>
                  Payments are processed by Stripe. You&apos;ll confirm {charge.formattedTotal} on
                  Stripe&apos;s checkout page. Cancel anytime.
                </span>
              </p>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
