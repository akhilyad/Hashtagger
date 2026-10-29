'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Copy,
  Check,
  Upload,
  X,
  Search,
  RefreshCw,
  AlertCircle,
  Plus,
  FileText,
  Zap,
  TrendingUp,
  Bookmark,
  Info,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StripePaywallModal from '@/components/StripePaywallModal';
import { getPlanCharge } from '@/lib/currency';
import { apiUrl } from '@/lib/payments-config';
import {
  PlatformId,
  HashtagRecommendation,
  AnalysisResponse,
  SavedBundle,
  PLATFORM_SPECS,
  PRICING_PLANS,
  SAMPLE_CREATOR_POSTS,
} from '@/lib/hashtag-data';
import {
  useHashtaggerStore,
  FREE_DAILY_CREDIT_LIMIT,
} from '@/lib/use-hashtagger-store';

type ScanButtonState = 'idle' | 'scanning' | 'done';

const IS_DEV = process.env.NODE_ENV !== 'production';
const ANALYZE_TIMEOUT_MS = 12000;

type AnalyzeApiPayload = Partial<AnalysisResponse> & { error?: string };

function isAnalysisResponse(value: AnalyzeApiPayload | null): value is AnalysisResponse {
  return Boolean(value && !value.error && Array.isArray(value.hashtags));
}

