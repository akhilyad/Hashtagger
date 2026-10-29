'use client';

import { useMemo, useSyncExternalStore, type SetStateAction } from 'react';
import {
  PRICING_PLANS,
  PLATFORM_SPECS,
  type PlanTierId,
  type BillingCycle,
  type InvoiceRecord,
  type SavedBundle,
} from '@/lib/hashtag-data';
import { isSupportedCurrency, getCurrency, DEFAULT_CURRENCY_CODE } from '@/lib/currency';

/*
 * One shared, module-level store for the whole app.
 *
 * Every component that calls useHashtaggerStore() reads the same snapshot via
 * React's useSyncExternalStore, so the Navbar, the pricing page, the paywall
 * modal and the receipt can never disagree about plan, billing cycle or
 * currency. State is hydrated from localStorage lazily on the first client
 * subscription (the server snapshot is always the defaults with
 * isLoaded:false, so SSR and hydration markup match), every setter persists,
 * and the window 'storage' event keeps other tabs in sync.
 */

// Storage keys are unchanged for backward compatibility with existing users.
const STORAGE_KEY_BUNDLES = 'hashtagger_saved_bundles_v1';
const STORAGE_KEY_SUBSCRIPTION = 'hashtagger_subscription_v1';

export const FREE_DAILY_CREDIT_LIMIT = 3;
/** Upper bound accepted for any stored credit balance (paid plans use 9999). */
const MAX_CREDITS = 1_000_000;

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

/**
 * Id of the fabricated "Starter Free" invoice that older builds seeded into
 * every visitor's history. It is dropped on load so it stops showing up.
 */
const LEGACY_PLACEHOLDER_INVOICE_ID = 'INV-839210';

const NO_INVOICES: InvoiceRecord[] = Object.freeze([]) as unknown as InvoiceRecord[];

interface StoreState {
  isLoaded: boolean;
  currentPlan: PlanTierId;
  billingCycle: BillingCycle;
  selectedCurrency: string;
  creditsRemaining: number;
  invoices: InvoiceRecord[];
  savedBundles: SavedBundle[];
}

/** Server snapshot and pre-hydration client snapshot. Must stay referentially stable. */
const DEFAULT_STATE: StoreState = Object.freeze({
  isLoaded: false,
  currentPlan: 'free',
  billingCycle: 'annual',
  selectedCurrency: DEFAULT_CURRENCY_CODE,
  creditsRemaining: FREE_DAILY_CREDIT_LIMIT,
  invoices: NO_INVOICES,
  savedBundles: DEFAULT_SAVED_BUNDLES,
}) as StoreState;

let state: StoreState = DEFAULT_STATE;
let hydrated = false;
const listeners = new Set<() => void>();
let storageListenerAttached = false;

/* ------------------------------------------------------------------ */
/* Validation of anything read from localStorage                       */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isPlanId(value: unknown): value is PlanTierId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PRICING_PLANS, value);
}

function isBillingCycle(value: unknown): value is BillingCycle {
  return value === 'monthly' || value === 'annual';
}

function sanitizeCredits(value: unknown, plan: PlanTierId): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const whole = Math.floor(value);
  if (whole < 0 || whole > MAX_CREDITS) return null;
  return plan === 'free' ? Math.min(whole, FREE_DAILY_CREDIT_LIMIT) : whole;
}

function sanitizeInvoice(value: unknown): InvoiceRecord | null {
  if (!isRecord(value)) return null;
  const { id, date, planName, billingCycle, amount, status, stripeSessionId, currency } = value;
  if (
    !isNonEmptyString(id) ||
    !isNonEmptyString(date) ||
    !isNonEmptyString(planName) ||
    !isNonEmptyString(amount) ||
    !isBillingCycle(billingCycle) ||
    (status !== 'Paid' && status !== 'Demo')
  ) {
    return null;
  }
  const invoice: InvoiceRecord = { id, date, planName, billingCycle, amount, status };
  if (isNonEmptyString(stripeSessionId)) invoice.stripeSessionId = stripeSessionId;
  if (isSupportedCurrency(currency)) invoice.currency = getCurrency(currency).code;
  return invoice;
}

