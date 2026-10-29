'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  Coins,
  TrendingUp,
  Share2,
  Check,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';

export default function BentoFeatures() {
  const [selectedDemoCurrency, setSelectedDemoCurrency] = useState('EUR');

  const demoCurrencies = SUPPORTED_CURRENCIES.slice(0, 4);

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase font-mono block">
            Engineered For Virality
          </span>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 mt-1"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            Built Like High-Frequency Trading for Reach
          </h2>
        </div>
        <p className="text-xs text-slate-500 max-w-sm">
          Hashtagger removes algorithmic guesswork through multimodal vision,
          live trend web search, and localized Stripe checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 1: Multimodal Vision Scanning (7 Cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10 group-hover:bg-indigo-100/60 transition-colors" />

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase text-indigo-600 tracking-wider">
                Multimodal Latent Ingestion
              </span>
              <h3 className="text-xl font-bold text-slate-950 mt-0.5">
                Reads both your caption and your visual media
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
              Don’t just generate tags from a short caption. Upload your high-res
              photo or video frame. Gemini multimodal AI scans colors, subjects,
              lighting, and contextual subcultures.
            </p>
          </div>

          {/* Visual simulation strip */}
          <div className="mt-6 p-4 rounded-xl bg-slate-900 text-white font-mono text-xs space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Vision Ingestion
              </span>
              <span>1024-dim Latent Space</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Subject: Specialty Coffee Pour
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Palette: Warm Amber &amp; Wood
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Aesthetic: Slow Morning Studio
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: 3-Part Growth Mix (5 Cols) */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase text-emerald-700 tracking-wider">
                Balanced Allocation Strategy
              </span>
              <h3 className="text-xl font-bold text-slate-950 mt-0.5">
                The 3-Tier Reach Formula
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Never dump 30 broad tags into a post. Hashtagger balances
              fast-rising breakout tags, high-intent community tags, and broad
              category anchors.
            </p>
          </div>

          <div className="mt-6 space-y-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-emerald-950">Rising Micro-Tags</span>
              </div>
              <span className="font-mono text-emerald-800 font-bold">20% · High Engagement</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="font-semibold text-blue-950">Target Community</span>
              </div>
              <span className="font-mono text-blue-800 font-bold">50% · Core Audience</span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="font-semibold text-purple-950">Broad Category</span>
              </div>
              <span className="font-mono text-purple-800 font-bold">30% · Algorithm Signal</span>
            </div>
          </div>
        </div>

        {/* Card 3: Stripe Global Checkout & EUR Primary (5 Cols) */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold uppercase text-indigo-600 tracking-wider">
                  Global Stripe Payments
                </span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                  EUR Primary
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-950 mt-0.5">
                Pay in your local currency
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seamless Stripe checkout localized into Euros (€), Dollars ($),
              Pounds (£), Yen (¥), and more with instant 3D Secure verification.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              {demoCurrencies.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedDemoCurrency(c.code)}
                  className={`px-2.5 py-1 text-xs rounded-lg border font-mono font-medium transition-all cursor-pointer ${
                    selectedDemoCurrency === c.code
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.flag} {c.code}
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-950 text-white flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Creator Pro Plan:</span>
              <span className="text-base font-bold text-emerald-400">
                {selectedDemoCurrency === 'EUR' && '€15/mo (Primary)'}
                {selectedDemoCurrency === 'USD' && '$16/mo'}
                {selectedDemoCurrency === 'GBP' && '£13/mo'}
                {selectedDemoCurrency === 'CAD' && 'CA$22/mo'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: 5 Channels / Multi-Platform Calibrated (7 Cols) */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 tracking-wider">
                Cross-Platform Guardrails
              </span>
              <h3 className="text-xl font-bold text-slate-950 mt-0.5">
                Platform-calibrated tag counts &amp; constraints
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
              Every social network penalizes different behavior. Hashtagger
              automatically enforces Instagram’s 30-tag cap, TikTok’s character
              density, and X’s 2-tag algorithmic sweet spot.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { name: 'Instagram', cap: '30 Tags Max', sweet: '8-15 sweet spot' },
              { name: 'TikTok', cap: 'Caption Char Cap', sweet: '4-6 sweet spot' },
              { name: 'X / Twitter', cap: '2 Tags Max', sweet: 'High relevance' },
              { name: 'LinkedIn', cap: '3-5 Tags', sweet: 'Industry focus' },
            ].map((p, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
              >
                <span className="font-bold text-slate-950 block">{p.name}</span>
                <span className="text-[10px] text-slate-500 block font-mono">{p.cap}</span>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  {p.sweet}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

