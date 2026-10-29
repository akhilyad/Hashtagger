# ⚡ HASHTAGGER: Smart Multimodal Hashtag Intelligence & Trend Engine

> **Stop guessing your hashtags.** Hashtagger scans your post copy and uploaded images using Gemini multimodal AI to synthesize high-velocity, platform-optimized hashtags for Instagram, TikTok, X, LinkedIn, and YouTube.

---

## 🌟 Key Features

- **Multimodal AI Post Analysis**: Ingests both visual content (photos/imagery) and textual captions to detect niche communities, rising cultural topics, and algorithmic reach tiers.
- **Balanced 3-Part Growth Mix**: Automatically segments recommendations into:
  - 🟢 **Emerging / Rising**: Fast-growing micro-communities with high organic engagement.
  - 🔵 **Niche**: High-affinity targeted audience tags.
  - 🟣 **High Volume / Broad**: Core platform category signals.
- **Live Real-Time Breaking Trends**: Grounded in real-time web discovery to catch breakout moments before they become saturated.
- **Multi-Platform Support**: Tailored tag counts, character constraints, and formatting for **Instagram**, **TikTok**, **X (Twitter)**, **LinkedIn**, and **YouTube**.
- **One-Click Exports & Bundles**: Instant clipboard copy and full CSV spreadsheet downloads for creators and agency campaign management.

---

## 💳 Stripe Integration & Multi-Currency Engine

Hashtagger includes complete, production-ready **Stripe payment processing** with localized multi-currency support:

### 1. Primary Currency: Euro (€ / EUR)
- **Primary Base Currency**: Euro (`EUR`) is the primary currency throughout the platform.
- **Tier Pricing (EUR Base)**:
  - **Starter Free**: €0 / month (3 daily AI analyses, 2 saved bundles).
  - **Creator Pro**: €19 / month (or €15/mo billed annually) with unlimited analyses and live trends.
  - **Growth Agency**: €49 / month (or €39/mo billed annually) with priority speed and team seats.

### 2. Currency Dropdown Menu & Real-Time Conversion
Users can select their preferred checkout currency anywhere across the app (in the global **Navbar**, the **Pricing Page**, or directly inside the **Stripe Paywall Modal**):
- 🇪🇺 **EUR (€)** - *Euro (Primary)*
- 🇺🇸 **USD ($)** - *US Dollar*
- 🇬🇧 **GBP (£)** - *British Pound*
- 🇨🇦 **CAD (CA$)** - *Canadian Dollar*
- 🇦🇺 **AUD (A$)** - *Australian Dollar*
- 🇯🇵 **JPY (¥)** - *Japanese Yen (Zero-decimal currency)*
- 🇨🇭 **CHF (CHF)** - *Swiss Franc*
- 🇮🇳 **INR (₹)** - *Indian Rupee*

### 3. Stripe Checkout Flow
- **Server API Route**: `POST /api/stripe/checkout` dynamically creates Stripe Checkout Sessions with accurate currency codes and unit amounts (handles cents vs zero-decimal currencies like JPY).
- **Live vs Simulated Mode**:
  - When `STRIPE_SECRET_KEY` is provided, initiates an official 3D-Secure Stripe Checkout session redirect.
  - When keys are omitted (e.g. in local preview), automatically simulates a 256-bit bank authorization and unlocks the account into `/receipt` for testing.

---

## 🎨 Recommended 21st.dev Components & UI Themes

To take Hashtagger's visual design to the next level, here are curated recommendations from [21st.dev](https://21st.dev) (the premier open-source React/Tailwind component ecosystem):

### 🌈 Themes
1. **Cyber Obsidian & Hyper Emerald (Dark Mode)**
   - *Palette*: Deep slate/black substrate (`#020617`, `#0B0F19`), neon emerald accents (`#10B981`, `#76B900`), and pure white monospace metrics.
   - *Vibe*: High-frequency algorithmic trading meets creator SaaS.
2. **Minimalist Bento Grid (Light Mode - Current Default)**
   - *Palette*: Crisp `#FAFAFA` canvas, subtle slate-200 borders, indigo primary CTAs, and emerald status badges.
   - *Vibe*: Clean, trustworthy, and distraction-free.
3. **Aurora / Mesh Gradient Glow**
   - Soft radial ambient glow behind the Hero and interactive demo cards using blurred CSS background gradients.

### 🧩 21st.dev UI Components to Incorporate
1. **Animated Number Ticker / Counter** (`@magicui/number-ticker` on 21st.dev)
   - Smoothly animates numbers when switching currencies or viewing live tag counts and velocity percentages.
2. **Interactive Bento Grid** (`@aceternity/bento-grid` or `@magicui/bento-grid` on 21st.dev)
   - Ideal for the "Why It Works" architecture breakdown and platform capability comparisons.
3. **Animated Currency & Billing Segmented Tabs**
   - Sliding pill indicator with spring physics (Framer Motion) for switching between Monthly/Annual and Currency selection.
4. **Shimmer / Glow Border Card** (`@magicui/shining-card` or `@aceternity/moving-border` on 21st.dev)
   - Highlights the "Recommended" Creator Pro tier in pricing with an ethereal glowing border.
5. **Horizontal Infinite Tag Marquee** (`@magicui/marquee` on 21st.dev)
   - Smooth continuous ticker displaying trending hashtags across Instagram, TikTok, and X on the landing page.
6. **Confetti / Particle Canvas** (`canvas-confetti` or `@magicui/confetti` on 21st.dev)
   - Triggered upon successful Stripe payment on the `/receipt` page.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/akhilyad/Hashtagger.git
cd Hashtagger

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file (refer to `.env.example`):

```env
# Gemini Multimodal AI
GEMINI_API_KEY="your-gemini-api-key"

# Application URL
APP_URL="http://localhost:3000"

# Stripe Payments (Optional for live checkout; simulated mode is available)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Running the App

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Tailwind CSS, PostCSS, Lucide Icons, tw-animate-css
- **AI Core**: Google GenAI SDK (`@google/genai`)
- **Payments**: Stripe (`stripe`, `@stripe/stripe-js`)
- **Animations**: Motion (`motion`)
- **State Management**: React state with local-storage persistence (`lib/use-hashtagger-store.ts`)