function sanitizeBundle(value: unknown): SavedBundle | null {
  if (!isRecord(value)) return null;
  const { id, name, platform, captionSnippet, tags, createdAt } = value;
  if (
    !isNonEmptyString(id) ||
    typeof name !== 'string' ||
    typeof captionSnippet !== 'string' ||
    typeof createdAt !== 'string' ||
    typeof platform !== 'string' ||
    !Object.prototype.hasOwnProperty.call(PLATFORM_SPECS, platform) ||
    !Array.isArray(tags)
  ) {
    return null;
  }
  return {
    id,
    name,
    platform: platform as SavedBundle['platform'],
    captionSnippet,
    createdAt,
    tags: tags.filter((t): t is string => typeof t === 'string'),
  };
}

function safeParse(raw: string | null): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Reads and validates persisted state. Invalid fields fall back to defaults. */
function readFromStorage(): StoreState {
  const next: StoreState = { ...DEFAULT_STATE, isLoaded: true };
  try {
    const bundles = safeParse(localStorage.getItem(STORAGE_KEY_BUNDLES));
    if (Array.isArray(bundles)) {
      const valid = bundles.map(sanitizeBundle).filter((b): b is SavedBundle => b !== null);
      // An explicitly saved empty list is respected (user deleted every bundle);
      // a list whose entries were all corrupt falls back to the defaults.
      if (valid.length > 0 || bundles.length === 0) next.savedBundles = valid;
    }

    const sub = safeParse(localStorage.getItem(STORAGE_KEY_SUBSCRIPTION));
    if (isRecord(sub)) {
      if (isPlanId(sub.currentPlan)) next.currentPlan = sub.currentPlan;
      if (isBillingCycle(sub.billingCycle)) next.billingCycle = sub.billingCycle;
      if (isSupportedCurrency(sub.selectedCurrency)) {
        next.selectedCurrency = getCurrency(sub.selectedCurrency).code;
      }
      const credits = sanitizeCredits(sub.creditsRemaining, next.currentPlan);
      if (credits !== null) next.creditsRemaining = credits;
      if (Array.isArray(sub.invoices)) {
        const valid = sub.invoices
          .map(sanitizeInvoice)
          .filter(
            (inv): inv is InvoiceRecord =>
              inv !== null && inv.id !== LEGACY_PLACEHOLDER_INVOICE_ID
          );
        if (valid.length > 0) next.invoices = valid;
      }
    }
  } catch {
    // localStorage unavailable (private mode, blocked storage): keep defaults.
  }
  return next;
}

function writeToStorage(s: StoreState, which: { subscription?: boolean; bundles?: boolean }) {
  try {
    if (which.subscription) {
      localStorage.setItem(
        STORAGE_KEY_SUBSCRIPTION,
        JSON.stringify({
          currentPlan: s.currentPlan,
          billingCycle: s.billingCycle,
          selectedCurrency: s.selectedCurrency,
          creditsRemaining: s.creditsRemaining,
          invoices: s.invoices,
        })
      );
    }
    if (which.bundles) {
      localStorage.setItem(STORAGE_KEY_BUNDLES, JSON.stringify(s.savedBundles));
    }
  } catch {
    // Ignore quota / availability errors; in-memory state still updates.
  }
}

/* ------------------------------------------------------------------ */
/* Store core                                                          */
/* ------------------------------------------------------------------ */

function emit() {
  listeners.forEach((listener) => listener());
}

function ensureHydrated() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  state = readFromStorage();
}

