'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PlanTierId,
  BillingCycle,
  InvoiceRecord,
  SavedBundle,
} from '@/lib/hashtag-data';

const STORAGE_KEY_BUNDLES = 'hashtagger_saved_bundles_v1';
const STORAGE_KEY_SUBSCRIPTION = 'hashtagger_subscription_v1';

export const FREE_DAILY_CREDIT_LIMIT = 3;

export const DEFAULT_SAVED_BUNDLES: SavedBundle[] = [
  {
    id: 'bundle-default-1',
    name: 'Morning Coffee & Studio Desk',
    platform: 'instagram',
    captionSnippet:
      'Dialing in a washed Ethiopian pour-over before a 6-hour deep work sprint...',
    tags: [
      '#slowmorningritual',
      '#desksetupideas',
      '#pourovercoffee',
      '#deepworkroutine',
      '#minimalworkspace',
      '#coffeetiktokaesthetic',
      '#morningroutine',
      '#specialtycoffee',
    ],
    createdAt: 'Oct 28, 2026',
  },
  {
    id: 'bundle-default-2',
    name: 'SaaS Product Launch Story',
    platform: 'linkedin',
    captionSnippet:
      'After 4 months of customer interviews with 60+ growth teams, we just shipped...',
    tags: [
      '#productledgrowth',
      '#useronboarding',
      '#b2bsaas',
      '#customerretention',
    ],
    createdAt: 'Oct 27, 2026',
  },
];

export const INITIAL_INVOICE: InvoiceRecord = {
  id: 'INV-839210',
  date: 'Oct 28, 2026',
  planName: 'Starter Free',
  billingCycle: 'annual',
  amount: '€0.00',
  status: 'Paid',
};

export function useHashtaggerStore() {
  const [currentPlan, setCurrentPlan] = useState<PlanTierId>('free');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>('EUR');
  const [creditsRemaining, setCreditsRemaining] = useState<number>(
    FREE_DAILY_CREDIT_LIMIT
  );
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([INITIAL_INVOICE]);
  const [savedBundles, setSavedBundles] =
    useState<SavedBundle[]>(DEFAULT_SAVED_BUNDLES);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const rawBundles = localStorage.getItem(STORAGE_KEY_BUNDLES);
      if (rawBundles) {
        const parsed = JSON.parse(rawBundles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedBundles(parsed);
        }
      }

      const rawSub = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      if (rawSub) {
        const parsedSub = JSON.parse(rawSub);
        if (parsedSub.currentPlan) setCurrentPlan(parsedSub.currentPlan);
        if (parsedSub.billingCycle) setBillingCycle(parsedSub.billingCycle);
        if (parsedSub.selectedCurrency) setSelectedCurrencyState(parsedSub.selectedCurrency);
        if (typeof parsedSub.creditsRemaining === 'number') {
          setCreditsRemaining(parsedSub.creditsRemaining);
        }
        if (Array.isArray(parsedSub.invoices) && parsedSub.invoices.length > 0) {
          setInvoices(parsedSub.invoices);
        }
      }
    } catch {
      // Ignore localStorage read errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setSelectedCurrency = useCallback((curr: string) => {
    setSelectedCurrencyState(curr);
    try {
      const rawSub = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      const parsed = rawSub ? JSON.parse(rawSub) : {};
      localStorage.setItem(
        STORAGE_KEY_SUBSCRIPTION,
        JSON.stringify({
          ...parsed,
          selectedCurrency: curr,
        })
      );
    } catch {
      // Ignore write error
    }
  }, []);

  const saveSubscription = useCallback(
    (
      nextPlan: PlanTierId,
      nextCycle: BillingCycle,
      nextCredits: number,
      nextInvoices: InvoiceRecord[],
      currencyOverride?: string
    ) => {
      setCurrentPlan(nextPlan);
      setBillingCycle(nextCycle);
      setCreditsRemaining(nextCredits);
      setInvoices(nextInvoices);
      if (currencyOverride) {
        setSelectedCurrencyState(currencyOverride);
      }
      try {
        const rawSub = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
        const parsed = rawSub ? JSON.parse(rawSub) : {};
        localStorage.setItem(
          STORAGE_KEY_SUBSCRIPTION,
          JSON.stringify({
            ...parsed,
            currentPlan: nextPlan,
            billingCycle: nextCycle,
            creditsRemaining: nextCredits,
            invoices: nextInvoices,
            selectedCurrency: currencyOverride || parsed.selectedCurrency || 'EUR',
          })
        );
      } catch {
        // Ignore write error
      }
    },
    []
  );

  const saveBundles = useCallback((nextBundles: SavedBundle[]) => {
    setSavedBundles(nextBundles);
    try {
      localStorage.setItem(STORAGE_KEY_BUNDLES, JSON.stringify(nextBundles));
    } catch {
      // Ignore write error
    }
  }, []);

  const decrementCredit = useCallback(() => {
    if (currentPlan === 'free') {
      const nextCredits = Math.max(0, creditsRemaining - 1);
      setCreditsRemaining(nextCredits);
      try {
        const rawSub = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
        const parsed = rawSub ? JSON.parse(rawSub) : {};
        localStorage.setItem(
          STORAGE_KEY_SUBSCRIPTION,
          JSON.stringify({
            ...parsed,
            creditsRemaining: nextCredits,
          })
        );
      } catch {
        // Ignore write error
      }
    }
  }, [currentPlan, creditsRemaining]);

  const resetCredits = useCallback(() => {
    setCreditsRemaining(FREE_DAILY_CREDIT_LIMIT);
    try {
      const rawSub = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      const parsed = rawSub ? JSON.parse(rawSub) : {};
      localStorage.setItem(
        STORAGE_KEY_SUBSCRIPTION,
        JSON.stringify({
          ...parsed,
          creditsRemaining: FREE_DAILY_CREDIT_LIMIT,
        })
      );
    } catch {
      // Ignore write error
    }
  }, []);

  const setZeroCredits = useCallback(() => {
    setCreditsRemaining(0);
    try {
      const rawSub = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      const parsed = rawSub ? JSON.parse(rawSub) : {};
      localStorage.setItem(
        STORAGE_KEY_SUBSCRIPTION,
        JSON.stringify({
          ...parsed,
          creditsRemaining: 0,
        })
      );
    } catch {
      // Ignore write error
    }
  }, []);

  return {
    isLoaded,
    currentPlan,
    setCurrentPlan,
    billingCycle,
    setBillingCycle,
    selectedCurrency,
    setSelectedCurrency,
    creditsRemaining,
    invoices,
    savedBundles,
    saveSubscription,
    saveBundles,
    decrementCredit,
    resetCredits,
    setZeroCredits,
  };
}
