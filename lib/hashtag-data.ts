export type PlatformId = 'instagram' | 'tiktok' | 'x' | 'linkedin' | 'youtube';

export type HashtagTier = 'emerging' | 'niche' | 'high_volume';

export type PlanTierId = 'free' | 'pro' | 'agency';

export type BillingCycle = 'monthly' | 'annual';

export interface PricingPlan {
  id: PlanTierId;
  name: string;
  audience: string;
  monthlyPrice: number;
  annualPricePerMonth: number;
  dailyCredits: number | 'Unlimited';
  maxSavedBundles: number | 'Unlimited';
  summary: string;
  highlights: string[];
  ctaLabel: string;
}

export interface InvoiceRecord {
  id: string;
  date: string;
  planName: string;
  billingCycle: BillingCycle;
  amount: string;
  status: 'Paid' | 'Demo';
  /** Stripe Checkout Session id when the invoice came from a verified live payment. */
  stripeSessionId?: string;
  currency?: string;
}

export interface ComparisonRow {
  capability: string;
  category: string;
  freeValue: string;
  proValue: string;
  agencyValue: string;
}

export const PRICING_PLANS: Record<PlanTierId, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Starter Free',
    audience: 'For creators testing what works',
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    dailyCredits: 3,
    maxSavedBundles: 2,
    summary:
      'Test 3 posts every day. Drop in your photo and caption to get a ready-to-post hashtag mix in under a second.',
    highlights: [
      '3 instant AI post analyses every day',
      'Reads both your caption and your uploaded photo',
      'Balanced 3-part mix (Rising, Community, and Broad)',
      'Save up to 2 reusable hashtag sets',
      'One-click copy for your post and tags',
    ],
    ctaLabel: 'Current Free Plan',
  },
  pro: {
    id: 'pro',
    name: 'Creator Pro',
    audience: 'For daily creators & growing brands',
    monthlyPrice: 19,
    annualPricePerMonth: 15,
    dailyCredits: 'Unlimited',
    maxSavedBundles: 'Unlimited',
    summary:
      'Publish without limits. Catch breaking cultural moments as they happen and export full campaign sheets.',
    highlights: [
      'Unlimited daily post & photo analyses',
      'Live Breaking Trends powered by real-time web search',
      'Unlimited saved hashtag collections',
      'One-click spreadsheet (CSV) download for every post',
      'Tuned for Instagram, TikTok, X, LinkedIn & YouTube',
    ],
    ctaLabel: 'Start Creator Pro',
  },
  agency: {
    id: 'agency',
    name: 'Growth Agency',
    audience: 'For teams managing multiple brands',
    monthlyPrice: 49,
    annualPricePerMonth: 39,
    dailyCredits: 'Unlimited',
    maxSavedBundles: 'Unlimited',
    summary:
      'Built for speed at scale. Run unlimited client campaigns, share winning tag sets, and export client reports.',
    highlights: [
      'Unlimited analyses with priority instant speed',
      'Live Breaking Trends with verified source links',
      'Unlimited client collections & shared presets',
      'Full CSV & JSON exports for client reporting',
      'Up to 10 team seats included',
    ],
    ctaLabel: 'Start Growth Agency',
  },
};

export const COMPARISON_MATRIX_ROWS: ComparisonRow[] = [
  {
    capability: 'Daily Post & Photo Analyses',
    category: 'Speed & Volume',
    freeValue: '3 / day',
    proValue: 'Unlimited',
    agencyValue: 'Unlimited (Priority)',
  },
  {
    capability: 'Automatic Photo & Visual Understanding',
    category: 'Visual Intelligence',
    freeValue: '1 photo per post',
    proValue: 'Unlimited high-res photos',
    agencyValue: 'Unlimited high-res photos',
  },
  {
    capability: 'Live Breaking Trends (Real-Time Web Search)',
    category: 'Trend Timing',
    freeValue: 'Not included',
    proValue: 'Included (Live)',
    agencyValue: 'Included + Source Links',
  },
  {
    capability: '3-Part Reach Mix (Rising, Community & Broad)',
    category: 'Growth Strategy',
    freeValue: 'Included',
    proValue: 'Included',
    agencyValue: 'Included',
  },
  {
    capability: 'Saved Hashtag Collections',
    category: 'Workflow',
    freeValue: '2 collections max',
    proValue: 'Unlimited collections',
    agencyValue: 'Unlimited shared collections',
  },
  {
    capability: 'Download & Export Options',
    category: 'Reporting',
    freeValue: 'One-click copy',
    proValue: 'Copy + CSV Spreadsheet',
    agencyValue: 'Copy + CSV + JSON',
  },
  {
    capability: 'Supported Social Networks',
    category: 'Channels',
    freeValue: 'All 5 networks',
    proValue: 'All 5 networks',
    agencyValue: 'All 5 networks',
  },
  {
    capability: 'Team Members Included',
    category: 'Access',
    freeValue: '1 person',
    proValue: '1 person',
    agencyValue: 'Up to 10 people',
  },
];

