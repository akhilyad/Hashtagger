'use client';

import React from 'react';
import { Flame, TrendingUp, Zap } from 'lucide-react';

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
  // The list is rendered twice so translateX(-50%) loops seamlessly. The copy
  // is hidden from assistive tech so each tag is announced only once, and it
  // is dropped entirely when the user prefers reduced motion (the strip then
  // becomes a static, horizontally scrollable row).
  const passes = [0, 1] as const;

  return (
    <section
      aria-label="Trending hashtags right now"
      className="group/marquee w-full relative overflow-hidden motion-reduce:overflow-x-auto py-3 bg-slate-900/40 border-y border-slate-200/60 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:[mask-image:none]"
    >
      <div className="flex w-max items-center animate-marquee motion-reduce:animate-none group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused]">
        {passes.map((pass) => (
          <ul
            key={pass}
            aria-hidden={pass === 1 ? true : undefined}
            className={`flex shrink-0 items-center gap-4 pr-4 ${
              pass === 1 ? 'motion-reduce:hidden' : 'motion-reduce:pl-4'
            }`}
          >
            {TRENDING_STREAM.map((item) => {
              const isEmerging = item.tier === 'Emerging';
              const isHigh = item.tier === 'High Volume';

              return (
                <li
                  key={`${item.tag}-${pass}`}
                  className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md shadow-xs whitespace-nowrap ${
                    item.highlight
                      ? 'bg-indigo-50/95 border-indigo-200/90 text-indigo-950 ring-1 ring-indigo-500/20'
                      : 'bg-white/90 border-slate-200 text-slate-800'
                  }`}
                >
                  {/* Platform pill */}
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                    {item.platform}
                  </span>

                  {/* Tag */}
                  <span className="font-bold font-mono tracking-tight text-slate-950">
                    {item.tag}
                  </span>

                  {/* Velocity badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      isEmerging
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                        : isHigh
                        ? 'bg-purple-50 text-purple-800 border-purple-200/60'
                        : 'bg-blue-50 text-blue-800 border-blue-200/60'
                    }`}
                  >
                    {isEmerging ? (
                      <Flame aria-hidden className="w-3 h-3 text-emerald-600" />
                    ) : isHigh ? (
                      <Zap aria-hidden className="w-3 h-3 text-purple-600" />
                    ) : (
                      <TrendingUp aria-hidden className="w-3 h-3 text-blue-600" />
                    )}
                    <span>{item.velocity}</span>
                  </span>

                  {/* Reach */}
                  <span className="text-[11px] text-slate-600 font-mono hidden sm:inline">
                    {item.reach} reach
                  </span>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </section>
  );
}
