'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { Sparkles, Copy, Check, TrendingUp } from 'lucide-react';

interface DemoScenario {
  platform: 'Instagram' | 'TikTok' | 'X';
  caption: string;
  reach: string;
  tags: { tag: string; velocity: string; tier: 'emerging' | 'niche' | 'broad' }[];
}

const SCENARIOS: DemoScenario[] = [
  {
    platform: 'Instagram',
    caption: 'Dialing in a washed Ethiopian pour-over before a 6-hour deep work sprint ☕',
    reach: '840K impressions',
    tags: [
      { tag: '#slowmorningritual', velocity: '+85% surge', tier: 'emerging' },
      { tag: '#pourovercoffee', velocity: 'Active', tier: 'niche' },
      { tag: '#deepworkroutine', velocity: '+110%', tier: 'emerging' },
      { tag: '#specialtycoffee', velocity: 'Broad', tier: 'broad' },
    ],
  },
  {
    platform: 'TikTok',
    caption: '5:30 AM tempo run in the rain. 12km done before the city wakes up 🏃‍♂️⚡',
    reach: '1.4M views',
    tags: [
      { tag: '#runtokcommunity', velocity: '+142% viral', tier: 'emerging' },
      { tag: '#5amrunclub', velocity: '+64%', tier: 'emerging' },
      { tag: '#temporun', velocity: 'High intent', tier: 'niche' },
      { tag: '#marathontraining', velocity: 'Core', tier: 'broad' },
    ],
  },
  {
    platform: 'X',
    caption: 'Shipped our new real-time multimodal hashtag intelligence engine today 🚀',
    reach: '320K impressions',
    tags: [
      { tag: '#buildinpublic', velocity: '+95%', tier: 'emerging' },
      { tag: '#aiengineering', velocity: '+130% surge', tier: 'emerging' },
      { tag: '#indiehackers', velocity: 'Broad', tier: 'broad' },
    ],
  },
];

export default function InteractiveDemo() {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'scanning' | 'results'>('typing');
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = SCENARIOS[activeScenarioIdx];

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const runSimulation = async () => {
      setPhase('typing');
      setTypedText('');
      setCopied(false);

      const text = scenario.caption;

      // Reduced motion: skip the typewriter and scanning effect entirely.
      if (reduceMotion) {
        setTypedText(text);
        setPhase('results');
        return;
      }

      const stepDelay = Math.max(10, Math.floor(400 / text.length));

      for (let i = 1; i <= text.length; i++) {
        if (isCancelled) return;
        setTypedText(text.slice(0, i));
        await new Promise((r) => setTimeout(r, stepDelay));
      }

      if (isCancelled) return;
      await new Promise((r) => setTimeout(r, 120));

      setPhase('scanning');
      await new Promise((r) => setTimeout(r, 380));

      if (isCancelled) return;
      setPhase('results');
    };

    runSimulation();

    return () => {
      isCancelled = true;
    };
  }, [scenario.caption, reduceMotion]);

  const handleCopyTags = async () => {
    const textToCopy = scenario.tags.map((t) => t.tag).join(' ');
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      return; // Clipboard blocked (insecure context / permissions): no false "Copied!".
    }
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-md text-slate-900 relative">
      {/* Simulation card header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <span aria-hidden className="w-2.5 h-2.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
          <span className="font-bold text-slate-950 text-xs tracking-tight">
            Interactive Multimodal Engine
          </span>
        </div>

        {/* Platform switch tabs */}
        <div
          role="group"
          aria-label="Demo platform"
          className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg self-start sm:self-auto"
        >
          {SCENARIOS.map((s, idx) => (
            <button
              key={s.platform}
              type="button"
              aria-pressed={activeScenarioIdx === idx}
              onClick={() => setActiveScenarioIdx(idx)}
              className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md transition-[background-color,color,box-shadow,transform] active:scale-[0.96] motion-reduce:active:scale-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${
                activeScenarioIdx === idx
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s.platform}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field Preview Box */}
      <div className="space-y-3">
        <div className="rounded-xl bg-slate-50/90 border border-slate-200 p-3.5 min-h-[58px] flex items-center justify-between gap-3">
          <p
            aria-live="off"
            className="text-xs sm:text-sm text-slate-800 font-sans leading-relaxed break-words min-w-0"
          >
            <span>{typedText}</span>
            {phase === 'typing' && (
              <span aria-hidden className="inline-block w-1.5 h-4 align-middle bg-indigo-600 ml-1 motion-safe:animate-pulse" />
            )}
          </p>
        </div>

        {/* Pulse / Scanning bar */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              phase === 'typing'
                ? 'w-1/3 opacity-30 bg-indigo-600'
                : phase === 'scanning'
                ? 'w-full opacity-90 bg-indigo-600 motion-safe:animate-pulse'
                : 'w-full opacity-100 bg-emerald-500'
            }`}
          />
        </div>

        {/* Results Tag Area */}
        <div className="rounded-xl bg-slate-50/70 border border-slate-200/80 p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-slate-600 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Projected Reach:</span>
              <strong className="text-slate-900">{scenario.reach}</strong>
            </span>

            {phase === 'results' && (
              <button
                type="button"
                onClick={handleCopyTags}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 text-[11px] font-bold font-mono transition-[border-color,transform] active:scale-[0.97] motion-reduce:active:scale-100 shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
              >
                {copied ? (
                  <>
                    <Check aria-hidden className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700" role="status">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy aria-hidden className="w-3 h-3 text-slate-500" />
                    <span>Copy Tags</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="min-h-[64px] flex items-center">
            {phase === 'results' ? (
              <div className="w-full flex flex-wrap items-center gap-2">
                {scenario.tags.map((t) => {
                  const isEmerging = t.tier === 'emerging';
                  return (
                    <span
                      key={t.tag}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all shadow-2xs ${
                        isEmerging
                          ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                          : 'bg-white text-indigo-950 border-slate-200'
                      }`}
                    >
                      <span className="font-bold">{t.tag}</span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          isEmerging
                            ? 'bg-emerald-200/60 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.velocity}
                      </span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="w-full text-xs text-slate-600 font-mono flex items-center gap-2 pl-1">
                {phase === 'scanning' ? (
                  <>
                    <Sparkles aria-hidden className="w-3.5 h-3.5 text-indigo-600 motion-safe:animate-spin" />
                    <span className="text-slate-600">
                      Analyzing visual &amp; semantic latent clusters...
                    </span>
                  </>
                ) : (
                  <span>Generating optimized hashtag formula...</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