export interface HashtagRecommendation {
  tag: string;
  tier: HashtagTier;
  estimatedPosts: string;
  velocity: string;
  competition: 'Low' | 'Medium' | 'High';
  relevanceScore: number;
  reason: string;
}

export interface AnalysisResponse {
  summary: string;
  visualInsights?: string;
  recommendedRatio: {
    emerging: number;
    niche: number;
    highVolume: number;
  };
  platformTip: string;
  hashtags: HashtagRecommendation[];
  groundingSources?: { title: string; url: string }[];
}

export interface PlatformSpec {
  id: PlatformId;
  name: string;
  shortLabel: string;
  optimalTagCount: { min: number; max: number; ideal: number };
  maxCharacterLimit: number;
  idealRatio: { emerging: number; niche: number; highVolume: number };
  placementGuidance: string;
  algorithmFocus: string;
  cadenceTip: string;
}

export interface SavedBundle {
  id: string;
  name: string;
  platform: PlatformId;
  captionSnippet: string;
  tags: string[];
  createdAt: string;
}

export const PLATFORM_SPECS: Record<PlatformId, PlatformSpec> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    shortLabel: 'Instagram',
    optimalTagCount: { min: 5, max: 12, ideal: 8 },
    maxCharacterLimit: 2200,
    idealRatio: { emerging: 3, niche: 3, highVolume: 2 },
    placementGuidance:
      'Add your hashtags at the end of your caption after a clean line break so your hook stays easy to read.',
    algorithmFocus:
      'Matches the objects in your photo and the words in your caption with active interest communities.',
    cadenceTip:
      'Switch up your community tags every few posts to keep reaching fresh viewers.',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    shortLabel: 'TikTok',
    optimalTagCount: { min: 4, max: 7, ideal: 5 },
    maxCharacterLimit: 4000,
    idealRatio: { emerging: 2, niche: 2, highVolume: 1 },
    placementGuidance:
      'Place 4–6 punchy tags right after your opening line—mix 2 specific topic tags with 2 fast-rising trend tags.',
    algorithmFocus:
      'Pushes videos onto the For You Page by matching fast-moving trend tags with what happens on screen.',
    cadenceTip:
      'Skip generic #fyp tags and use specific community tags where viewers actually watch to the end.',
  },
  x: {
    id: 'x',
    name: 'X (Twitter)',
    shortLabel: 'X',
    optimalTagCount: { min: 1, max: 3, ideal: 2 },
    maxCharacterLimit: 280,
    idealRatio: { emerging: 1, niche: 1, highVolume: 0 },
    placementGuidance:
      'Weave 1 or 2 hashtags naturally inside your sentence instead of stacking them at the bottom.',
    algorithmFocus:
      'Connects your post to live conversations happening right now; keeping it to 2 tags maximizes shares.',
    cadenceTip: 'Tie your post to live product launches, events, or daily industry discussions.',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    shortLabel: 'LinkedIn',
    optimalTagCount: { min: 3, max: 5, ideal: 4 },
    maxCharacterLimit: 3000,
    idealRatio: { emerging: 1, niche: 2, highVolume: 1 },
    placementGuidance:
      'Place 3–4 focused professional tags at the very bottom of your post after your closing question.',
    algorithmFocus:
      'Delivers your post to decision-makers who follow specific industry topics and newsletters.',
    cadenceTip:
      'Pair 1 broad industry tag (#ProductManagement) with 2 focused specialty tags (#B2BSaaS, #CustomerGrowth).',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube Shorts & Video',
    shortLabel: 'YouTube',
    optimalTagCount: { min: 3, max: 8, ideal: 5 },
    maxCharacterLimit: 5000,
    idealRatio: { emerging: 2, niche: 2, highVolume: 1 },
    placementGuidance:
      'Your first 3 hashtags appear right above your video title—make them match what viewers search for.',
    algorithmFocus:
      'Helps viewers find your video both in the Shorts feed and in long-term YouTube search results.',
    cadenceTip:
      'Keep your total under 8 focused tags so YouTube knows exactly who to recommend your video to.',
  },
};

