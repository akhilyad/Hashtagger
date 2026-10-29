'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Zap, Sparkles, Menu, X } from 'lucide-react';
import { useHashtaggerStore } from '@/lib/use-hashtagger-store';
import CurrencySelector from '@/components/CurrencySelector';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Live Studio', href: '/live-studio' },
  { label: 'Why It Works', href: '/why-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Receipt', href: '/receipt' },
];

const FOCUS_RING_DARK =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  // Tolerate a trailing slash (GitHub Pages export uses trailingSlash URLs).
  const normalized = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  return normalized === href;
}

export default function Navbar() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { isLoaded, currentPlan, selectedCurrency, setSelectedCurrency } =
    useHashtaggerStore();
  const isPaid = currentPlan === 'pro' || currentPlan === 'agency';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close the mobile menu on navigation (render-time reset, no effect needed).
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setMenuOpen(false);
  }

  // Close the mobile menu with Escape; return focus to the toggle only when
  // focus was inside the panel (so it is not lost when the panel unmounts).
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key !== 'Escape') return;
      const focusWasInPanel =
        !!panelRef.current && panelRef.current.contains(document.activeElement);
      setMenuOpen(false);
      if (focusWasInPanel) toggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const ctaClass = `inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 active:scale-[0.97] motion-reduce:active:scale-100 transition-[background-color,transform] whitespace-nowrap shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_4px_12px_-4px_rgb(52_211_153/0.5)] ${FOCUS_RING_DARK}`;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 sm:py-3.5 text-white">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3 md:gap-8">
        {/* Zone 1: Wordmark */}
        <Link
          href="/"
          className={`text-base sm:text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 rounded-sm ${FOCUS_RING_DARK}`}
          style={{ fontFamily: 'var(--font-display), sans-serif' }}
        >
          HASHTAGGER
        </Link>

        {/* Zone 2: Primary navigation (md and up) */}
        <nav
          aria-label="Main"
          className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-slate-300"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`transition-colors whitespace-nowrap shrink-0 rounded-sm ${FOCUS_RING_DARK} ${
                  isActive
                    ? 'text-emerald-400 font-semibold underline underline-offset-8 decoration-emerald-400 decoration-2'
                    : 'hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Currency, primary action, mobile menu toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          {/* The bar is too narrow for the selector below sm, so it moves into the menu there. */}
          <div className={`hidden sm:block ${isLoaded ? '' : 'invisible'}`}>
            <CurrencySelector
              value={selectedCurrency}
              onChange={setSelectedCurrency}
              variant="dark"
              size="sm"
              showLabel={false}
            />
          </div>

          <Link
            href={isPaid ? '/live-studio' : '/pricing'}
            // Hidden (but space-reserving) until the saved plan is read, so a
            // paid user never sees "Upgrade" flash.
            className={`${ctaClass} ${isLoaded ? '' : 'invisible'}`}
            aria-hidden={isLoaded ? undefined : true}
            tabIndex={isLoaded ? undefined : -1}
          >
            {isPaid ? (
              <>
                <Sparkles aria-hidden className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open Studio</span>
                <span className="sm:hidden">Studio</span>
              </>
            ) : (
              <>
                <Zap aria-hidden className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upgrade to Pro</span>
                <span className="sm:hidden">Upgrade</span>
              </>
            )}
          </Link>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className={`md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${FOCUS_RING_DARK}`}
          >
            {menuOpen ? <X aria-hidden className="w-5 h-5" /> : <Menu aria-hidden className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            ref={panelRef}
            id={menuId}
            key="mobile-menu"
            // No height/overflow clipping here: the currency dropdown inside
            // must be able to extend past the panel.
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            className="md:hidden"
          >
            <nav aria-label="Mobile" className="max-w-[1400px] mx-auto pt-3 pb-1">
              <ul className="flex flex-col gap-1 text-sm font-medium">
                {NAV_ITEMS.map((item) => {
                  const isActive = isActivePath(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${FOCUS_RING_DARK} ${
                          isActive
                            ? 'bg-slate-900 text-emerald-400 font-semibold'
                            : 'text-slate-200 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isActive && (
                          <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="sm:hidden mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-3 px-3">
                <span className="text-xs font-medium text-slate-300">Currency</span>
                <CurrencySelector
                  value={selectedCurrency}
                  onChange={setSelectedCurrency}
                  variant="dark"
                  size="sm"
                  showLabel={false}
                  align="right"
                />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
