'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FlaskConical,
  Loader2,
  Printer,
  Receipt as ReceiptIcon,
  RotateCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useHashtaggerStore } from '@/lib/use-hashtagger-store';
import {
  PRICING_PLANS,
  type BillingCycle,
  type InvoiceRecord,
  type PlanTierId,
} from '@/lib/hashtag-data';
import { getCurrency, isSupportedCurrency } from '@/lib/currency';
import { apiUrl } from '@/lib/payments-config';

type PaidPlanId = Exclude<PlanTierId, 'free'>;

interface VerifiedSession {
  id: string;
  planId: PaidPlanId;
  billingCycle: BillingCycle;
  currency: string;
  formattedTotal: string;
  customerEmail: string | null;
}

type VerifyState =
  | { status: 'loading' }
  | { status: 'success'; session: VerifiedSession }
  | { status: 'error'; message: string };

const SESSION_ID_PATTERN = /^cs_(test|live)_[A-Za-z0-9]{8,255}$/;
const GENERIC_VERIFY_ERROR =
  "We couldn't confirm this payment with Stripe. Your plan has not been changed.";

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

type InvoiceKind = 'stripe' | 'demo' | 'other';

/** Only invoices tied to a verified Stripe session may claim Stripe as the processor. */
function invoiceKind(invoice: InvoiceRecord): InvoiceKind {
  if (invoice.status === 'Demo') return 'demo';
  if (invoice.stripeSessionId) return 'stripe';
  return 'other';
}

/** Free-plan / zero-amount placeholder records are not real receipts. */
function isPlaceholderInvoice(invoice: InvoiceRecord): boolean {
  if (invoice.stripeSessionId || invoice.status === 'Demo') return false;
  const isFreePlan = invoice.planName === PRICING_PLANS.free.name;
  const isZeroAmount = !/[1-9]/.test(invoice.amount);
  return isFreePlan || isZeroAmount;
}

/** Line-item description built from the plan's own highlights. */
function planDescription(planName: string): string | null {
  const plan = Object.values(PRICING_PLANS).find((p) => p.name === planName);
  if (!plan || plan.highlights.length === 0) return null;
  return plan.highlights.slice(0, 2).join(' · ');
}

function invoiceIdForSession(sessionId: string): string {
  return `INV-${sessionId.slice(-8).toUpperCase()}`;
}

/** Validates the /api/stripe/session payload; anything unexpected is rejected. */
function parseVerifiedSession(data: unknown, requestedId: string): VerifiedSession | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const planId = d.planId;
  const billingCycle = d.billingCycle;
  if (planId !== 'pro' && planId !== 'agency') return null;
  if (billingCycle !== 'monthly' && billingCycle !== 'annual') return null;
  if (typeof d.formattedTotal !== 'string' || !d.formattedTotal.trim()) return null;
  if (!isSupportedCurrency(d.currency)) return null;
  const id = typeof d.id === 'string' && d.id ? d.id : requestedId;
  if (id !== requestedId) return null;
  return {
    id,
    planId,
    billingCycle,
    currency: getCurrency(d.currency).code,
    formattedTotal: d.formattedTotal,
    customerEmail: typeof d.customerEmail === 'string' ? d.customerEmail : null,
  };
}