export interface SampleCreatorPost {
  id: string;
  label: string;
  platform: PlatformId;
  caption: string;
  imageLabel: string;
  imageDataUrl: string;
  initialAnalysis: AnalysisResponse;
}

function createSamplePostSvg(
  bgStart: string,
  bgEnd: string,
  accent: string,
  category: string,
  headline: string,
  subtext: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </linearGradient>
    </defs>
    <rect width="640" height="480" fill="url(#bg)" />
    <circle cx="520" cy="110" r="140" fill="${accent}" opacity="0.16" />
    <circle cx="120" cy="390" r="180" fill="${accent}" opacity="0.1" />
    <rect x="48" y="48" width="544" height="384" rx="16" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />
    <text x="84" y="120" fill="${accent}" font-family="sans-serif" font-size="15" font-weight="700" letter-spacing="2">${category}</text>
    <text x="84" y="210" fill="#ffffff" font-family="sans-serif" font-size="36" font-weight="700">${headline}</text>
    <text x="84" y="262" fill="rgba(255,255,255,0.78)" font-family="sans-serif" font-size="20" font-weight="400">${subtext}</text>
    <line x1="84" y1="330" x2="220" y2="330" stroke="${accent}" stroke-width="3" />
    <text x="84" y="372" fill="rgba(255,255,255,0.6)" font-family="monospace" font-size="14">PHOTO PREVIEW · READY FOR INSTANT SCAN</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_CREATOR_POSTS: SampleCreatorPost[] = [
  {
    id: 'specialty-coffee-reel',
    label: 'Morning Coffee & Studio Desk',
    platform: 'instagram',
    caption:
      'Dialing in a washed Ethiopian pour-over before a 6-hour deep work sprint. Switching to a minimalist oak desk setup and natural morning light completely changed my focus routine this quarter. What is your non-negotiable morning ritual?',
    imageLabel: 'Pour-Over Coffee & Minimalist Studio Desk',
    imageDataUrl: createSamplePostSvg(
      '#1C1917',
      '#292524',
      '#F59E0B',
      'CREATOR STUDIO & COFFEE',
      'Morning Pour-Over Ritual',
      'Natural oak desk · V60 carafe · Warm window light'
    ),
    initialAnalysis: {
      summary:
        'Connects your morning coffee ritual and clean oak workspace with creators who love focus habits and studio design.',
      visualInsights:
        'Spotted warm morning light, pour-over coffee gear, and a clean oak desk setup—paired with active workspace and coffee communities.',
      recommendedRatio: { emerging: 3, niche: 3, highVolume: 2 },
      platformTip:
        'Add these 8 tags at the end of your caption. Mixing 3 fast-rising morning routine tags with 3 workspace tags gives your post immediate momentum.',
      hashtags: [
        {
          tag: '#slowmorningritual',
          tier: 'emerging',
          estimatedPosts: '38.4K',
          velocity: '+44% this week',
          competition: 'Low',
          relevanceScore: 98,
          reason:
            'Taking off fast among creators sharing calm, focused morning routines before work.',
        },
        {
          tag: '#desksetupideas',
          tier: 'niche',
          estimatedPosts: '412K',
          velocity: '+19% this week',
          competition: 'Medium',
          relevanceScore: 96,
          reason:
            'Puts your oak desk photo directly in front of people saving home office inspiration.',
        },
        {
          tag: '#pourovercoffee',
          tier: 'niche',
          estimatedPosts: '685K',
          velocity: '+14% this week',
          competition: 'Medium',
          relevanceScore: 95,
          reason:
            'Dedicated specialty coffee community that actively comments on V60 and single-origin brews.',
        },
        {
          tag: '#deepworkroutine',
          tier: 'emerging',
          estimatedPosts: '21.9K',
          velocity: '+52% this week',
          competition: 'Low',
          relevanceScore: 94,
          reason:
            'Breakout tag for founders, designers, and builders sharing how they stay focused.',
        },
        {
          tag: '#minimalworkspace',
          tier: 'niche',
          estimatedPosts: '310K',
          velocity: '+16% this week',
          competition: 'Medium',
          relevanceScore: 92,
          reason:
            'Matches the clean natural light and uncluttered look of your studio photo.',
        },
        {
          tag: '#coffeetiktokaesthetic',
          tier: 'emerging',
          estimatedPosts: '64.2K',
          velocity: '+36% this week',
          competition: 'Low',
          relevanceScore: 89,
          reason:
            'High-save visual tag that performs strongly on both Reels and carousels.',
        },
        {
          tag: '#morningroutine',
          tier: 'high_volume',
          estimatedPosts: '4.8M',
          velocity: '+8% this week',
          competition: 'High',
          relevanceScore: 87,
          reason: 'Broad discovery tag that helps Instagram place your post in Explore.',
        },
        {
          tag: '#specialtycoffee',
          tier: 'high_volume',
          estimatedPosts: '3.2M',
          velocity: '+11% this week',
          competition: 'High',
          relevanceScore: 85,
          reason:
            'Global coffee feed anchor for long-term reach across coffee lovers.',
        },
        {
          tag: '#homebaristalife',
          tier: 'niche',
          estimatedPosts: '520K',
          velocity: '+15% this week',
          competition: 'Medium',
          relevanceScore: 84,
          reason:
            'Drives strong conversation from fellow home brewers.',
        },
        {
          tag: '#creativeworkspace',
          tier: 'emerging',
          estimatedPosts: '89.1K',
          velocity: '+29% this week',
          competition: 'Low',
          relevanceScore: 82,
          reason:
            'Reaches designers and marketers curating studio inspiration boards.',
        },
      ],
    },
  },
  {
    id: 'ai-product-launch',
    label: 'SaaS Product Launch Story',
    platform: 'linkedin',
    caption:
      'After 4 months of customer interviews with 60+ growth teams, we just shipped our automated retention cohort analyzer. Most B2B SaaS teams lose 30% of trial users in the first 48 hours due to friction in onboarding. Here is the exact 3-step activation framework we built to fix it.',
    imageLabel: 'SaaS Retention Dashboard Preview',
    imageDataUrl: createSamplePostSvg(
      '#0F172A',
      '#1E293B',
      '#38BDF8',
      'PRODUCT LAUNCH & GROWTH',
      'Customer Retention Playbook',
      '+34% Day-2 Activation · 60+ Growth Teams Interviewed'
    ),
    initialAnalysis: {
      summary:
        'Positions your product launch and 3-step onboarding playbook directly in front of SaaS founders and growth leaders.',
      visualInsights:
        'Spotted your retention chart and +34% activation result—matched with B2B product and customer growth feeds.',
      recommendedRatio: { emerging: 1, niche: 2, highVolume: 1 },
      platformTip:
        'Place 4 focused tags at the bottom of your LinkedIn post so decision-makers following SaaS growth topics see it in their feed.',
      hashtags: [
        {
          tag: '#productledgrowth',
          tier: 'niche',
          estimatedPosts: '148K',
          velocity: '+27% this week',
          competition: 'Medium',
          relevanceScore: 98,
          reason:
            'The #1 community tag for SaaS leaders focused on self-serve trials and onboarding.',
        },
        {
          tag: '#useronboarding',
          tier: 'emerging',
          estimatedPosts: '19.4K',
          velocity: '+41% this week',
          competition: 'Low',
          relevanceScore: 96,
          reason:
            'Directly matches your 48-hour trial fix with very low competition.',
        },
        {
          tag: '#b2bsaas',
          tier: 'niche',
          estimatedPosts: '390K',
          velocity: '+18% this week',
          competition: 'Medium',
          relevanceScore: 95,
          reason:
            'Core LinkedIn feed followed by software founders, operators, and VPs of Growth.',
        },
        {
          tag: '#customerretention',
          tier: 'niche',
          estimatedPosts: '215K',
          velocity: '+22% this week',
          competition: 'Medium',
          relevanceScore: 92,
          reason:
            'Connects directly with teams trying to reduce churn and keep users active.',
        },
        {
          tag: '#saasmetrics',
          tier: 'emerging',
          estimatedPosts: '34.8K',
          velocity: '+35% this week',
          competition: 'Low',
          relevanceScore: 90,
          reason:
            'Earns high saves and reposts from founders who love concrete numbers.',
        },
        {
          tag: '#productmanagement',
          tier: 'high_volume',
          estimatedPosts: '2.1M',
          velocity: '+9% this week',
          competition: 'High',
          relevanceScore: 86,
          reason: 'Broad LinkedIn topic channel for product leaders.',
        },
      ],
    },
  },
  {
    id: 'run-club-vlog',
    label: '5AM Marathon Run Club',
    platform: 'tiktok',
    caption:
      '5:15 AM tempo run along the waterfront—10 miles at 6:45/mi pace testing carbon-plated trainers before next month’s half marathon. Drop your current goal race in the comments and let’s build this season together.',
    imageLabel: 'Waterfront Sunrise Tempo Run & Carbon Shoes',
    imageDataUrl: createSamplePostSvg(
      '#064E3B',
      '#0F172A',
      '#34D399',
      'ENDURANCE & RUN CLUB',
      '10-Mile Sunrise Tempo',
      '6:45/mi Pace · Carbon-Plated Trainers · Half Marathon Prep'
    ),
    initialAnalysis: {
      summary:
        'Connects your 5:15 AM waterfront run and shoe test with TikTok’s fast-growing running and race-prep community.',
      visualInsights:
        'Spotted sunrise waterfront running, pace stats (6:45/mi), and carbon racing shoes.',
      recommendedRatio: { emerging: 2, niche: 2, highVolume: 1 },
      platformTip:
        'Drop 5 tags right after your call for comments—combining RunTok community tags with half-marathon prep drives immediate replies.',
      hashtags: [
        {
          tag: '#runtokcommunity',
          tier: 'emerging',
          estimatedPosts: '92.5K',
          velocity: '+61% this week',
          competition: 'Low',
          relevanceScore: 99,
          reason:
            'Fastest-growing TikTok running community tag that drives high comment activity.',
        },
        {
          tag: '#halfmarathontraining',
          tier: 'niche',
          estimatedPosts: '540K',
          velocity: '+24% this week',
          competition: 'Medium',
          relevanceScore: 97,
          reason:
            'Reaches fellow runners training for upcoming races this season.',
        },
        {
          tag: '#5amrunclub',
          tier: 'emerging',
          estimatedPosts: '47.2K',
          velocity: '+48% this week',
          competition: 'Low',
          relevanceScore: 95,
          reason: 'Matches your early-morning discipline and inspires viewers to comment.',
        },
        {
          tag: '#temporun',
          tier: 'niche',
          estimatedPosts: '280K',
          velocity: '+17% this week',
          competition: 'Medium',
          relevanceScore: 93,
          reason:
            'Connects with dedicated runners who follow pace workouts.',
        },
        {
          tag: '#runninggearreview',
          tier: 'emerging',
          estimatedPosts: '31.6K',
          velocity: '+39% this week',
          competition: 'Low',
          relevanceScore: 90,
          reason:
            'Reaches runners researching carbon-plated race shoes.',
        },
        {
          tag: '#marathontraining',
          tier: 'high_volume',
          estimatedPosts: '3.9M',
          velocity: '+12% this week',
          competition: 'High',
          relevanceScore: 86,
          reason:
            'Broad running category signal for the TikTok For You Page.',
        },
      ],
    },
  },
];
