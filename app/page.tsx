import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Users, Compass } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import InteractiveDemo from '@/components/InteractiveDemo';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900">
      <Navbar />

      {/* Main Home Route: Renders ONLY the Hero section, basic value, and main action buttons */}
      <main className="flex-1 flex flex-col justify-center">
        <section className="max-w-[1400px] w-full mx-auto px-6 py-12 lg:py-20 space-y-12">
          {/* 2-Column Split: Plain-English Copy on Left + Clean Light Demo on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column (7 Cols): Exact plain-English copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-semibold tracking-wider text-indigo-600 block">
                  Smart Hashtags for Social Media
                </span>

                <h1
                  className="font-bold tracking-tight text-slate-950 leading-[1.12]"
                  style={{
                    fontFamily: 'var(--font-display), sans-serif',
                    fontSize: 'clamp(2.25rem, 4.2vw, 3.75rem)',
                    textWrap: 'balance',
                  }}
                >
                  Get seen on social media without guessing your hashtags.
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                  Drop in your text or photo. Hashtagger picks the best trending
                  hashtags so more people actually see your posts on Instagram,
                  TikTok, and X.
                </p>
              </div>

              {/* Main Action Buttons */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/live-studio"
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-sm"
                  >
                    <span>Try It Free →</span>
                  </Link>

                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>View Pricing</span>
                  </Link>
                </div>

                {/* Trust Sub-text */}
                <p className="text-xs text-slate-500">
                  3 free posts every day · Instagram, TikTok, X, LinkedIn · No credit card needed
                </p>
              </div>
            </div>

            {/* Right Column (5 Cols): Clean Light Visual Preview */}
            <div className="lg:col-span-5 space-y-4">
              <InteractiveDemo />
            </div>
          </div>

          {/* Simple 3-Point Value Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Trending Right Now</span>
              </div>
              <p className="text-xs text-slate-500">
                Catches fast-rising tags before they get crowded so you get more views.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Topic Match</span>
              </div>
              <p className="text-xs text-slate-500">
                Finds the exact communities who care about what you are sharing.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
                <Compass className="w-4 h-4 text-amber-600" />
                <span>Ready to Copy</span>
              </div>
              <p className="text-xs text-slate-500">
                One click copies the full set so you can paste and publish immediately.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
