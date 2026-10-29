'use client';

import React from 'react';
import { Flame, TrendingUp, Sparkles, Zap } from 'lucide-react';

interface MarqueeItem {
  tag: string;
  platform: 'Instagram' | 'TikTok' | 'X' | 'LinkedIn';
  velocity: string;
  reach: string;
  tier: 'Emerging' | 'Niche' | 'High Volume';
  highlight?: boolean;
}

const TRENDING_STREAM: MarqueeItem[] = [
  {
    tag: '#runtokcommunity',
    platform: 'TikTok',
    velocity: '+142% surge',
    reach: '840K',
    tier: 'Emerging',
    highlight: true,
  },
  {
    tag: '#slowmorningroutine',
    platform: 'Instagram',
    velocity: '+68% today',
    reach: '1.2M',
    tier: 'Niche',
  },
  {
    tag: '#productledgrowth',
    platform: 'LinkedIn',
    velocity: '+95% this week',
    reach: '410K',
    tier: 'Niche',
  },
  {
    tag: '#buildinpublic',
    platform: 'X',
    velocity: '+118% breakout',
    reach: '3.6M',
    tier: 'High Volume',
    highlight: true,
  },
  {
    tag: '#minimalworkspace',
    platform: 'Instagram',
    velocity: '+54% weekly',
    reach: '620K',
    tier: 'Emerging',
  },
  {
    tag: '#specialtycoffee',
    platform: 'TikTok',
    velocity: '+82% trending',
    reach: '950K',
    tier: 'Niche',
  },
  {
    tag: '#b2bmarketing',
    platform: 'LinkedIn',
    velocity: '+73% active',
    reach: '1.8M',
    tier: 'High Volume',
  },
  {
    tag: '#aiagents',
    platform: 'X',
    velocity: '+230% viral',
    reach: '5.1M',
    tier: 'High Volume',
    highlight: true,
  },
];

export default function TrendingMarquee() {
  // Duplicate array for seamless infinite marquee loop
  const stream = [...TRENDING_STREAM, ...TRENDING_STREAM];

  return (
    <div className="w-full relative overflow-hidden py-3 bg-slate-900/40 border-y border-slate-200/60 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max items-center gap-4 animate-[marquee_38s_linear_infinite] hover:[animation-play-state:paused] cursor-pointer">
        {stream.map((item, idx) => {
          const isEmerging = item.tier === 'Emerging';
          const isHigh = item.tier === 'High Volume';

          return (
            <div
              key={`${item.tag}-${idx}`}
              className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md transition-all shadow-xs ${
                item.highlight
                  ? 'bg-indigo-50/90 border-indigo-200/90 text-indigo-950 ring-1 ring-indigo-500/20'
                  : 'bg-white/80 border-slate-200 text-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Platform & Tier Pill */}
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                {item.platform}
              </span>

              {/* Tag */}
              <span className="font-bold font-mono tracking-tight text-slate-950">
                {item.tag}
              </span>

              {/* Velocity Badge */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isEmerging
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : isHigh
                    ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                    : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                }`}
              >
                {isEmerging ? (
                  <Flame className="w-3 h-3 text-emerald-600" />
                ) : isHigh ? (
                  <Zap className="w-3 h-3 text-purple-600" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-blue-600" />
                )}
                <span>{item.velocity}</span>
              </span>

              {/* Reach */}
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {item.reach} reach
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

