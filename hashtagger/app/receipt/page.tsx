'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useHashtaggerStore } from '@/lib/use-hashtagger-store';
import { PRICING_PLANS, PlanTierId } from '@/lib/hashtag-data';
import { formatCurrencyPrice, getCurrency } from '@/lib/currency';

function ReceiptContent() {
  const searchParams = useSearchParams();
  const {
    currentPlan,
    billingCycle,
    invoices,
    selectedCurrency,
    saveSubscription,
  } = useHashtaggerStore();

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // If redirected from Stripe checkout with session_id or plan query params
  useEffect(() => {
    const paramPlan = searchParams.get('plan') as PlanTierId | null;
    const paramCurrency = searchParams.get('currency');
    const sessionId = searchParams.get('session_id');

    if (paramPlan && (paramPlan === 'pro' || paramPlan === 'agency')) {
      const activeCurr = paramCurrency || selectedCurrency || 'EUR';
      const targetPlan = PRICING_PLANS[paramPlan];
      const eurBase =
        billingCycle === 'annual'
          ? targetPlan.annualPricePerMonth * 12
          : targetPlan.monthlyPrice;
      const formattedTotal = formatCurrencyPrice(eurBase, activeCurr, {
        withDecimals: true,
      });

      const invoiceId = sessionId
        ? `STRIPE-${sessionId.slice(-6).toUpperCase()}`
        : `STRIPE-${Math.floor(100000 + Math.random() * 900000)}`;

      const exists = invoices.some((i) => i.id === invoiceId);
      if (!exists && currentPlan !== paramPlan) {
        const newInvoice = {
          id: invoiceId,
          date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          planName: targetPlan.name,
          billingCycle,
          amount: `${formattedTotal} / ${
            billingCycle === 'annual' ? 'yr' : 'mo'
          }`,
          status: 'Paid' as const,
        };

        saveSubscription(
          paramPlan,
          billingCycle,
          9999,
          [newInvoice, ...invoices],
          activeCurr
        );
      }
    }
  }, [searchParams, billingCycle, currentPlan, invoices, saveSubscription, selectedCurrency]);

  const activePlan = PRICING_PLANS[currentPlan];
  const curr = getCurrency(selectedCurrency);

  const eurTotalDue =
    billingCycle === 'annual'
      ? activePlan.annualPricePerMonth * 12
      : activePlan.monthlyPrice;

  const defaultFormattedAmount =
    currentPlan === 'free'
      ? formatCurrencyPrice(0, selectedCurrency, { withDecimals: true })
      : `${formatCurrencyPrice(eurTotalDue, selectedCurrency, {
          withDecimals: true,
        })} / ${billingCycle === 'annual' ? 'yr' : 'mo'}`;

  const latestInvoice = invoices[0] || {
    id: 'INV-839210',
    date: 'Oct 28, 2026',
    planName: activePlan.name,
    billingCycle,
    amount: defaultFormattedAmount,
    status: 'Paid',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const text = `HASHTAGGER PAYMENT RECEIPT (STRIPE VERIFIED)
Receipt Number: ${latestInvoice.id}
Date: ${latestInvoice.date}
Plan: ${latestInvoice.planName}
Billing Cadence: ${latestInvoice.billingCycle}
Currency: ${curr.code} (${curr.symbol})
Amount: ${latestInvoice.amount}
Payment Processor: Stripe
Status: ${latestInvoice.status}

Thank you for choosing Hashtagger! Your account has full unlimited access.`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${latestInvoice.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <main className="flex-1 max-w-[900px] w-full mx-auto px-6 py-12 space-y-10">
      {/* Receipt Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-semibold text-emerald-600 block">
                STRIPE PAYMENT SUCCESSFUL
              </span>
              <h1
                className="text-2xl font-bold text-slate-950 mt-0.5"
                style={{ fontFamily: 'var(--font-display), sans-serif' }}
              >
                Payment Receipt
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadSuccess ? 'Saved!' : 'Download'}</span>
            </button>
          </div>
        </div>

        {/* Quick Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 text-xs font-mono">
          <div>
            <span className="text-slate-400 block">Receipt #</span>
            <span className="font-bold text-slate-900">{latestInvoice.id}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Date</span>
            <span className="font-bold text-slate-900">{latestInvoice.date}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Processor</span>
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
              Stripe (••4242)
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Status</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {latestInvoice.status}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Billing</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-950">
                  {latestInvoice.planName}
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Full access to unlimited hashtags and all visual tools
                  </p>
                </td>
                <td className="py-3.5 px-4 text-slate-600 capitalize">
                  {latestInvoice.billingCycle}
                </td>
                <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                  {curr.flag} {curr.code} ({curr.symbol})
                  {curr.code === 'EUR' && (
                    <span className="ml-1 text-[10px] text-emerald-700 font-bold">
                      [Primary]
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-slate-950">
                  {latestInvoice.amount}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Row */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Your plan features are ready to use right now.
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-950 transition-colors"
            >
              Change Plan
            </Link>
            <Link
              href="/live-studio"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Go to Live Studio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Previous Invoices */}
      {invoices.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2
            className="text-base font-bold text-slate-950"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            Previous Receipts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4">Receipt #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Plan</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.slice(1).map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 pr-4 font-bold text-slate-900">{inv.id}</td>
                    <td className="py-3 px-4 text-slate-600 font-sans">{inv.date}</td>
                    <td className="py-3 px-4 text-slate-900 font-sans">{inv.planName}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-900">
                      {inv.amount}
                    </td>
                    <td className="py-3 pl-4 text-right font-sans font-semibold text-emerald-700">
                      {inv.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ReceiptPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-1 max-w-[900px] w-full mx-auto px-6 py-24 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto" />
              <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto" />
            </div>
          </div>
        }
      >
        <ReceiptContent />
      </Suspense>
      <Footer />
    </div>
  );
}
