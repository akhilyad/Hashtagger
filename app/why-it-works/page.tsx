import React from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Users, Compass, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PLATFORM_SPECS, PlatformId } from '@/lib/hashtag-data';

export default function WhyItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-12 space-y-16">
        {/* Page Introduction - No numbers */}
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-semibold tracking-wider text-indigo-600 block">
            Simple Social Growth
          </span>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            How Hashtags Help More People See Your Posts
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            When you use only huge hashtags with millions of posts, your post disappears
            within seconds. When you combine fast-moving rising tags with topic tags,
            your post stays visible much longer.
          </p>
        </div>

        {/* The 3 Kinds of Tags - No numbers */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2
              className="text-2xl font-bold text-slate-950"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              The Three Kinds of Hashtags We Pick
            </h2>
            <p className="text-sm text-slate-600">
              A balanced mix gives you fast views right away and steady views over time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">
                1. Trending Right Now
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tags that are growing quickly today with low competition. They give your
                post its first boost of views in the first 30 minutes.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">
                2. Best Topic Match
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tags followed by people who care about your specific subject. These users
                are the most likely to like, comment, and follow you.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950">
                3. Broad Popular Tags
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Large category tags that help social apps understand what your post is
                about so it appears on Explore and Search feeds.
              </p>
            </div>
          </div>
        </section>

        {/* Real Results from Real Creators - No numbers */}
        <section className="bg-slate-900 text-white rounded-2xl p-8 lg:p-10 border border-slate-800 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono text-emerald-400">CREATOR RESULTS</span>
            <h2
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              Real Results from Creators
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Instagram Reels</span>
                <span className="text-emerald-400 font-bold">+218% More Views</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                “We used to paste the exact same 15 tags on every Reel and got stuck around 4,000 views. Testing fresh trending mixes pushed our average to over 13,000 views in one month.”
              </p>
              <div className="text-xs text-slate-400">
                Maya Lin · Coffee Roaster & Creator
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">LinkedIn Updates</span>
                <span className="text-emerald-400 font-bold">+340% Post Reach</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                “Using 3 to 4 specific tags placed at the bottom of our updates helped us reach founders and engineers who actually follow those topics.”
              </p>
              <div className="text-xs text-slate-400">
                David Chen · Startup Founder
              </div>
            </div>
          </div>
        </section>

        {/* Platform Rules - No numbers */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2
              className="text-2xl font-bold text-slate-950"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              Rules for Each Social App
            </h2>
            <p className="text-sm text-slate-600">
              Each social app looks for different numbers of tags.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/70">
                    <th className="py-3 px-4 font-semibold">App</th>
                    <th className="py-3 px-4 font-semibold">Best Tag Count</th>
                    <th className="py-3 px-4 font-semibold">Where to Put Them</th>
                    <th className="py-3 px-4 font-semibold">Helpful Tip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(Object.keys(PLATFORM_SPECS) as PlatformId[]).map((pid) => {
                    const spec = PLATFORM_SPECS[pid];
                    return (
                      <tr key={pid} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-950">
                          {spec.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                          {spec.optimalTagCount.min}–{spec.optimalTagCount.max} tags
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs leading-relaxed">
                          {spec.placementGuidance}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs leading-relaxed">
                          {spec.cadenceTip}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <div className="bg-indigo-600 text-white rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl font-bold">
              Test your next post now
            </h3>
            <p className="text-indigo-100 text-sm">
              Paste your caption in the Live Studio to get winning hashtags in less than a second.
            </p>
          </div>
          <Link
            href="/live-studio"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <span>Try It Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
