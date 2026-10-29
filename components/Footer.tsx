import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-8 text-xs text-slate-500">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>HASHTAGGER — Instant Audience Discovery for Creators & Brands</span>
        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/live-studio" className="hover:text-slate-900 transition-colors">
            Live Studio
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/why-it-works" className="hover:text-slate-900 transition-colors">
            Why It Works
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/pricing" className="hover:text-slate-900 transition-colors">
            Pricing
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/receipt" className="hover:text-slate-900 transition-colors">
            Receipt
          </Link>
        </div>
      </div>
    </footer>
  );
}
