'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Sparkles } from 'lucide-react';
import { useHashtaggerStore } from '@/lib/use-hashtagger-store';

export default function Navbar() {
  const pathname = usePathname();
  const { currentPlan } = useHashtaggerStore();
  const isPaid = currentPlan === 'pro' || currentPlan === 'agency';

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Live Studio', href: '/live-studio' },
    { label: 'Why It Works', href: '/why-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Receipt', href: '/receipt' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 text-white">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0"
          style={{ fontFamily: 'var(--font-display), sans-serif' }}
        >
          HASHTAGGER
        </Link>

        {/* Zone 2: Concise navigation links with active route highlight */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors whitespace-nowrap shrink-0 ${
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

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          {isPaid ? (
            <Link
              href="/live-studio"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Studio</span>
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Upgrade to Pro</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
