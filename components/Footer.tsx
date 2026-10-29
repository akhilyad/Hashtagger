import React from 'react';
import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Live Studio', href: '/live-studio' },
  { label: 'Why It Works', href: '/why-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Receipt', href: '/receipt' },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 py-8 text-xs text-slate-600">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <span>
          <span className="font-semibold text-slate-900">HASHTAGGER</span> — Instant
          Audience Discovery for Creators &amp; Brands
        </span>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
            {FOOTER_LINKS.map((link, idx) => (
              <li key={link.href} className="flex items-center">
                {idx > 0 && (
                  <span aria-hidden="true" className="px-1.5 text-slate-300">
                    ·
                  </span>
                )}
                <Link
                  href={link.href}
                  className="rounded px-1 py-0.5 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
