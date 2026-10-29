'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const FULL_TEXT = 'Sharing our new project today!';

const DEMO_TAGS = [
  '#CreateEveryday',
  '#TechUpdate',
  '#SideProject',
];

export default function InteractiveDemo() {
  const [typedText, setTypedText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'scanning' | 'results'>('typing');

  useEffect(() => {
    let isCancelled = false;

    const runLoop = async () => {
      while (!isCancelled) {
        // Step 1: Typing text (0.0s – 0.6s)
        setPhase('typing');
        setTypedText('');
        const stepDelay = Math.max(12, Math.floor(550 / FULL_TEXT.length));
        for (let i = 1; i <= FULL_TEXT.length; i++) {
          if (isCancelled) return;
          setTypedText(FULL_TEXT.slice(0, i));
          await new Promise((r) => setTimeout(r, stepDelay));
        }

        if (isCancelled) return;
        await new Promise((r) => setTimeout(r, 100));

        // Step 2: Brief pulse / scan animation (0.6s – 1.0s = 0.4s)
        setPhase('scanning');
        await new Promise((r) => setTimeout(r, 400));

        if (isCancelled) return;

        // Step 3: Hashtag badges pop up (1.0s – 2.0s = 1.0s)
        setPhase('results');
        await new Promise((r) => setTimeout(r, 1000));

        if (isCancelled) return;
        await new Promise((r) => setTimeout(r, 150));
      }
    };

    runLoop();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-slate-900 select-none">
      {/* Simulation card header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-800 text-xs">
            Live Hashtag Preview
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          {phase === 'typing' && 'Typing caption...'}
          {phase === 'scanning' && (
            <span className="text-indigo-600 font-medium inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" />
              Scanning (0.4s)
            </span>
          )}
          {phase === 'results' && (
            <span className="text-emerald-700 font-medium">Ready</span>
          )}
        </div>
      </div>

      {/* Input Field Preview Box */}
      <div className="space-y-3">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 h-12 flex items-center">
          <p className="text-xs sm:text-sm text-slate-800 font-sans flex items-center">
            <span>{typedText}</span>
            {phase === 'typing' && (
              <span className="inline-block w-1.5 h-4 bg-indigo-600 ml-1 animate-pulse" />
            )}
          </p>
        </div>

        {/* Pulse / Scanning bar */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full bg-indigo-600 transition-all duration-300 ${
              phase === 'typing'
                ? 'w-1/3 opacity-30'
                : phase === 'scanning'
                ? 'w-full opacity-90 animate-pulse'
                : 'w-full opacity-100 bg-emerald-500'
            }`}
          />
        </div>

        {/* Results Tag Area (fixed height to prevent layout shift) */}
        <div className="h-16 rounded-xl bg-slate-50/60 border border-slate-100 p-2.5 flex items-center justify-start">
          {phase === 'results' ? (
            <div className="w-full flex flex-wrap items-center gap-2">
              {DEMO_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium font-mono text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-lg shadow-2xs animate-in fade-in duration-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <div className="w-full text-xs text-slate-400 font-mono flex items-center gap-2 pl-2">
              {phase === 'scanning' ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  <span className="text-slate-600">Finding trending hashtags...</span>
                </>
              ) : (
                <span>Hashtags will appear here</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