function handleStorageEvent(event: StorageEvent) {
  if (
    event.key !== null &&
    event.key !== STORAGE_KEY_SUBSCRIPTION &&
    event.key !== STORAGE_KEY_BUNDLES
  ) {
    return;
  }
  state = readFromStorage();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== 'undefined' && !storageListenerAttached) {
    window.addEventListener('storage', handleStorageEvent);
    storageListenerAttached = true;
  }
  if (!hydrated) {
    ensureHydrated();
    // Tell every mounted consumer (including this one) that hydrated data is ready.
    emit();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && storageListenerAttached && typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
      storageListenerAttached = false;
    }
  };
}

function getSnapshot(): StoreState {
  return state;
}

function getServerSnapshot(): StoreState {
  return DEFAULT_STATE;
}

function update(
  patch: Partial<Omit<StoreState, 'isLoaded'>>,
  which: { subscription?: boolean; bundles?: boolean }
) {
  ensureHydrated();
  const keys = Object.keys(patch) as (keyof typeof patch)[];
  if (keys.every((k) => Object.is(state[k], patch[k]))) return;
  state = { ...state, ...patch, isLoaded: hydrated || state.isLoaded };
  writeToStorage(state, which);
  emit();
}

/* ------------------------------------------------------------------ */
/* Actions (module-level, so they are referentially stable)            */
/* ------------------------------------------------------------------ */

function setCurrentPlan(next: SetStateAction<PlanTierId>) {
  ensureHydrated();
  const value = typeof next === 'function' ? next(state.currentPlan) : next;
  if (!isPlanId(value)) return;
  update({ currentPlan: value }, { subscription: true });
}

function setBillingCycle(next: SetStateAction<BillingCycle>) {
  ensureHydrated();
  const value = typeof next === 'function' ? next(state.billingCycle) : next;
  if (!isBillingCycle(value)) return;
  update({ billingCycle: value }, { subscription: true });
}

function setSelectedCurrency(curr: string) {
  if (!isSupportedCurrency(curr)) return;
  update({ selectedCurrency: getCurrency(curr).code }, { subscription: true });
}

function saveSubscription(
  nextPlan: PlanTierId,
  nextCycle: BillingCycle,
  nextCredits: number,
  nextInvoices: InvoiceRecord[],
  currencyOverride?: string
) {
  ensureHydrated();
  const patch: Partial<Omit<StoreState, 'isLoaded'>> = {
    invoices: nextInvoices,
  };
  if (isPlanId(nextPlan)) patch.currentPlan = nextPlan;
  if (isBillingCycle(nextCycle)) patch.billingCycle = nextCycle;
  if (typeof nextCredits === 'number' && Number.isFinite(nextCredits)) {
    patch.creditsRemaining = Math.max(0, Math.min(MAX_CREDITS, Math.floor(nextCredits)));
  }
  if (currencyOverride && isSupportedCurrency(currencyOverride)) {
    patch.selectedCurrency = getCurrency(currencyOverride).code;
  }
  update(patch, { subscription: true });
}

function saveBundles(nextBundles: SavedBundle[]) {
  update({ savedBundles: nextBundles }, { bundles: true });
}

function decrementCredit() {
  ensureHydrated();
  if (state.currentPlan !== 'free') return;
  update(
    { creditsRemaining: Math.max(0, state.creditsRemaining - 1) },
    { subscription: true }
  );
}

function resetCredits() {
  update({ creditsRemaining: FREE_DAILY_CREDIT_LIMIT }, { subscription: true });
}

function setZeroCredits() {
  update({ creditsRemaining: 0 }, { subscription: true });
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useHashtaggerStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(
    () => ({
      isLoaded: snapshot.isLoaded,
      currentPlan: snapshot.currentPlan,
      setCurrentPlan,
      billingCycle: snapshot.billingCycle,
      setBillingCycle,
      selectedCurrency: snapshot.selectedCurrency,
      setSelectedCurrency,
      creditsRemaining: snapshot.creditsRemaining,
      invoices: snapshot.invoices,
      savedBundles: snapshot.savedBundles,
      saveSubscription,
      saveBundles,
      decrementCredit,
      resetCredits,
      setZeroCredits,
    }),
    [snapshot]
  );
}
