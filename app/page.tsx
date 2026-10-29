import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Users, Compass, Zap, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import InteractiveDemo from '@/components/InteractiveDemo';
import TrendingMarquee from '@/components/TrendingMarquee';
import BentoFeatures from '@/components/BentoFeatures';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900 relative selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Live Stream Trending Marquee */}
      <TrendingMarquee />

      {/* Main Home Route: Hero, Interactive Demo, Bento Architecture, and Fast Actions */}
      <main className="flex-1 flex flex-col justify-center relative overflow-hidden">
        {/* Subtle Ambient Radial Glow Behind Hero */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-200/30 via-emerald-100/30 to-purple-200/20 blur-3xl -z-10 pointer-events-none rounded-full" />

        <section className="max-w-[1400px] w-full mx-auto px-6 py-12 lg:py-16 space-y-16">
          {/* 2-Column Split: Plain-English Copy on Left + Clean Light Demo on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column (7 Cols): Exact plain-English copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Next-Gen Multimodal Intelligence</span>
                </div>

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
                  TikTok, X, and LinkedIn.
                </p>
              </div>

              {/* Main Action Buttons */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/live-studio"
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all whitespace-nowrap shrink-0 shadow-md hover:shadow-indigo-500/20 active:scale-[0.99] cursor-pointer"
                  >
                    <span>Try It Free →</span>
                  </Link>

                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
                  >
                    <span>View Pricing (EUR Primary)</span>
                  </Link>
                </div>

                {/* Trust Sub-text */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    3 free posts every day
                  </span>
                  <span>•</span>
                  <span>Instagram, TikTok, X, LinkedIn</span>
                  <span>•</span>
                  <span>No credit card needed</span>
                </div>
              </div>
            </div>

            {/* Right Column (5 Cols): Clean Light Visual Preview */}
            <div className="lg:col-span-5 space-y-4">
              <InteractiveDemo />
            </div>
          </div>

          {/* Simple 3-Point Value Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-200">
            <div className="p-4 rounded-xl bg-white/70 border border-slate-200/60 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Trending Right Now</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Catches fast-rising tags before they get crowded so you capture early organic reach.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/70 border border-slate-200/60 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Topic Match</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pinpoints high-intent niche communities eager to engage with your specific topic.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/70 border border-slate-200/60 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
                <Compass className="w-4 h-4 text-amber-600" />
                <span>Ready to Copy &amp; Export</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                One-click copies formatted tag blocks or exports complete campaign spreadsheets.
              </p>
            </div>
          </div>

          {/* 21st.dev Bento Grid Feature Architecture */}
          <BentoFeatures />

          {/* Bottom Fast-Action CTA Banner */}
          <div className="rounded-2xl bg-slate-950 text-white p-8 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-mono font-semibold uppercase text-emerald-400">
                Instant Social Boost
              </span>
              <h3
                className="text-2xl sm:text-3xl font-bold tracking-tight text-white"
                style={{ fontFamily: 'var(--font-display), sans-serif' }}
              >
                Ready to stop guessing and start ranking?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Start with 3 free scans today or unlock unlimited real-time trends with localized Stripe checkout.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/live-studio"
                className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Studio Free</span>
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <span>View Plans</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