export default function LiveStudioPage() {
  const initialSample = SAMPLE_CREATOR_POSTS[0];

  const {
    currentPlan,
    creditsRemaining,
    selectedCurrency,
    savedBundles,
    decrementCredit,
    saveBundles,
  } = useHashtaggerStore();

  const isPaidPlan = currentPlan === 'pro' || currentPlan === 'agency';
  const currentPlanName = PRICING_PLANS[currentPlan]?.name ?? PRICING_PLANS.free.name;
  const proAnnualPerMonth = getPlanCharge('pro', 'annual', selectedCurrency).formattedPerMonth;
  const prefersReducedMotion = useReducedMotion();

  // Stripe Paywall state
  const [paywallOpen, setPaywallOpen] = useState<boolean>(false);
  const [paywallReason, setPaywallReason] = useState<string | undefined>();

  // Core post & visual state
  const [platform, setPlatform] = useState<PlatformId>(initialSample.platform);
  const [caption, setCaption] = useState<string>(initialSample.caption);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    initialSample.imageDataUrl
  );
  const [imageLabel, setImageLabel] = useState<string>(
    initialSample.imageLabel
  );
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(
    null
  );
  const [uploadedImageMime, setUploadedImageMime] = useState<string | null>(
    null
  );

  // Scan Button State Machine: 'idle' | 'scanning' | 'done'
  const [scanState, setScanState] = useState<ScanButtonState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Set when the live analyze API failed and we fell back to sample data.
  // `reason` is only populated in development builds.
  const [sampleFallback, setSampleFallback] = useState<{ reason: string | null } | null>(
    null
  );
  const [analysis, setAnalysis] = useState<AnalysisResponse>(
    initialSample.initialAnalysis
  );

  // Copy feedbacks
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedSingleTag, setCopiedSingleTag] = useState<string | null>(null);
  const [copiedFullPost, setCopiedFullPost] = useState<boolean>(false);

  // Selected tags for inclusion
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '#slowmorningritual',
    '#desksetupideas',
    '#pourovercoffee',
    '#deepworkroutine',
    '#minimalworkspace',
    '#coffeetiktokaesthetic',
    '#morningroutine',
    '#specialtycoffee',
  ]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Save bundle input
  const [bundleNameInput, setBundleNameInput] = useState<string>('');
  const [showSaveInput, setShowSaveInput] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentSpec = PLATFORM_SPECS[platform];

  // Helper to sync selected tags from analysis
  const autoSelectTags = useCallback(
    (hashtagsList: HashtagRecommendation[]) => {
      const topTags = hashtagsList.slice(0, 8).map((h) => h.tag);
      setSelectedTags(topTags);
    },
    []
  );

  // Explicit user-initiated Scan action with strict 3-state logic
  const handleScanPost = async () => {
    if (!caption.trim() && !uploadedImageBase64) {
      setErrorMessage('Please type some text or add a photo to find hashtags.');
      return;
    }

    if (currentPlan === 'free' && creditsRemaining <= 0) {
      setPaywallReason(
        'You have used your 3 free daily posts. Unlock unlimited scans with Stripe checkout.'
      );
      setPaywallOpen(true);
      setErrorMessage(
        'You have used your 3 free daily posts. Upgrade to Creator Pro for unlimited scans.'
      );
      return;
    }

    // Transition to active scanning state
    setScanState('scanning');
    setErrorMessage(null);

    setSampleFallback(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

    let liveResult: AnalysisResponse | null = null;
    let validationError: string | null = null;
    let fallbackReason = 'Unknown error';

    try {
      const res = await fetch(apiUrl('/api/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          caption,
          platform,
          imageBase64: uploadedImageBase64 || undefined,
          imageMimeType: uploadedImageMime || undefined,
          useSearchGrounding: isPaidPlan,
        }),
      });
      const json = (await res.json().catch(() => null)) as AnalyzeApiPayload | null;

      if (res.ok && isAnalysisResponse(json)) {
        liveResult = json;
      } else if (res.status === 400 && json?.error) {
        // A fixable input problem: tell the user instead of faking results.
        validationError = json.error;
      } else {
        fallbackReason = json?.error || `Analyze API responded with HTTP ${res.status}`;
      }
    } catch (err: unknown) {
      // Network failure, timeout, or a static host (GitHub Pages) with no API routes.
      fallbackReason =
        err instanceof Error
          ? err.name === 'AbortError'
            ? `Request timed out after ${ANALYZE_TIMEOUT_MS / 1000}s`
            : err.message || 'Network error'
          : 'Network error';
    } finally {
      clearTimeout(timeoutId);
    }

    if (validationError) {
      setErrorMessage(validationError);
      setScanState('idle');
      return;
    }

    if (liveResult) {
      setAnalysis(liveResult);
      autoSelectTags(liveResult.hashtags);
      // Only real AI scans use up a free daily credit.
      if (currentPlan === 'free') {
        decrementCredit();
      }
      setScanState('done');
      return;
    }

    // Live AI unavailable: keep the page useful with sample data, but say so.
    await new Promise((r) => setTimeout(r, 650));
    const matchedPost =
      SAMPLE_CREATOR_POSTS.find((p) => p.platform === platform) ||
      SAMPLE_CREATOR_POSTS[0];
    if (IS_DEV) {
      console.warn('[live-studio] Falling back to sample results:', fallbackReason);
    }
    setAnalysis(matchedPost.initialAnalysis);
    autoSelectTags(matchedPost.initialAnalysis.hashtags);
    setSampleFallback({ reason: IS_DEV ? fallbackReason : null });
    setScanState('done');
  };

  // Handle Photo Upload
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a regular image file (PNG, JPG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || '';
      setImagePreviewUrl(result);
      setImageLabel(file.name);
      setUploadedImageBase64(base64Data);
      setUploadedImageMime(file.type);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImagePreviewUrl(null);
    setImageLabel('');
    setUploadedImageBase64(null);
    setUploadedImageMime(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 1-Click sample post loaders
  const handleSelectSample = (sampleId: string) => {
    const found = SAMPLE_CREATOR_POSTS.find((s) => s.id === sampleId);
    if (!found) return;

    setPlatform(found.platform);
    setCaption(found.caption);
    setImagePreviewUrl(found.imageDataUrl);
    setImageLabel(found.imageLabel);
    setUploadedImageBase64(null);
    setUploadedImageMime(null);
    setAnalysis(found.initialAnalysis);
    autoSelectTags(found.initialAnalysis.hashtags);
    setScanState('idle');
    setErrorMessage(null);
    setSampleFallback(null);
  };

  const toggleTagSelection = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Copy All Tags Handler with 2-second feedback
  const handleCopyAllTags = async () => {
    const allTags = analysis.hashtags.map((h) => h.tag);
    if (allTags.length === 0) return;
    await navigator.clipboard.writeText(allTags.join(' '));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Copy Selected Tags
  const handleCopySelectedTags = async () => {
    if (selectedTags.length === 0) return;
    await navigator.clipboard.writeText(selectedTags.join(' '));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Copy Full Post + Tags
  const handleCopyFullPost = async () => {
    const tagsBlock = selectedTags.join(' ');
    const fullText = caption.trim()
      ? `${caption.trim()}\n\n${tagsBlock}`
      : tagsBlock;
    await navigator.clipboard.writeText(fullText);
    setCopiedFullPost(true);
    setTimeout(() => setCopiedFullPost(false), 2000);
  };

  // Copy Single Tag
  const handleCopySingleTag = async (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(tag);
    setCopiedSingleTag(tag);
    setTimeout(() => setCopiedSingleTag(null), 1500);
  };

  // Append Tags to Caption
  const handleAppendTagsToCaption = () => {
    if (selectedTags.length === 0) return;
    const existingTags = selectedTags.filter((t) => !caption.includes(t));
    if (existingTags.length === 0) return;
    setCaption((prev) => `${prev.trim()}\n\n${existingTags.join(' ')}`);
  };

  // Save Bundle
  const handleSaveBundle = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTags.length === 0) return;

    if (!isPaidPlan && savedBundles.length >= 2) {
      setPaywallReason(
        'You have reached 2 saved sets on the free plan. Unlock unlimited saved hashtag sets with Stripe checkout.'
      );
      setPaywallOpen(true);
      setErrorMessage(
        'You have reached the 2 saved sets on the free plan. Upgrade to Pro for unlimited saved sets.'
      );
      return;
    }

    const name =
      bundleNameInput.trim() ||
      `${currentSpec.shortLabel} Tags (${selectedTags.length})`;

    const newBundle: SavedBundle = {
      id: `bundle-${Date.now()}`,
      name,
      platform,
      captionSnippet:
        caption.trim().slice(0, 75) + (caption.trim().length > 75 ? '...' : ''),
      tags: [...selectedTags],
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    saveBundles([newBundle, ...savedBundles]);
    setBundleNameInput('');
    setShowSaveInput(false);
  };

  // Group output tags into:
  // 1. Trending Right Now (popular tags for fast views)
  // 2. Best Match (tags that fit your specific topic)
  const trendingTags = analysis.hashtags.filter(
    (h) => h.tier === 'emerging' || h.tier === 'high_volume'
  );
  const bestMatchTags = analysis.hashtags.filter((h) => h.tier === 'niche');

  const filteredTrending = trendingTags.filter((h) =>
    searchQuery.trim()
      ? h.tag.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      h.reason.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true
  );

  const filteredBestMatch = bestMatchTags.filter((h) =>
    searchQuery.trim()
      ? h.tag.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      h.reason.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true
  );

  const totalCaptionLength =
    caption.length +
    (selectedTags.length > 0 ? selectedTags.join(' ').length + 2 : 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 space-y-8">
        {/* Usage banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">
              Plan: {currentPlanName}
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            {currentPlan === 'free' ? (
              <span className="font-mono tabular-nums text-slate-700">
                {creditsRemaining} of {FREE_DAILY_CREDIT_LIMIT} free daily posts remaining
              </span>
            ) : (
              <span className="font-mono tabular-nums text-emerald-700 font-semibold">
                Unlimited posts active
              </span>
            )}
          </div>

          <div>
            {currentPlan === 'free' ? (
              <button
                type="button"
                onClick={() => {
                  setPaywallReason(
                    'Upgrade to Creator Pro for unlimited multimodal scans, real-time trends, and exports.'
                  );
                  setPaywallOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm shadow-indigo-600/20 ring-1 ring-inset ring-white/10 transition-[background-color,transform] motion-safe:active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  Go Unlimited (from {proAnnualPerMonth}/mo)
                </span>
              </button>
            ) : (
              <span className="text-emerald-700 font-medium">{currentPlanName} active</span>
            )}
          </div>
        </div>

        {/* Page Header: Strictly rendered on a single line with exact title & subtitle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <h1
              className="text-xl sm:text-2xl font-bold text-slate-950 sm:whitespace-nowrap tracking-tight"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              Live #Studio - Test your next post
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Paste your text or add a photo to see what hashtags work best right now.
            </p>
          </div>

          {/* 1-Click Sample Post Buttons for fast testing */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 whitespace-nowrap">
              Try an Example:
            </span>
            {SAMPLE_CREATOR_POSTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${caption === sample.caption
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* 12-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (5 Cols): Inputs & Active Mix */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
              {/* Social Network Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Social Network
                  </label>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    Best: {currentSpec.optimalTagCount.min}–{currentSpec.optimalTagCount.max} tags
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-lg">
                  {(Object.keys(PLATFORM_SPECS) as PlatformId[]).map((pid) => {
                    const spec = PLATFORM_SPECS[pid];
                    const active = platform === pid;
                    return (
                      <button
                        key={pid}
                        type="button"
                        onClick={() => setPlatform(pid)}
                        className={`py-2 px-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${active
                            ? 'bg-white text-slate-950 shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-950'
                          }`}
                      >
                        {spec.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Caption Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="caption-input"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Your Post
                  </label>
                  <span
                    className={`text-xs font-mono tabular-nums ${totalCaptionLength > currentSpec.maxCharacterLimit
                        ? 'text-red-600 font-semibold'
                        : 'text-slate-500'
                      }`}
                  >
                    {totalCaptionLength}/{currentSpec.maxCharacterLimit} chars
                  </span>
                </div>

                <textarea
                  id="caption-input"
                  rows={5}
                  value={caption}
                  onChange={(e) => {
                    setCaption(e.target.value);
                    if (scanState === 'done') setScanState('idle');
                  }}
                  placeholder="Type or paste your post caption here..."
                  className="w-full rounded-lg border border-slate-200 bg-[#FAFAFA] p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none transition-colors resize-y leading-relaxed"
                />
              </div>

              {/* Upload Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Add a Photo (Optional)
                  </span>
                  {imagePreviewUrl && (
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                      if (scanState === 'done') setScanState('idle');
                    }
                  }}
                  className="hidden"
                />

                {imagePreviewUrl ? (
                  <div className="relative rounded-lg border border-slate-200 bg-slate-950 overflow-hidden">
                    <div className="aspect-[16/9] w-full relative flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreviewUrl}
                        alt={imageLabel || 'Photo preview'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center justify-between gap-2">
                        <span className="text-xs text-white font-medium truncate">
                          {imageLabel || 'Photo Added'}
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-xs font-medium bg-white/90 text-slate-900 rounded hover:bg-white transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-slate-300 hover:border-indigo-500 rounded-lg p-5 text-center cursor-pointer bg-[#FAFAFA] hover:bg-indigo-50/20 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-700">
                      Drop an image here or click to browse
                    </p>
                  </div>
                )}
              </div>

              {/* Scan Button (3-state logic: 'idle' -> 'scanning' -> 'done') */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  {currentSpec.name} rules applied
                </span>

                <button
                  type="button"
                  onClick={handleScanPost}
                  disabled={
                    scanState === 'scanning' ||
                    (!caption.trim() && !uploadedImageBase64)
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap rounded-lg cursor-pointer"
                >
                  {scanState === 'scanning' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Finding hashtags...</span>
                    </>
                  ) : scanState === 'done' ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Find New Hashtags</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Find Best Hashtags</span>
                    </>
                  )}
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Active Mix Tray */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-950">
                    Your Selected Mix
                  </h3>
                  <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    {selectedTags.length} tags chosen
                  </p>
                </div>

                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {selectedTags.length > 0 ? (
                <div className="p-3.5 rounded-lg bg-[#FAFAFA] border border-slate-200 flex flex-wrap gap-1.5">
                  {selectedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTagSelection(tag)}
                      title="Click to remove"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-white border border-slate-200 hover:border-red-300 hover:text-red-700 text-slate-800 rounded transition-colors cursor-pointer"
                    >
                      <span>{tag}</span>
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center">
                  Click any tag in the list to add it here.
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySelectedTags}
                    disabled={selectedTags.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Selected</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyFullPost}
                    disabled={selectedTags.length === 0 && !caption.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {copiedFullPost ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied Full Post</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>Copy Post + Tags</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleAppendTagsToCaption}
                    disabled={selectedTags.length === 0}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Post</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSaveInput((prev) => !prev)}
                  disabled={selectedTags.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Set</span>
                </button>
              </div>

              {showSaveInput && (
                <form
                  onSubmit={handleSaveBundle}
                  className="flex items-center gap-2 pt-2"
                >
                  <input
                    type="text"
                    value={bundleNameInput}
                    onChange={(e) => setBundleNameInput(e.target.value)}
                    placeholder="Name this set (e.g., Morning Coffee)..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-[#FAFAFA] focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 cursor-pointer"
                  >
                    Save
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column (7 Cols): Results Box Grouped into 2 Clear Sections */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-6">
              {/* Results Box Top Header with Search and Copy All Tags Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-950 flex flex-wrap items-center gap-2">
                    <span>Recommended Hashtags</span>
                    {sampleFallback && (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        Sample
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Grouped by how they help your post get seen
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-40 sm:w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter tags..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAFAFA] border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  {/* Required "Copy All Tags" Button showing "Copied!" for 2 seconds */}
                  <button
                    type="button"
                    onClick={handleCopyAllTags}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All Tags</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sample-data notice: shown when the live analyze API failed or is unreachable */}
              <AnimatePresence initial={false}>
                {sampleFallback && (
                  <motion.div
                    key="sample-fallback"
                    role="status"
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    transition={{ duration: prefersReducedMotion ? 0.1 : 0.22, ease: 'easeOut' }}
                    className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900"
                  >
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold">
                        Showing sample results — live AI is unavailable right now.
                      </p>
                      <p className="text-amber-800">
                        These tags come from an example post, not your caption. No free
                        scan was used. Try again in a moment.
                      </p>
                      {sampleFallback.reason && (
                        <p className="break-words font-mono text-[11px] text-amber-800">
                          Dev only: {sampleFallback.reason}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Group 1: Trending Right Now (popular tags for fast views) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-950">
                      Trending Right Now
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Popular tags for fast views
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredTrending.map((item) => {
                    const isSelected = selectedTags.includes(item.tag);
                    return (
                      <div
                        key={item.tag}
                        onClick={() => toggleTagSelection(item.tag)}
                        className={`p-3 rounded-xl border text-xs transition-colors cursor-pointer flex items-start justify-between gap-2 ${isSelected
                            ? 'bg-emerald-50/60 border-emerald-300'
                            : 'bg-[#FAFAFA] border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-950">
                              {item.tag}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                              {item.velocity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {item.reason}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleCopySingleTag(e, item.tag)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded shrink-0 cursor-pointer"
                        >
                          {copiedSingleTag === item.tag ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Best Match (tags that fit your specific topic) */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-950">
                      Best Match
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Tags that fit your specific topic
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredBestMatch.map((item) => {
                    const isSelected = selectedTags.includes(item.tag);
                    return (
                      <div
                        key={item.tag}
                        onClick={() => toggleTagSelection(item.tag)}
                        className={`p-3 rounded-xl border text-xs transition-colors cursor-pointer flex items-start justify-between gap-2 ${isSelected
                            ? 'bg-indigo-50/60 border-indigo-300'
                            : 'bg-[#FAFAFA] border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-950">
                              {item.tag}
                            </span>
                            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                              {item.relevanceScore}% match
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {item.reason}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleCopySingleTag(e, item.tag)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded shrink-0 cursor-pointer"
                        >
                          {copiedSingleTag === item.tag ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Helpful tip footer */}
              <div className="p-3.5 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                <span>
                  <strong>Tip for {currentSpec.name}:</strong> {analysis.platformTip}
                </span>
                <Link
                  href="/why-it-works"
                  className="text-indigo-600 hover:underline shrink-0 font-medium ml-2"
                >
                  Learn how tags work &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <StripePaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        initialPlan="pro"
        reason={paywallReason}
      />

      <Footer />
    </div>
  );
}