function ReceiptContent() {
  const searchParams = useSearchParams();
  // Only these two params are honoured. plan / cycle / currency params are
  // deliberately ignored: a URL can never grant a plan or set a price.
  const sessionId = searchParams.get('session_id');
  const isDemoReturn = searchParams.get('demo') === '1';

  const { isLoaded, invoices, saveSubscription } = useHashtaggerStore();

  // Always read the freshest invoices inside async callbacks.
  const invoicesRef = useRef<InvoiceRecord[]>(invoices);
  const saveRef = useRef(saveSubscription);
  useEffect(() => {
    invoicesRef.current = invoices;
    saveRef.current = saveSubscription;
  }, [invoices, saveSubscription]);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [verify, setVerify] = useState<VerifyState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const startedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionId || !isLoaded) return;
    const runKey = `${sessionId}#${attempt}`;
    if (startedForRef.current === runKey) return;
    startedForRef.current = runKey;

    const update = (next: VerifyState) => {
      if (mountedRef.current) setVerify(next);
    };

    if (!SESSION_ID_PATTERN.test(sessionId)) {
      update({ status: 'error', message: 'This receipt link is not valid. Your plan has not been changed.' });
      return;
    }

    update({ status: 'loading' });

    (async () => {
      let response: Response;
      try {
        response = await fetch(apiUrl('/api/stripe/session'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch {
        update({
          status: 'error',
          message:
            "We couldn't reach the payment server to confirm your payment. Check your connection and try again.",
        });
        return;
      }

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const apiError =
          data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
            ? ((data as { error: string }).error || '').trim()
            : '';
        update({
          status: 'error',
          message:
            response.status === 402
              ? 'Stripe has not confirmed this payment yet. If you just paid, wait a moment and try again. Your plan has not been changed.'
              : apiError
                ? `${apiError} Your plan has not been changed.`
                : GENERIC_VERIFY_ERROR,
        });
        return;
      }

      const session = parseVerifiedSession(data, sessionId);
      if (!session) {
        update({ status: 'error', message: GENERIC_VERIFY_ERROR });
        return;
      }

      // Idempotent: a refresh or second visit never adds a duplicate invoice.
      const alreadyRecorded = invoicesRef.current.some((i) => i.stripeSessionId === session.id);
      if (!alreadyRecorded) {
        const invoice: InvoiceRecord = {
          id: invoiceIdForSession(session.id),
          date: todayLabel(),
          planName: PRICING_PLANS[session.planId].name,
          billingCycle: session.billingCycle,
          amount: session.formattedTotal,
          status: 'Paid',
          stripeSessionId: session.id,
          currency: session.currency,
        };
        saveRef.current(
          session.planId,
          session.billingCycle,
          9999,
          [invoice, ...invoicesRef.current],
          session.currency
        );
      }

      update({ status: 'success', session });
    })();
  }, [sessionId, isLoaded, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // ---- Live (Stripe redirect) flow -------------------------------------
  if (sessionId) {
    if (!isLoaded || verify.status === 'loading') {
      return <VerifyingState />;
    }
    if (verify.status === 'error') {
      return <VerifyErrorState message={verify.message} onRetry={retry} />;
    }
    const recorded =
      invoices.find((i) => i.stripeSessionId === verify.session.id) ??
      ({
        id: invoiceIdForSession(verify.session.id),
        date: todayLabel(),
        planName: PRICING_PLANS[verify.session.planId].name,
        billingCycle: verify.session.billingCycle,
        amount: verify.session.formattedTotal,
        status: 'Paid',
        stripeSessionId: verify.session.id,
        currency: verify.session.currency,
      } satisfies InvoiceRecord);
    return (
      <ReceiptView
        invoice={recorded}
        history={invoices.filter((i) => i.id !== recorded.id && !isPlaceholderInvoice(i))}
        customerEmail={verify.session.customerEmail}
        justVerified
      />
    );
  }

  // ---- Demo return / plain visit ----------------------------------------
  if (!isLoaded) return <ReceiptSkeleton />;

  const receipts = invoices.filter((i) => !isPlaceholderInvoice(i));
  const latest = receipts[0];
  if (!latest) return <EmptyState demo={isDemoReturn} />;

  return (
    <ReceiptView
      invoice={latest}
      history={receipts.slice(1)}
      forceDemoBanner={isDemoReturn}
    />
  );
}

/* -------------------------------------------------------------------------- */

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[900px] flex-1 space-y-8 px-4 py-10 sm:px-6 sm:py-12 print:max-w-none print:px-0 print:py-0">
      {children}
    </main>
  );
}

function ReceiptSkeleton() {
  return (
    <PageShell>
      <div role="status" aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <span className="sr-only">Loading your receipt…</span>
        <div className="space-y-4 motion-safe:animate-pulse" aria-hidden="true">
          <div className="h-6 w-1/3 rounded bg-slate-200" />
          <div className="h-4 w-1/2 rounded bg-slate-100" />
          <div className="h-24 rounded-xl bg-slate-100" />
        </div>
      </div>
    </PageShell>
  );
}

function VerifyingState() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  return (
    <PageShell>
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-xs"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <Loader2 className="h-6 w-6 motion-safe:animate-spin" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-bold text-slate-950 outline-none"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            Confirming your payment with Stripe…
          </h1>
          <p className="text-sm text-slate-600">This usually takes a second. Please keep this page open.</p>
        </div>
      </div>
    </PageShell>
  );
}

function VerifyErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  return (
    <PageShell>
      <div className="space-y-5 rounded-2xl border border-red-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700 ring-1 ring-red-100">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-bold text-slate-950 outline-none"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              We couldn&apos;t verify this payment
            </h1>
            <p role="alert" className="text-sm text-slate-700">
              {message}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_8px_20px_-8px_rgb(79_70_229/0.55)] transition-[background-color,transform] hover:bg-indigo-700 motion-safe:active:scale-[0.98] ${focusRing}`}
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/pricing"
            className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 ${focusRing}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to pricing
          </Link>
        </div>
        <p className="text-xs text-slate-600">
          If money left your account but this page keeps failing, contact support. Stripe keeps a record of every
          payment, so nothing is lost.
        </p>
      </div>
    </PageShell>
  );
}

function EmptyState({ demo }: { demo: boolean }) {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-xs">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <ReceiptIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h1
            className="text-xl font-bold text-slate-950"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            No receipts yet
          </h1>
          <p className="text-sm text-slate-600">
            {demo
              ? 'No demo checkout was recorded in this browser.'
              : 'Receipts for your Hashtagger upgrades will appear here.'}
          </p>
        </div>
        <Link
          href="/pricing"
          className={`inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22)] transition-colors hover:bg-indigo-700 motion-safe:active:scale-[0.98] ${focusRing}`}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          View plans
        </Link>
      </div>
    </PageShell>
  );
}

function DemoBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 print:border-amber-600"
    >
      <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
      <div className="space-y-0.5">
        <p className="text-sm font-bold">Demo receipt — no payment was taken</p>
        <p className="text-xs text-amber-900">
          This receipt comes from the demo checkout. No card was charged and it is not a tax invoice.
        </p>
      </div>
    </div>
  );
}

function ReceiptView({
  invoice,
  history,
  customerEmail,
  justVerified = false,
  forceDemoBanner = false,
}: {
  invoice: InvoiceRecord;
  history: InvoiceRecord[];
  customerEmail?: string | null;
  justVerified?: boolean;
  forceDemoBanner?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const kind = invoiceKind(invoice);
  const isDemo = kind === 'demo';
  const isStripe = kind === 'stripe';
  const curr = invoice.currency ? getCurrency(invoice.currency) : null;
  const description = planDescription(invoice.planName);
  const processorLabel = isStripe ? 'Stripe' : isDemo ? 'Demo (no charge)' : 'No charge';
  const statusLabel = isStripe ? invoice.status : isDemo ? 'Demo' : 'No charge';

  // After a fresh Stripe verification, move focus to the receipt heading.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (justVerified) headingRef.current?.focus();
  }, [justVerified]);

  const handleDownload = () => {
    const lines = [
      isDemo
        ? 'HASHTAGGER DEMO RECEIPT — NO PAYMENT WAS TAKEN'
        : isStripe
          ? 'HASHTAGGER PAYMENT RECEIPT'
          : 'HASHTAGGER RECEIPT',
      `Receipt number: ${invoice.id}`,
      `Date: ${invoice.date}`,
      `Plan: ${invoice.planName}`,
      `Billing: ${invoice.billingCycle === 'annual' ? 'Annual' : 'Monthly'}`,
      curr ? `Currency: ${curr.code}` : null,
      `Amount: ${invoice.amount}${isStripe ? '' : ' (not charged)'}`,
      `Payment: ${isStripe ? 'Stripe' : isDemo ? 'Demo checkout (no charge)' : 'No charge'}`,
      `Status: ${statusLabel}`,
      customerEmail ? `Email: ${customerEmail}` : null,
      '',
      'Thank you for choosing Hashtagger.',
    ].filter((l): l is string => l !== null);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${invoice.id}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <PageShell>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative space-y-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent print:hidden ${
            isDemo ? 'via-amber-500/70' : isStripe ? 'via-emerald-500/70' : 'via-slate-400/70'
          }`}
        />

        {(isDemo || forceDemoBanner) && <DemoBanner />}

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ${
                isDemo
                  ? 'bg-amber-50 text-amber-700 ring-amber-200'
                  : isStripe
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : 'bg-slate-100 text-slate-600 ring-slate-200'
              }`}
            >
              {isDemo ? (
                <FlaskConical className="h-6 w-6" aria-hidden="true" />
              ) : isStripe ? (
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              ) : (
                <ReceiptIcon className="h-6 w-6" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <span
                className={`block font-mono text-xs font-semibold uppercase tracking-wide ${
                  isDemo ? 'text-amber-800' : isStripe ? 'text-emerald-800' : 'text-slate-600'
                }`}
              >
                {isDemo
                  ? 'Demo checkout · no charge'
                  : isStripe
                    ? justVerified
                      ? 'Payment verified by Stripe'
                      : 'Paid via Stripe'
                    : 'No charge'}
              </span>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="mt-0.5 text-2xl font-bold text-slate-950 outline-none"
                style={{ fontFamily: 'var(--font-display), sans-serif' }}
              >
                {isDemo ? 'Demo Receipt' : isStripe ? 'Payment Receipt' : 'Receipt'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className={`inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-200 motion-safe:active:scale-[0.97] ${focusRing}`}
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className={`inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15)] transition-colors hover:bg-slate-800 motion-safe:active:scale-[0.97] ${focusRing}`}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span aria-live="polite">{downloadSuccess ? 'Saved!' : 'Download'}</span>
            </button>
          </div>
        </div>

        {/* Quick details */}
        <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs sm:grid-cols-4 print:bg-white print:ring-1 print:ring-slate-300">
          <div className="min-w-0">
            <dt className="text-slate-600">Receipt #</dt>
            <dd className="break-all font-mono font-bold text-slate-900">{invoice.id}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-slate-600">Date</dt>
            <dd className="font-bold text-slate-900">{invoice.date}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-slate-600">Processor</dt>
            <dd className="font-bold text-slate-900">{processorLabel}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-slate-600">Status</dt>
            <dd
              className={`flex items-center gap-1 font-bold ${
                isDemo ? 'text-amber-800' : isStripe ? 'text-emerald-800' : 'text-slate-700'
              }`}
            >
              {isDemo ? (
                <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
              ) : isStripe ? (
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              ) : null}
              {statusLabel}
            </dd>
          </div>
        </dl>

        {/* Line item */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:justify-between">
              <dt className="sr-only">Plan</dt>
              <dd className="min-w-0">
                <span className="block font-semibold text-slate-950">{invoice.planName}</span>
                <span className="mt-0.5 block text-xs text-slate-600">
                  {description ? `${description} · ` : ''}
                  {invoice.billingCycle === 'annual' ? 'billed annually' : 'billed monthly'}
                </span>
              </dd>
            </div>
            {curr && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
                <dt className="text-slate-600">Currency</dt>
                <dd className="font-mono font-medium text-slate-800">
                  <span aria-hidden="true">{curr.flag} </span>
                  {curr.code}
                </dd>
              </div>
            )}
            {customerEmail && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
                <dt className="text-slate-600">Receipt email</dt>
                <dd className="min-w-0 truncate font-medium text-slate-800">{customerEmail}</dd>
              </div>
            )}
            <div className="flex items-end justify-between gap-3 bg-slate-50/60 px-4 py-4 print:bg-white">
              <dt className="font-semibold text-slate-950">
                {isStripe ? 'Total paid' : 'Total (not charged)'}
                <span className="block text-xs font-normal text-slate-600">
                  per {invoice.billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </dt>
              <dd className="text-right font-mono text-xl font-bold tabular-nums text-slate-950">
                {invoice.amount}
              </dd>
            </div>
          </dl>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center print:hidden">
          <span className="text-xs text-slate-600">
            {isDemo
              ? 'Demo plan features are unlocked in this browser only.'
              : isStripe
                ? 'Your plan features are ready to use right now.'
                : 'No payment is associated with this receipt.'}
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className={`rounded-lg px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:text-slate-950 ${focusRing}`}
            >
              Change plan
            </Link>
            <Link
              href="/live-studio"
              className={`inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_6px_16px_-6px_rgb(79_70_229/0.55)] transition-[background-color,transform] hover:bg-indigo-700 motion-safe:active:scale-[0.97] ${focusRing}`}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Go to Live Studio</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {history.length > 0 && (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 print:break-inside-avoid print:border-slate-300">
          <h2
            className="text-base font-bold text-slate-950"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            Previous receipts
          </h2>
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[520px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Receipt #</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Date</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Plan</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Amount</th>
                  <th scope="col" className="py-2.5 pl-4 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 pr-4 font-mono font-bold text-slate-900">{inv.id}</td>
                    <td className="px-4 py-3 text-slate-700">{inv.date}</td>
                    <td className="px-4 py-3 text-slate-900">{inv.planName}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">{inv.amount}</td>
                    <td
                      className={`py-3 pl-4 text-right font-semibold ${
                        invoiceKind(inv) === 'demo'
                          ? 'text-amber-800'
                          : invoiceKind(inv) === 'stripe'
                            ? 'text-emerald-800'
                            : 'text-slate-700'
                      }`}
                    >
                      {invoiceKind(inv) === 'demo'
                        ? 'Demo (no charge)'
                        : invoiceKind(inv) === 'stripe'
                          ? inv.status
                          : 'No charge'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </PageShell>
  );
}

export default function ReceiptPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-slate-900 print:min-h-0 print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>
      <Suspense fallback={<ReceiptSkeleton />}>
        <ReceiptContent />
      </Suspense>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
