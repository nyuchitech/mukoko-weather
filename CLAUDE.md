# CLAUDE.md — Project Context for Claude Code

## Project Overview

mukoko weather is an AI-powered weather intelligence platform, starting with Zimbabwe and expanding globally. It provides real-time weather data, 7-day forecasts, frost alerts, and AI-generated contextual advice for farming, mining, travel, and daily life. Locations span Zimbabwe (90+ seed locations), ASEAN countries, and developing regions across Africa — with new locations added dynamically by the community via geolocation and search.

**Live URL:** https://weather.mukoko.com

## Company Structure

- **Nyuchi Africa (PVT) Ltd** — parent company
- **Nyuchi Web Services** — technology/development arm (builds the product)
- **Mukoko Africa** — division of Nyuchi Africa
- **mukoko weather** — a Mukoko Africa product

Contact: support@mukoko.com, hi@mukoko.com, legal@nyuchi.com
Social: Twitter @mukokoafrica, Instagram @mukoko.africa

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router, TypeScript 5.9.3)
- **UI components:** shadcn/ui (new-york style, Lucide icons)
- **Charts:** Chart.js 4 + react-chartjs-2 (Canvas 2D rendering via `src/components/ui/chart.tsx`)
- **Maps:** Leaflet + react-leaflet (dynamic import, SSR disabled; Tomorrow.io tile overlays via `/api/map-tiles` proxy)
- **Styling:** Tailwind CSS 4 with CSS custom properties (Brand System v6)
- **Markdown:** react-markdown 10 (AI summary rendering)
- **State:** Zustand 5.0.11 (with `persist` middleware — theme + activities saved to localStorage)
- **AI:** Anthropic Claude SDK 0.73.0 (server-side only, Haiku 3.5 model `claude-haiku-4-5-20251001`)
- **Weather data:** Tomorrow.io API (primary, free tier) + Open-Meteo API (fallback)
- **Database:** MongoDB Atlas 7.1.0 (weather cache, AI summaries, historical data, locations; Atlas Search for fuzzy queries, Vector Search infrastructure for semantic search)
- **i18n:** Custom lightweight system (`src/lib/i18n.ts`) — English complete, Shona/Ndebele structurally ready
- **Analytics:** Google Analytics 4 (GA4, measurement ID `G-4KB2ZS573N`)
- **Testing:** Vitest 4.0.18
- **CI/CD:** GitHub Actions (tests + lint + typecheck on push/PR, CodeQL default setup, Claude AI review on PRs)
- **Deployment:** Vercel (with `@vercel/functions` for MongoDB connection pooling)
- **Edge layer (optional):** Cloudflare Workers with Hono (`worker/` directory)

## Key Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
npm test           # Run Vitest tests (single run)
npm run test:watch # Run Vitest in watch mode
npx tsc --noEmit   # Type check (no output)
```

## Project Structure

```
mukoko-weather/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout, metadata, JSON-LD schemas
│   │   ├── page.tsx                  # Home — redirects to /harare
│   │   ├── globals.css               # Brand System v6 CSS custom properties
│   │   ├── loading.tsx               # Root loading skeleton
│   │   ├── error.tsx                 # Global error boundary (client component)
│   │   ├── icon.svg                  # SVG favicon
│   │   ├── apple-icon.png            # Apple touch icon
│   │   ├── robots.ts                 # Dynamic robots.txt
│   │   ├── sitemap.ts                # Dynamic XML sitemap (all locations + pages)
│   │   ├── seo.test.ts               # SEO tests
│   │   ├── [location]/               # Dynamic weather pages (90+ locations)
│   │   │   ├── page.tsx              # Thin server wrapper (SEO, data fetch, JSON-LD)
│   │   │   ├── WeatherDashboard.tsx  # Client component — all weather UI with per-section error boundaries
│   │   │   ├── WeatherDashboard.test.ts
│   │   │   ├── loading.tsx           # Branded skeleton matching page layout
│   │   │   ├── error.tsx             # Location-specific error boundary (sessionStorage retry tracking)
│   │   │   ├── not-found.tsx         # 404 for invalid locations
│   │   │   ├── FrostAlertBanner.tsx  # Frost warning/advisory banner
│   │   │   ├── FrostAlertBanner.test.ts
│   │   │   ├── WeatherUnavailableBanner.tsx  # Weather data unavailability alert
│   │   │   ├── atmosphere/              # Atmospheric details sub-route
│   │   │   │   ├── page.tsx             # Server wrapper (SEO, data fetch)
│   │   │   │   ├── AtmosphereDashboard.tsx  # Client: 24h atmospheric charts
│   │   │   │   └── loading.tsx          # Branded skeleton
│   │   │   ├── forecast/               # Forecast details sub-route
│   │   │   │   ├── page.tsx             # Server wrapper (SEO, data fetch)
│   │   │   │   ├── ForecastDashboard.tsx # Client: hourly + daily + sun times
│   │   │   │   └── loading.tsx          # Branded skeleton
│   │   │   └── map/                     # Full-viewport weather map sub-route
│   │   │       ├── page.tsx             # Server wrapper (SEO, no weather fetch)
│   │   │       ├── MapDashboard.tsx     # Client: full-viewport Leaflet map + layer switcher
│   │   │       └── loading.tsx          # Full-viewport skeleton
│   │   ├── explore/                  # Browse-only location/tag/country exploration
│   │   │   ├── page.tsx              # Explore page (ISR 1h, category + country browse)
│   │   │   ├── loading.tsx           # Explore loading skeleton
│   │   │   ├── explore.test.ts       # Explore page tests
│   │   │   ├── [tag]/               # Browse locations by tag
│   │   │   │   ├── page.tsx          # Tag-filtered location list
│   │   │   │   └── loading.tsx
│   │   │   └── country/             # Browse locations by country/province
│   │   │       ├── page.tsx          # Country index page
│   │   │       ├── loading.tsx
│   │   │       ├── error.tsx
│   │   │       ├── [code]/           # Country detail (locations in country)
│   │   │       │   ├── page.tsx
│   │   │       │   ├── loading.tsx
│   │   │       │   ├── error.tsx
│   │   │       │   ├── not-found.tsx
│   │   │       │   └── [province]/   # Province detail (locations in province)
│   │   │       │       ├── page.tsx
│   │   │       │       ├── loading.tsx
│   │   │       │       ├── error.tsx
│   │   │       │       └── not-found.tsx
│   │   ├── shamwari/                 # Shamwari AI chat (full-viewport, Claude app style)
│   │   │   ├── page.tsx              # Server wrapper (metadata)
│   │   │   ├── ShamwariPageClient.tsx # Client: full-viewport chatbot layout
│   │   │   ├── loading.tsx           # ChatSkeleton loading state
│   │   │   └── shamwari.test.ts      # Page structure + layout tests
│   │   ├── status/                   # System health dashboard
│   │   │   ├── page.tsx              # Status page (metadata, layout)
│   │   │   └── StatusDashboard.tsx   # Client: live health checks for all services
│   │   ├── about/page.tsx            # About page
│   │   ├── help/
│   │   │   ├── page.tsx              # Help/FAQ page (server, metadata, JSON-LD)
│   │   │   └── FAQ.tsx               # Client: Accordion-based FAQ section
│   │   ├── history/                  # Historical weather data dashboard
│   │   │   ├── page.tsx              # History page (metadata, layout)
│   │   │   ├── HistoryDashboard.tsx  # Client-side dashboard (search, charts, table)
│   │   │   ├── HistoryDashboard.test.ts
│   │   │   └── error.tsx             # History page error boundary
│   │   ├── privacy/page.tsx          # Privacy policy
│   │   ├── terms/page.tsx            # Terms of service
│   │   ├── embed/page.tsx            # Widget embedding docs
│   │   └── api/
│   │       ├── weather/route.ts      # GET — proxy Tomorrow.io/Open-Meteo (MongoDB cached)
│   │       ├── ai/                   # POST — Claude AI summaries (tiered TTL cache)
│   │       │   ├── route.ts
│   │       │   └── ai-prompt.test.ts
│   │       ├── explore/route.ts      # POST — Shamwari Explorer chatbot (Claude + tool use)
│   │       ├── search/route.ts       # GET — location search (text, tag, geo queries)
│   │       ├── geo/route.ts          # GET — nearest location lookup (supports autoCreate)
│   │       ├── locations/            # Location data endpoints
│   │       │   ├── route.ts          # GET — list/filter locations from MongoDB
│   │       │   └── add/route.ts      # POST — add locations via search or coordinates
│   │       ├── activities/route.ts   # GET — activities (by ID, category, search, labels, categories)
│   │       ├── suitability/route.ts  # GET — suitability rules from MongoDB
│   │       ├── tags/route.ts         # GET — tag metadata (all or featured)
│   │       ├── regions/route.ts      # GET — active supported regions
│   │       ├── status/route.ts       # GET — system health checks (MongoDB, APIs, cache)
│   │       ├── history/route.ts      # GET — historical weather data
│   │       ├── map-tiles/route.ts    # GET — tile proxy for Tomorrow.io map layers
│   │       ├── og/                   # Dynamic OG image generation (Edge runtime, Satori)
│   │       │   ├── route.tsx         # GET — generates 1200×630 OG images with brand templates
│   │       │   └── og-route.test.ts  # OG route tests (templates, rate limiting, metadata wiring)
│   │       └── db-init/route.ts      # POST — one-time DB setup (indexes + seed data)
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives (Radix UI + CVA)
│   │   │   ├── button.tsx            # Button (6 variants, 5 sizes, asChild support)
│   │   │   ├── badge.tsx             # Badge (4 variants)
│   │   │   ├── card.tsx              # Card, CardHeader, CardContent, etc.
│   │   │   ├── chart.tsx             # CanvasChart, resolveColor (wraps Chart.js Canvas)
│   │   │   ├── dialog.tsx            # Dialog (Radix, portal, overlay, animations)
│   │   │   ├── input.tsx             # Input (styled with CSS custom properties)
│   │   │   ├── skeleton.tsx         # Skeleton, CardSkeleton, ChartSkeleton, BadgeSkeleton, MetricCardSkeleton, ChatSkeleton
│   │   │   ├── alert.tsx             # Alert, AlertTitle, AlertDescription (6 severity variants)
│   │   │   ├── accordion.tsx        # Accordion (Radix, animated open/close)
│   │   │   ├── section-header.tsx   # SectionHeader (title + optional action link/button)
│   │   │   ├── info-row.tsx         # InfoRow (label + value pair for data lists)
│   │   │   ├── toggle-group.tsx     # ToggleGroup (Radix, single/multiple, 3 variants incl. unstyled)
│   │   │   ├── scroll-area.tsx      # ScrollArea (Radix, custom scrollbar, horizontal/vertical)
│   │   │   ├── status-indicator.tsx # StatusDot + StatusBadge (severity-colored status indicators)
│   │   │   ├── cta-card.tsx         # CTACard (call-to-action card with title, description, action)
│   │   │   ├── chart-fallbacks.test.ts # CSS fallback table key parity tests
│   │   │   ├── primitives.test.ts   # Tests for UI primitive variants and exports
│   │   │   └── tabs.tsx              # Tabs (Radix, border-bottom active indicator)
│   │   ├── brand/                    # Branding components
│   │   │   ├── MukokoLogo.tsx        # Logo with text fallback
│   │   │   ├── MineralsStripe.tsx    # 5-mineral decorative stripe
│   │   │   ├── ThemeProvider.tsx     # Syncs Zustand theme to document, listens for OS changes
│   │   │   └── ThemeToggle.tsx       # Light/dark/system mode toggle (3-state cycle)
│   │   ├── analytics/
│   │   │   └── GoogleAnalytics.tsx   # Google Analytics 4 (gtag.js) via next/script
│   │   ├── explore/                  # Shamwari chatbot + AI explore search
│   │   │   ├── ExploreChatbot.tsx    # AI chatbot UI (message bubbles, typing indicator, contextual suggested prompts)
│   │   │   ├── ExploreChatbot.test.ts
│   │   │   ├── ExploreSearch.tsx     # AI-powered natural-language location search
│   │   │   └── ExploreSearch.test.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx            # Sticky header + 5-item mobile bottom nav (Weather/Explore/Shamwari/History/My Weather)
│   │   │   ├── HeaderSkeleton.tsx    # Header loading skeleton
│   │   │   └── Footer.tsx            # Footer with site stats, copyright, links, Ubuntu philosophy
│   │   ├── weather/
│   │   │   ├── CurrentConditions.tsx  # Large temp display, feels-like, stats grid
│   │   │   ├── HourlyForecast.tsx     # 24-hour hourly forecast
│   │   │   ├── HourlyChart.tsx        # Canvas chart: temperature + rain over 24h
│   │   │   ├── DailyForecast.tsx      # 7-day forecast cards
│   │   │   ├── DailyChart.tsx         # Canvas chart: high/low temps over 7 days
│   │   │   ├── AtmosphericSummary.tsx  # Compact metric cards (humidity, wind, pressure, UV, cloud, feels-like)
│   │   │   ├── AtmosphericDetails.tsx # Imports chart components for 24h atmospheric views
│   │   │   ├── LazyAtmosphericDetails.tsx # Lazy-load wrapper (React.lazy + Suspense)
│   │   │   ├── MetricCard.tsx           # MetricCard + ArcGauge (radial gauge with value display)
│   │   │   ├── ActivityCard.tsx        # ActivityCard (suitability card for a single activity)
│   │   │   ├── StatCard.tsx            # Reusable stat card (label + value)
│   │   │   ├── SectionSkeleton.tsx    # Generic section loading skeleton
│   │   │   ├── LazySection.tsx        # TikTok-style sequential lazy-load with bidirectional visibility
│   │   │   ├── LazySection.test.ts
│   │   │   ├── ChartErrorBoundary.tsx # Error boundary for chart/section crash isolation
│   │   │   ├── ChartErrorBoundary.test.ts
│   │   │   ├── CurrentConditions.test.ts
│   │   │   ├── charts/                # Reusable chart components (import TimeSeriesChart)
│   │   │   │   ├── TimeSeriesChart.tsx     # Base reusable Canvas chart (configurable series, axes, tooltips)
│   │   │   │   ├── TemperatureTrendChart.tsx  # High/low + feels-like temperature
│   │   │   │   ├── PrecipitationChart.tsx  # Rain bars + probability line (dual axis)
│   │   │   │   ├── UVCloudChart.tsx        # UV bars + cloud line (dual axis)
│   │   │   │   ├── WindSpeedChart.tsx      # Wind area + gusts dashed line
│   │   │   │   ├── PressureChart.tsx       # Barometric pressure (auto-scaled)
│   │   │   │   ├── HumidityCloudChart.tsx  # Humidity area + cloud dashed line
│   │   │   │   ├── HumidityChart.tsx       # Standalone humidity area
│   │   │   │   ├── UVIndexChart.tsx        # UV index bars
│   │   │   │   ├── DaylightChart.tsx       # Daylight hours area
│   │   │   │   ├── DewPointChart.tsx       # Dew point temperature
│   │   │   │   ├── GDDChart.tsx            # Growing degree days (farming)
│   │   │   │   ├── HeatStressChart.tsx     # Heat stress index
│   │   │   │   ├── ThunderstormChart.tsx   # Thunderstorm probability
│   │   │   │   └── VisibilityChart.tsx     # Visibility distance
│   │   │   ├── MyWeatherModal.tsx     # Centralized preferences modal (location, activities, settings)
│   │   │   ├── WeatherLoadingScene.tsx # Three.js weather loading animation (desktop only)
│   │   │   ├── charts.test.ts         # Tests for chart data preparation
│   │   │   ├── ActivityInsights.test.ts  # Severity helpers, moon phases, precip types
│   │   │   ├── ActivityCard.test.ts     # Suitability integration (levels, priority, fallbacks)
│   │   │   ├── AtmosphericSummary.test.ts # Gauge functions (UV, humidity, cloud, wind, pressure, feels-like)
│   │   │   ├── MetricCard.test.ts       # ArcGauge math, SVG geometry, ARIA contract
│   │   │   ├── DailyForecast.test.ts     # Temperature percent, gradient helpers
│   │   │   ├── SunTimes.tsx           # Sunrise/sunset display
│   │   │   ├── SeasonBadge.tsx        # Zimbabwe season indicator
│   │   │   ├── LocationSelector.tsx   # Search/filter dropdown, geolocation
│   │   │   ├── AISummary.tsx          # Shamwari AI markdown summary (onSummaryLoaded callback)
│   │   │   ├── AISummaryChat.tsx     # Inline follow-up chat (max 5 messages, then → Shamwari)
│   │   │   ├── AISummaryChat.test.ts
│   │   │   ├── HistoryAnalysis.tsx   # AI-powered historical weather analysis (button-triggered)
│   │   │   ├── HistoryAnalysis.test.ts
│   │   │   ├── ActivityInsights.tsx   # Category-specific weather insight cards
│   │   │   ├── reports/               # Waze-style community weather reporting
│   │   │   │   ├── WeatherReportModal.tsx   # 3-step wizard: select type → AI clarify → confirm
│   │   │   │   ├── WeatherReportModal.test.ts
│   │   │   │   ├── RecentReports.tsx        # Recent community reports with upvoting
│   │   │   │   └── RecentReports.test.ts
│   │   │   └── map/                   # Interactive weather map (Leaflet + Tomorrow.io tiles)
│   │   │       ├── MapPreview.tsx         # Compact map card on location page (links to /[location]/map)
│   │   │       ├── MapLayerSwitcher.tsx   # Layer toggle buttons (radiogroup)
│   │   │       ├── MapSkeleton.tsx        # Map loading skeleton
│   │   │       ├── LeafletMapPreview.tsx  # Leaflet preview (dynamic, ssr:false)
│   │   │       ├── LeafletMapFull.tsx     # Leaflet full interactive map (dynamic, ssr:false)
│   │   │       ├── leaflet-css.ts         # Leaflet CSS import
│   │   │       └── leaflet-icon-fix.ts    # Marker icon URL fix for bundlers
│   │   └── embed/
│   │       ├── MukokoWeatherEmbed.tsx          # Embeddable widget (current/forecast/badge)
│   │       ├── MukokoWeatherEmbed.module.css   # Self-contained widget CSS (no Tailwind)
│   │       ├── MukokoWeatherEmbed.test.ts
│   │       └── index.ts
│   ├── lib/
│   │   ├── store.ts               # Zustand app state (theme, location, activities, ShamwariContext, reportModal)
│   │   ├── store.test.ts          # Theme resolution, ShamwariContext TTL tests
│   │   ├── suggested-prompts.ts   # Database-driven suggested prompt generation (fetches from /api/py/ai/prompts)
│   │   ├── suggested-prompts.test.ts
│   │   ├── locations.ts           # WeatherLocation type, 90+ ZW seed locations, SUPPORTED_REGIONS, search, filtering
│   │   ├── locations.test.ts
│   │   ├── locations-africa.ts    # African city seed data (capitals + major cities across 54 AU member states)
│   │   ├── countries.ts           # Country/province types, seed data (54 AU + ASEAN), flag emoji, province slug generation
│   │   ├── countries.test.ts
│   │   ├── activities.ts          # Activity definitions for personalized weather insights
│   │   ├── activities.test.ts
│   │   ├── suitability.ts         # Database-driven suitability evaluation engine (evaluateRule)
│   │   ├── suitability.test.ts
│   │   ├── suitability-cache.ts   # Client-side cache for suitability rules + category styles (10-min TTL)
│   │   ├── suitability-cache.test.ts # Suitability cache tests
│   │   ├── tomorrow.ts            # Tomorrow.io API client + WMO normalization
│   │   ├── tomorrow.test.ts
│   │   ├── weather.ts             # Open-Meteo client, frost detection, weather utils, synthesizeOpenMeteoInsights
│   │   ├── weather.test.ts
│   │   ├── weather-labels.ts      # Contextual label helpers (humidityLabel, pressureLabel, cloudLabel, feelsLikeContext)
│   │   ├── weather-labels.test.ts
│   │   ├── mongo.ts               # MongoDB Atlas connection pooling
│   │   ├── db.ts                  # Database CRUD + Atlas Search/Vector Search (weather_cache, ai_summaries, weather_history, locations, rate_limits, activities, suitability_rules, tags, regions, seasons, ai_prompts, ai_suggested_rules, weather_reports, history_analysis)
│   │   ├── db.test.ts
│   │   ├── geocoding.ts           # Nominatim reverse geocoding, Open-Meteo forward geocoding, slug generation
│   │   ├── geocoding.test.ts
│   │   ├── rate-limit.ts          # MongoDB-backed IP rate limiter (atomic findOneAndUpdate)
│   │   ├── rate-limit.test.ts
│   │   ├── observability.ts       # Structured error logging + GA4 error reporting
│   │   ├── observability.test.ts
│   │   ├── geolocation.ts         # Browser Geolocation API wrapper (supports auto-creation)
│   │   ├── geolocation.test.ts
│   │   ├── weather-icons.tsx      # SVG weather/UI icons (MapPin, Clock, Search, Sun, Moon, etc.) + ActivityIcon
│   │   ├── weather-icons.test.ts
│   │   ├── i18n.ts                # Lightweight i18n (en complete, sn/nd ready)
│   │   ├── i18n.test.ts
│   │   ├── circuit-breaker.ts     # Netflix Hystrix-inspired circuit breaker (per-provider resilience)
│   │   ├── circuit-breaker.test.ts
│   │   ├── map-layers.ts          # Map layer config (Tomorrow.io tile layers, mineral color styles)
│   │   ├── map-layers.test.ts
│   │   ├── error-retry.ts         # Error retry logic with sessionStorage tracking (max 3 retries)
│   │   ├── error-retry.test.ts
│   │   ├── utils.ts               # Tailwind class merging helper (cn)
│   │   ├── utils.test.ts
│   │   ├── accessibility.test.ts  # Accessibility helpers tests
│   │   ├── seed-suitability-rules.ts # Seed suitability rules for db-init (condition-based evaluation)
│   │   ├── seed-categories.ts     # Seed activity categories with mineral color styles for db-init
│   │   ├── seed-tags.ts           # Seed tag metadata for db-init (powers explore page cards)
│   │   ├── seed-regions.ts        # Seed supported regions (bounding boxes) for db-init
│   │   ├── seed-seasons.ts        # Seed country-specific season definitions for db-init
│   │   ├── seed-ai-prompts.ts     # Seed AI prompts + suggested prompt rules for db-init
│   │   └── kv-cache.ts            # DEPRECATED — re-exports from db.ts for migration
│   └── types/
│       └── cloudflare.d.ts        # DEPRECATED — empty (KV migration complete)
├── api/
│   └── py/                        # Python FastAPI backend (Vercel serverless functions)
│       ├── index.py               # FastAPI app, router mounting, CORS, error handlers
│       ├── _db.py                 # MongoDB connection, collection accessors, rate limiting
│       ├── _weather.py            # Weather data endpoints (Tomorrow.io/Open-Meteo proxy)
│       ├── _ai.py                 # AI summary endpoint (Claude, tiered TTL cache)
│       ├── _ai_followup.py        # Inline follow-up chat endpoint (pre-seeded history)
│       ├── _ai_prompts.py         # AI prompt library CRUD (GET/PUT prompts + suggested rules)
│       ├── _chat.py               # Shamwari Explorer chatbot (Claude + tool use)
│       ├── _locations.py          # Location CRUD, search, geo lookup
│       ├── _history.py            # Historical weather data endpoint
│       ├── _history_analyze.py    # AI history analysis (server-side aggregation + Claude)
│       ├── _explore_search.py     # AI-powered explore search (Claude + tool use)
│       ├── _reports.py            # Community weather reports (submit, list, upvote, clarify)
│       ├── _suitability.py        # Suitability rules endpoint
│       ├── _data.py               # DB init, seed data, activities, tags, regions
│       ├── _devices.py            # Device sync (preferences across devices)
│       ├── _embeddings.py         # Vector embedding endpoints
│       ├── _status.py             # System health checks
│       └── _tiles.py              # Map tile proxy for Tomorrow.io
├── worker/                        # Cloudflare Workers edge API (optional)
│   ├── src/
│   │   ├── index.ts               # Hono app, route mounting, CORS
│   │   ├── routes/                # weather, ai, geo, locations, embed
│   │   ├── data/locations.ts      # Static locations data
│   │   └── types.ts
│   ├── wrangler.toml              # KV bindings, env vars, environments
│   ├── tsconfig.json
│   └── package.json               # Hono 4, Anthropic SDK, Wrangler 4
├── public/
│   ├── manifest.json              # PWA manifest (installable, shortcuts)
│   └── icons/                     # PWA icons (192px, 512px)
├── .github/
│   ├── ISSUE_TEMPLATE/            # Bug report and feature request templates
│   └── workflows/
│       ├── ci.yml                 # Tests, lint, type check on push/PR
│       └── claude-review.yml      # Claude AI code review on PRs
├── next.config.ts                 # CORS headers for /api/* and /embed/*
├── tsconfig.json                  # Strict, path alias @/* → ./src/*
├── vitest.config.ts               # Node env, glob src/**/*.test.ts
├── eslint.config.mjs              # Next.js core-web-vitals + TypeScript
├── postcss.config.mjs             # Tailwind CSS 4 plugin
├── components.json                # shadcn/ui configuration (new-york style)
├── CONTRIBUTING.md
├── README.md
├── SECURITY.md
└── LICENSE
```

## Architecture

### Layered Component Architecture (MANDATORY)

Every component and section in the app follows a strict layered architecture. This is not optional — all new components MUST implement every layer.

**Layer structure (bottom to top):**

```
Layer 1: Shared base components (TimeSeriesChart, CanvasChart, StatCard)
    ↓ imported by
Layer 2: Domain-specific components (HourlyChart, PressureChart, AISummary, etc.)
    ↓ imported by
Layer 3: Dashboard/page orchestrators (WeatherDashboard, HistoryDashboard, etc.)
    ↓ wrapped with
Layer 4: Isolation wrappers (LazySection + ChartErrorBoundary per section)
    ↓ rendered by
Layer 5: Server page wrappers (page.tsx — SEO, data fetching, error boundaries)
```

**Tiered component requirements:**

Not every component needs every layer. Requirements scale with component weight:

| Tier | Examples | Error Boundary | LazySection | Skeleton | Accessibility | Global Styles | Tests |
|------|----------|:-:|:-:|:-:|:-:|:-:|:-:|
| **Primitives** | Button, Badge, Card, Input, Skeleton | N/A | No | Loading/disabled state | Yes | Yes | Yes |
| **Composites** | StatCard, FrostAlertBanner, SeasonBadge | Parent boundary | No | Loading prop | Yes | Yes | Yes |
| **Sections** | Charts, AISummary, HourlyForecast | ChartErrorBoundary | LazySection | ChartSkeleton | Yes | Yes | Yes |
| **Pages** | WeatherDashboard, HistoryDashboard | page error.tsx | No | loading.tsx | Yes | Yes | Yes |

**Every component MUST have (at minimum):**
1. **Accessibility** — `aria-labelledby` with heading IDs, `aria-hidden` on decorative elements, `role` on skeletons, 44px minimum touch targets
2. **Global styles only** — Tailwind classes backed by CSS custom properties from `globals.css`; NEVER hardcoded hex/rgba/inline styles
3. **Tests** — co-located `.test.ts` files for all logic, data preparation, utilities

**Section-level components MUST additionally have:**
4. **Error boundary** — `ChartErrorBoundary` wrapping each section; a section crash never takes down the page
5. **Lazy loading** — `LazySection` with skeleton fallback; only ONE section mounts at a time (sequential queue)
6. **Skeleton placeholder** — aspect-matched loading placeholder shown before the section enters viewport
7. **Memory management** — bidirectional lazy loading (unmount when far off-screen), Canvas rendering (single DOM element per chart)
8. **Circuit breaker protection** — external API calls wrapped in circuit breakers to prevent cascade failures

**Chart component pattern:**
```
TimeSeriesChart (shared Canvas base — series configs, axes, tooltips)
    ↓ imported by
PressureChart / WindSpeedChart / HumidityChart / etc. (each defines its series config)
    ↓ imported by
AtmosphericDetails / HistoryDashboard / etc. (orchestrates layout, passes data)
    ↓ wrapped with
LazySection(fallback=<ChartSkeleton />) + ChartErrorBoundary
```

**Rules:**
- Components import from the layer below, never sideways or upward
- Each chart component is a standalone file in `src/components/weather/charts/`
- Dashboards NEVER hardcode chart rendering logic — import chart components
- All colors and styles come from CSS custom properties in `globals.css`
- New components must follow this pattern — no exceptions

### Circuit Breaker System

`src/lib/circuit-breaker.ts` — Netflix Hystrix-inspired circuit breaker for external API resilience.

**State machine:** CLOSED → OPEN → HALF_OPEN → CLOSED (on success) or OPEN (on failure)

**Per-provider singleton breakers:**
- `tomorrowBreaker` — Tomorrow.io API (3 failures / 2min cooldown / 60s window)
- `openMeteoBreaker` — Open-Meteo API (5 failures / 5min cooldown / 120s window)
- `anthropicBreaker` — Anthropic Claude API (3 failures / 5min cooldown / 120s window)

**Key classes:**
- `CircuitBreaker` — state machine with `execute<T>()`, `recordSuccess()`, `recordFailure()`, `reset()`
- `CircuitOpenError` — thrown when circuit is open, includes provider name
- `withTimeout(promise, ms)` — request timeout wrapper

**In-memory state:** `Map<string, CircuitBreakerState>` persists across Vercel warm function starts.

### Routing

**Philosophy:** The main location page (`/[location]`) is a compact overview — current conditions, AI summary, activity insights, and metric cards. Detail-heavy sections (charts, atmospheric trends, hourly/daily forecasts) live on dedicated sub-route pages. This reduces initial page load weight and prevents mobile OOM crashes from mounting all components simultaneously.

- `/` redirects to `/harare`
- `/[location]` — dynamic weather pages — overview: current conditions, AI summary, activity insights, atmospheric metric cards
- `/[location]/atmosphere` — 24-hour atmospheric detail charts (humidity, wind, pressure, UV) for a location
- `/[location]/forecast` — hourly (24h) + daily (7-day) forecast charts + sunrise/sunset for a location
- `/[location]/map` — full-viewport interactive weather map with layer switcher (precipitation, cloud, temperature, wind)
- `/shamwari` — Shamwari AI chat (full-viewport, Claude app style, input above mobile nav)
- `/explore` — browse locations by category and country (ISR 1h)
- `/explore/[tag]` — browse locations filtered by tag (city, farming, mining, tourism, etc.)
- `/explore/country` — browse locations by country index
- `/explore/country/[code]` — browse locations in a specific country (ISO alpha-2 code)
- `/explore/country/[code]/[province]` — browse locations in a specific province
- `/status` — system health dashboard (live checks: MongoDB, Tomorrow.io, Open-Meteo, Anthropic, cache)
- `/about` — about page (company info, contact details)
- `/privacy` — privacy policy
- `/terms` — terms of service
- `/help` — user help/FAQ
- `/history` — historical weather data dashboard (search, multi-day charts, data table)
- `/embed` — widget embedding docs
- `/api/weather` — GET, proxies Tomorrow.io/Open-Meteo (MongoDB cached 15-min TTL + historical recording)
- `/api/ai` — POST, AI weather summaries (MongoDB cached with tiered TTL: 30/60/120 min)
- `/api/explore` — POST, Shamwari Explorer chatbot (Claude + tool use: search_locations, get_weather, get_activity_advice, list_locations_by_tag). Rate-limited 20 req/hour/IP
- `/api/search` — GET, location search (text search, tag filter, geospatial nearest, pagination)
- `/api/geo` — GET, nearest location lookup (query: `lat`, `lon`, optional `autoCreate=true` for auto-creating community locations)
- `/api/locations` — GET, list/filter locations from MongoDB (by slug, tag, or all; includes stats mode)
- `/api/locations/add` — POST, add locations via search (`{ query }`) or coordinates (`{ lat, lon }`). Rate-limited to 5 creations/hour/IP
- `/api/activities` — GET, activities (by id, category, search query, labels, or categories mode)
- `/api/suitability` — GET, suitability rules from MongoDB (all rules or by key; key validated against `^(activity|category):[a-z0-9-]+$`)
- `/api/tags` — GET, tag metadata (all or featured only)
- `/api/regions` — GET, active supported regions (bounding boxes)
- `/api/status` — GET, system health checks (MongoDB ping, API key verification, provider checks)
- `/api/history` — GET, historical weather data (query: `location`, `days`)
- `/api/map-tiles` — GET, tile proxy for Tomorrow.io map layers (query: `z`, `x`, `y`, `layer`, optional `timestamp`; keeps API key server-side)
- `/api/og` — GET, dynamic OG image generation (Edge runtime, Satori). Query: `title`, `subtitle`, optional `location`, `province`, `season`, `temp`, `condition`, `template` (home/location/explore/history/season/shamwari). In-memory rate-limited (30 req/min/IP), 1-day CDN cache
- `/api/db-init` — POST, one-time DB setup + seed data (locations, activities, categories, tags, regions, seasons, suitability rules, AI prompts, API keys). Requires `x-init-secret` header in production
- `/api/py/ai/followup` — POST, inline follow-up chat for AI summaries. Pre-seeded with the AI summary as conversation context. Max 5 exchanges then redirects to Shamwari. Rate-limited 20 req/hour/IP
- `/api/py/ai/prompts` — GET/PUT, database-driven AI prompt library. Returns system prompts and suggested prompt rules. PUT updates individual prompts (admin)
- `/api/py/history/analyze` — POST, AI-powered historical weather analysis. Server-side aggregation (~800 tokens) + Claude analysis. Cached 1h in `history_analysis` collection. Rate-limited 10 req/hour/IP
- `/api/py/explore/search` — POST, AI-powered location search using Claude with `search_locations` + `get_weather` tools. Falls back to text search if AI unavailable. Rate-limited 15 req/hour/IP
- `/api/py/reports` — POST (submit) / GET (list), community weather reports. Submit rate-limited 5 req/hour/IP, auto-captures weather snapshot for cross-validation
- `/api/py/reports/upvote` — POST, upvote a community report (IP-based dedup)
- `/api/py/reports/clarify` — POST, AI-generated follow-up questions for weather report clarification

### Error Handling

**Architecture:** Errors are isolated per-section, not per-page. The page shell (header, breadcrumbs, footer) always renders. Individual sections that crash show a compact fallback ("Unable to display X") without affecting other sections.

**Three layers of error isolation:**

1. **Server-side safety net** — `page.tsx` wraps `getWeatherForLocation` in try/catch. Even if the 4-stage fallback chain fails unexpectedly, the page still renders with `createFallbackWeather` seasonal estimates.

2. **Per-section error boundaries** — Every weather section in `WeatherDashboard.tsx` is wrapped in `ChartErrorBoundary`. If any one component crashes (e.g., chart render failure on low-memory mobile), only that section shows the fallback. Other sections keep working.

3. **Page-level error boundaries** (last resort) — Only triggered if the entire page fails to render:
   - `src/app/error.tsx` — global fallback ("Something went wrong")
   - `src/app/[location]/error.tsx` — weather page fallback ("Weather Unavailable")
   - `src/app/history/error.tsx` — history page fallback ("History Unavailable")
   - Retry count is tracked in `sessionStorage` to prevent infinite reload loops (max 3 retries)

4. **Inline degradation** — `WeatherUnavailableBanner` shown when all weather providers fail but the page still renders with seasonal estimates

**Principle:** A component failure should never crash the app. Only the failing section shows an error. The rest of the page remains fully functional.

### Observability

`src/lib/observability.ts` provides structured error logging and client-side error reporting.

**Server-side (structured logging):**
- `logError(ctx)` — JSON-structured error to stdout (parseable by Vercel Log Drains, Datadog, etc.)
- `logWarn(ctx)` — structured warning with same format
- Context fields: `source` (ErrorSource), `severity` (ErrorSeverity), `location`, `message`, `error`, `meta`
- Error sources: `weather-api`, `ai-api`, `history-api`, `mongodb`, `tomorrow-io`, `open-meteo`, `anthropic`, `client-render`, `client-fetch`, `unhandled`
- Severity levels: `low`, `medium`, `high`, `critical`

**Client-side (GA4 error reporting):**
- `reportErrorToAnalytics(description, fatal)` — sends GA4 `exception` events via `gtag()`
- `reportProviderFailure(provider, errorType, location?)` — tracks weather provider failures as GA4 events
- Used in `ChartErrorBoundary` (`componentDidCatch`), all three `error.tsx` pages, and API routes

**Usage across API routes:**
- `/api/weather` — logs `critical` on unexpected errors, `warn` on all-providers-failed fallback
- `/api/ai` — logs `medium` on AI service unavailability
- `/api/explore` — logs `medium` on chatbot errors (`source: "ai-api"`), `logWarn` on individual tool failures (weather fetch, tool timeout)
- `/api/history` — logs `high` on history fetch failures

### Location Data

**Type:** `WeatherLocation` (aliased as `ZimbabweLocation` for backward compat) in `src/lib/locations.ts`. Fields: `slug`, `name`, `province`, `lat`, `lon`, `elevation`, `tags`, optional `country` (ISO alpha-2, defaults `"ZW"`), optional `source` (`"seed"` | `"community"` | `"geolocation"`).

**Seed locations:** 90+ Zimbabwe locations defined in `src/lib/locations.ts`, plus African cities across 54 AU member states in `src/lib/locations-africa.ts`. Tags include: `city`, `farming`, `mining`, `tourism`, `education`, `border`, `travel`, `national-park`.

**Community locations:** Dynamically created via geolocation auto-detection or `/api/locations/add`. Stored in MongoDB alongside seed locations. Reverse-geocoded via Nominatim for name/country/province.

**Supported regions:** `SUPPORTED_REGIONS` array defines bounding boxes for Zimbabwe, ASEAN, and developing Africa. `isInSupportedRegion(lat, lon)` checks if coordinates fall within any supported region (with 1° padding).

**Geocoding:** `src/lib/geocoding.ts` — Nominatim for reverse geocoding (coords → name), Open-Meteo for forward geocoding (name → candidates), Open-Meteo for elevation lookup. `generateSlug(name, country)` creates URL-safe slugs (appends country code for non-ZW locations).

**Rate limiting:** `src/lib/rate-limit.ts` — MongoDB-backed IP rate limiter (5 location creations/hour/IP). Uses atomic `findOneAndUpdate` with TTL index.

**Deduplication:** New locations within 5km of an existing location are rejected via `findDuplicateLocation()` in `src/lib/db.ts`.

**Countries & Provinces:** `src/lib/countries.ts` — `Country` type (code, name, region, supported), `Province` type (slug, name, countryCode), 64 seed countries (54 AU + ASEAN), 80+ province definitions, `getFlagEmoji(code)`, `generateProvinceSlug(name, code)`.

Key functions: `getLocationBySlug(slug)`, `searchLocationsFromDb(query, options)` (Atlas Search with fuzzy matching + $text fallback), `getLocationsByTag(tag)`, `findNearestLocation(lat, lon)`, `isInSupportedRegion(lat, lon)`, `createLocation(location)`, `findDuplicateLocation(lat, lon, radiusKm)`, `getLocationsForContext(limit)` (bounded DB query for AI context, seed locations prioritized), `vectorSearchLocations(embedding, options)` (foundation for semantic search — requires embedding pipeline), `getTagCountsAndStats()` ($facet aggregation for tag counts + location stats in one query).

### Activities

`src/lib/activities.ts` defines 30 activities across 6 categories for personalized weather advice. Activities extend the LocationTag system with user-activity categories.

**Categories:** farming, mining, travel, tourism, sports, casual

**Key functions:** `getActivitiesByCategory(category)`, `getActivityById(id)`, `getActivityLabels(ids)`, `getRelevantActivities(locationTags, selectedIds)`, `searchActivities(query)`

**Styling:** `CATEGORY_STYLES` in `activities.ts` maps each category to mineral color CSS classes (`bg`, `border`, `text`, `badge`). Used by `ActivitySelector`, `ActivityInsights`, and any category-aware UI.

**UI:** Activity selection is centralized in the **My Weather** modal (`src/components/weather/MyWeatherModal.tsx`), accessible from the header pill icon group. The Activities tab shows mineral-colored activity cards in a 2-column grid with icon, label, and category badge. Selected activities display as bordered cards with a checkmark. Category tabs and search allow filtering. Selections are persisted in Zustand (`selectedActivities`) via localStorage and sent to the AI prompt for context-aware advice.

**Insights:** `src/components/weather/ActivityInsights.tsx` — category-specific weather insight cards (farming GDD, mining safety, sports fitness, travel driving, tourism photography, casual comfort). Each card uses its category's mineral color border and icon accent. Only shown when Tomorrow.io data provides extended fields (GDD, heat stress, thunderstorm probability, etc.). Uses `suitability-cache.ts` for client-side caching of rules and category styles.

### Suitability Rules Engine

`src/lib/suitability.ts` — database-driven suitability evaluation engine.

**Core function:** `evaluateRule(rule, insights)` — evaluates `WeatherInsights` against a `SuitabilityRuleDoc`. Conditions are checked in order (first match wins). Returns a `SuitabilityRating` with level, label, colorClass, bgClass, detail, and optional metric.

**Rating levels:** `excellent`, `good`, `fair`, `poor`

**Rule storage:** Rules are stored in MongoDB `suitability_rules` collection, seeded from `src/lib/seed-suitability-rules.ts` via `/api/db-init`. Rule keys follow the pattern `category:<category>` (applies to all activities in that category) or `activity:<id>` (overrides category rule for a specific activity).

**Condition fields:** `thunderstormProbability`, `heatStressIndex`, `uvHealthConcern`, `visibility`, `windSpeed`, `windGust`, `precipitationType`, `gdd10To30`, `gdd10To31`, `gdd08To30`, `gdd03To25`, `dewPoint`, `evapotranspiration`, `moonPhase`, `cloudBase`, `cloudCeiling`. Field names are validated at sync time via `VALID_CONDITION_FIELDS` in `db.ts` — typos throw an error before reaching the database.

**Operators:** `gt`, `gte`, `lt`, `lte`, `eq`

**Metric templates:** Individual conditions can include a `metricTemplate` string with `{value}` placeholders, resolved at evaluation time with the matched condition value. Fallback rules (last condition in the chain) should NOT include metricTemplates — their `{fieldName}` placeholders may reference insight fields that don't exist, producing undefined values.

**Client-side caching:** `src/lib/suitability-cache.ts` — caches suitability rules and category styles on the client with 10-minute TTL. Exports `fetchSuitabilityRules()`, `fetchCategoryStyles()`, `resetCaches()`. Category styles are seeded from static `CATEGORY_STYLES` for instant mineral color rendering on mount.

**Server-side evaluation:** The explore chatbot route (`/api/explore`) runs `evaluateRule` server-side in `executeGetActivityAdvice`, returning structured level/label/detail to Claude instead of raw weather data, reducing hallucination surface.

### Seed Data

Database seed data files are read by `/api/db-init` for one-time bootstrap:

- `src/lib/seed-suitability-rules.ts` — ordered condition-based rules per activity/category
- `src/lib/seed-categories.ts` — activity categories with mineral color styles
- `src/lib/seed-tags.ts` — tag metadata (slug, label, description, icon, featured flag)
- `src/lib/seed-regions.ts` — supported geographic regions (bounding boxes + center points)
- `src/lib/seed-seasons.ts` — country-specific season definitions for 50+ countries across Southern Africa, East Africa, West Africa, Central Africa, North Africa, Indian Ocean, and ASEAN. Each country covers all 12 months. Grouped by climate zone using `expand()` helper.

### Weather Data

**Tomorrow.io (primary):** `src/lib/tomorrow.ts` — Tomorrow.io API client, weather code mapping, and response normalization to the existing `WeatherData` interface.
- `fetchWeatherFromTomorrow(lat, lon, apiKey)` — fetches forecast (hourly + daily) and normalizes
- `tomorrowCodeToWmo(code)` — maps Tomorrow.io weather codes to WMO codes
- `normalizeTomorrowResponse(data)` — converts Tomorrow.io response to `WeatherData`
- `TomorrowRateLimitError` — thrown on 429, triggers fallback to Open-Meteo
- Free tier limits: 500 calls/day, 25/hour, 3/second; 5-day forecast

**Open-Meteo (fallback):** `src/lib/weather.ts` — Open-Meteo client and pure utility functions:
- `fetchWeather(lat, lon)` — API call (7-day forecast, no auth required)
- `checkFrostRisk(hourly)` — frost detection (temps <= 3°C between 10pm-8am)
- `weatherCodeToInfo(code)` — WMO code to label/icon
- `getZimbabweSeason(date)` — Zimbabwe seasonal calendar (Masika, Chirimo, Zhizha, Munakamwe)
- `windDirection(degrees)` — compass direction
- `uvLevel(index)` — UV severity level
- `synthesizeOpenMeteoInsights(data)` — constructs a `WeatherInsights` object from Open-Meteo data (wind speed, gusts, visibility) for suitability evaluation

**Weather labels:** `src/lib/weather-labels.ts` — extracted contextual label helpers for weather metrics:
- `humidityLabel(h)` — Dry / Comfortable / Humid / Very humid
- `pressureLabel(p)` — Low / Normal / High
- `cloudLabel(c)` — Clear / Mostly clear / Partly cloudy / Mostly cloudy / Overcast
- `feelsLikeContext(apparent, actual)` — Cooler than actual / Warmer than actual / Same as actual

**Provider strategy:** The weather API route (`/api/weather`) tries Tomorrow.io first. If the API key is missing, rate-limited (429), or the request fails, it falls back to Open-Meteo. The `X-Weather-Provider` response header indicates which provider served the data.

### State Management (Zustand)

`src/lib/store.ts` exports `useAppStore` with:
- `theme: "light" | "dark" | "system"` — defaults to `"system"` (follows OS `prefers-color-scheme`), persisted to localStorage
- `setTheme(theme)` — explicitly set a theme preference
- `toggleTheme()` — cycles through light → dark → system
- `selectedLocation: string` — current location slug (default: `"harare"`, not persisted)
- `setSelectedLocation(slug)` — updates location
- `selectedActivities: string[]` — activity IDs (from `src/lib/activities.ts`), persisted to localStorage
- `toggleActivity(id)` — adds/removes an activity selection
- `myWeatherOpen: boolean` — controls My Weather modal visibility (not persisted)
- `openMyWeather()` / `closeMyWeather()` — toggle the modal
- `shamwariContext: ShamwariContext | null` — carries weather/location/summary data between pages (not persisted)
- `setShamwariContext(ctx)` / `clearShamwariContext()` — set/clear context
- `reportModalOpen: boolean` — controls Weather Report modal visibility (not persisted)
- `openReportModal()` / `closeReportModal()` — toggle the report modal

**ShamwariContext** (`interface ShamwariContext`):
- `source: "location" | "explore" | "history"` — which page set the context
- Optional fields: `locationSlug`, `locationName`, `province`, `weatherSummary`, `temperature`, `condition`, `season`, `historyDays`, `historyAnalysis`, `exploreQuery`
- `activities: string[]` — user's selected activities
- `timestamp: number` — context expires after 10 minutes (`isShamwariContextValid()`)

**Persistence:**
- Uses Zustand `persist` middleware with `partialize` — only `theme` and `selectedActivities` are saved to localStorage under key `mukoko-weather-prefs`
- `selectedLocation`, `myWeatherOpen`, `shamwariContext`, and `reportModalOpen` are transient (reset on page load)
- `onRehydrateStorage` callback applies the persisted theme to the DOM on load

**Theme system:**
- `resolveTheme(pref)` — resolves `"system"` to `"light"` or `"dark"` based on `matchMedia('(prefers-color-scheme: dark)')`
- `ThemeProvider` listens for OS theme changes when in `"system"` mode and updates `data-theme` on `<html>` in real time
- Theme can be set via the Settings tab in the My Weather modal (light/dark/system radio group)
- An inline script in `layout.tsx` prevents FOUC by reading the persisted theme from localStorage before first paint, falling back to system preference detection

### Styling / Brand System

CSS custom properties are defined in `src/app/globals.css` (Brand System v6). Colors are WCAG 3.0 APCA/AAA compliant. The theme supports light/dark mode with system preference detection, `prefers-contrast: more`, `prefers-reduced-motion: reduce`, and `forced-colors: active`.

**Mineral Color System:**
Each activity category has a dedicated mineral color, defined as CSS custom properties with light and dark variants:
- **Farming** → Malachite (`--mineral-malachite`)
- **Mining** → Terracotta (`--mineral-terracotta`)
- **Travel** → Cobalt (`--mineral-cobalt`)
- **Tourism** → Tanzanite (`--mineral-tanzanite`)
- **Sports** → Gold (`--mineral-gold`)
- **Casual** → Primary (Cobalt brand color)

Category styles are centralized in `CATEGORY_STYLES` (`src/lib/activities.ts`) with static Tailwind classes for `bg`, `border`, `text`, and `badge` per category. Each mineral color has a corresponding `--mineral-*-fg` foreground token for badge text contrast.

**Severity / Status Color System:**
For weather alerts, status indicators, and severity levels, use the semantic severity tokens defined in `globals.css`:
- `--color-severity-low` → safe/operational/none (green/malachite in light, bright green in dark)
- `--color-severity-moderate` → mild/moderate (gold/warmth in light, amber in dark)
- `--color-severity-high` → high/medium (burnt orange in light, orange in dark)
- `--color-severity-severe` → severe/down (red in light, bright red in dark)
- `--color-severity-extreme` → extreme (deep red in light, vivid red in dark)
- `--color-severity-cold` → frost/cold risk (cobalt blue in light, sky blue in dark)

Use these via Tailwind: `text-severity-low`, `bg-severity-severe/10`, `border-severity-moderate/20`, etc.
Never use generic Tailwind colors (`text-green-600`, `text-red-500`, `bg-amber-500`) — always use severity tokens or brand tokens.

**Skeleton Primitives:**
Reusable skeleton components in `src/components/ui/skeleton.tsx`:
- `Skeleton` — generic pulsing block (base building block)
- `CardSkeleton` — card-shaped with title + content lines
- `ChartSkeleton` — aspect-ratio-matched chart placeholder
- `BadgeSkeleton` — pill-shaped badge placeholder
- `MetricCardSkeleton` — matches AtmosphericSummary MetricCard shape
- `ChatSkeleton` — matches ExploreChatbot container shape (used as Suspense fallback)

Additional skeleton in `src/components/weather/SectionSkeleton.tsx`:
- `SectionSkeleton` — generic section loading placeholder (h-32 pulsing card)

All skeletons include `role="status"`, `aria-label="Loading"`, and `sr-only` text for screen readers.

**Rules:**
- Never use hardcoded hex colors, rgba(), or inline `style={{}}` in components — use Tailwind classes backed by CSS custom properties
- **Exception: `src/app/api/og/route.tsx`** — The OG image route uses `next/og` (Satori) which renders via a canvas, not the browser DOM. CSS custom properties and Tailwind are not supported. All styles in this file MUST use inline `style={{}}` with hex values from the `brand` token object at the top of the file. Keep these values in sync with `globals.css` brand tokens. The OG image renders a mineral accent stripe (tanzanite → cobalt → malachite → gold → terracotta) matching the app's `MineralsStripe` component. Avoid `width: "fit-content"` and other CSS properties not supported by Satori
- All new color tokens must be added to globals.css (both `:root` and `[data-theme="dark"]`) and registered in the `@theme` block
- Use `CATEGORY_STYLES` from `src/lib/activities.ts` for category-specific styling — do not construct dynamic Tailwind class names
- The embed widget (`src/components/embed/`) uses a CSS module for self-contained styling — never use inline styles there
- Frost alert severity colors use `--color-frost-*` tokens, not hardcoded values
- Status/severity indicators use `--color-severity-*` tokens, not generic Tailwind colors
- All skeletons/loading states must include `role="status"` and screen reader text

### AI Summaries

- Generated by Claude Haiku 3.5 (`claude-haiku-4-5-20251001`) via `POST /api/py/ai`, rendered in `src/components/weather/AISummary.tsx`
- AI persona: "Shamwari Weather" (Ubuntu philosophy, region-aware context)
- Summaries are **markdown-formatted** — the system prompt requests bold, bullet points, and no headings
- Rendered with `react-markdown` inside Tailwind `prose` classes
- Cached in MongoDB with tiered TTL (30/60/120 min by location tier)
- If `ANTHROPIC_API_KEY` is unset, a basic weather summary fallback is generated
- **Inline follow-up chat:** `AISummary` fires `onSummaryLoaded(text)` callback; `WeatherDashboard` passes the summary to `AISummaryChat` which allows up to 5 follow-up messages before redirecting to Shamwari
- **Ask Shamwari link:** AISummary includes a "Ask Shamwari about this" link that sets `ShamwariContext` with the current location/weather/summary before navigating to `/shamwari`

### AI Prompt Library (Database-Driven)

All AI system prompts, suggested prompt rules, and model configurations are stored in MongoDB and served via `GET /api/py/ai/prompts`. This allows updating AI behavior without code changes.

**Collections:**
- `ai_prompts` — system prompts keyed by `promptKey` (e.g., `system:weather_summary`, `system:history_analysis`, `system:explore_search`, `system:report_clarification`, `greeting:location`, `greeting:explore`, `greeting:history`). Each document has: `promptKey`, `template` (with `{variable}` placeholders), `model`, `maxTokens`, `active`, `updatedAt`
- `ai_suggested_rules` — dynamic suggested prompt rules. Each rule has: `ruleKey`, `condition` (weather field + operator + threshold), `prompt` (template with `{location}` placeholders), `category` (weather/activity/general), `priority`, `active`

**Seed data:** `src/lib/seed-ai-prompts.ts` — seeded via `/api/db-init`

**Client integration:** `src/lib/suggested-prompts.ts` — `generateSuggestedPrompts(weather, location, activities)` fetches rules from the database (5-min client cache), evaluates weather conditions against rules, and returns up to 3 contextual prompts. Used by `AISummaryChat` and `ExploreChatbot`

**Fallbacks:** All components include hardcoded fallback prompts/greetings for when the database or API is unavailable

### Caching Strategy

**Server-side (MongoDB):**
- Weather cache: 15-min TTL (auto-expires via TTL index)
- AI summaries: tiered TTL — 30 min (major cities), 60 min (mid-tier), 120 min (small locations)
- Weather history: unlimited retention (recorded on every fresh API fetch)
- History analysis: 1h TTL in `history_analysis` collection (keyed by location + days + data hash)
- Weather reports: TTL by severity — 24h (mild), 48h (moderate), 72h (severe) in `weather_reports` collection
- Explore route: in-memory location context (5-min TTL), activities (5-min TTL), in-request weather cache (`Map<string, WeatherResult>` per request), in-request suitability rules cache (`rulesCache` ref per request)
- AI prompts: 5-min in-memory cache in Python endpoints (`_ai_prompts.py`, `_reports.py`, `_history_analyze.py`)

**Client-side:**
- No weather data caching — every page load fetches fresh weather data from the server
- User preferences (theme + selected activities) are persisted to localStorage via Zustand `persist` middleware under key `mukoko-weather-prefs`
- Suitability rules: 10-min TTL cache in `src/lib/suitability-cache.ts` (fetched from `/api/suitability`)
- Category styles: 10-min TTL cache in `src/lib/suitability-cache.ts`, seeded from static `CATEGORY_STYLES` for instant render
- Suggested prompt rules: 5-min TTL cache in `src/lib/suggested-prompts.ts` (fetched from `/api/py/ai/prompts`)

### i18n

`src/lib/i18n.ts` provides lightweight translation without a heavy library:
- `t(key, params?, locale)` — translation lookup with `{param}` interpolation
- `formatTemp()`, `formatWindSpeed()`, `formatPercent()`, `formatTime()`, `formatDayName()`, `formatDate()` — Intl API-based formatting
- English (`en`) fully implemented; Shona (`sn`) and Ndebele (`nd`) structurally ready
- Locale for Intl: `en-ZW`, `sn-ZW`, `nd-ZW`

### SEO

- Dynamic `robots.ts` and `sitemap.ts`
- Per-page metadata via `generateMetadata()` in `[location]/page.tsx` — season data deduplicated across metadata + page component via React `cache()`
- JSON-LD schemas: WebApplication, Organization, WebSite, FAQPage, BreadcrumbList, WebPage+Place
- Twitter cards (`@mukokoafrica`) and Open Graph tags on all pages
- Dynamic OG images via `/api/og` (Edge runtime, Satori) — 6 templates (home, location, explore, history, season, shamwari), mineral accent stripe, in-memory rate limiting, 1-day CDN cache. Location pages intentionally omit weather data from OG params to avoid extra DB round-trips per SSR render

### PWA

- `public/manifest.json` — installable app with shortcuts, theme colors, display modes
- Icons: 192px and 512px in `public/icons/`
- Geolocation support for location detection

### Analytics

- **Google Analytics 4** (GA4) — measurement ID `G-4KB2ZS573N`
- Loaded via `next/script` with `afterInteractive` strategy in `src/components/analytics/GoogleAnalytics.tsx`
- Included in the root layout (`src/app/layout.tsx`) so it runs on all pages
- Privacy policy (`/privacy`) updated to disclose GA4 usage, cookie information, and opt-out instructions
- No personally identifiable information is collected — only anonymised page views, visitor counts, and navigation patterns

### Historical Weather Dashboard

- **Route:** `/history` — client-side dashboard for exploring recorded weather data
- **Components:** `src/app/history/page.tsx` (server, metadata) + `src/app/history/HistoryDashboard.tsx` (client)
- **Features:** location search, configurable time period (7d–1y), comprehensive charts, summary statistics, daily records table, and AI-powered analysis
- **AI analysis:** `src/components/weather/HistoryAnalysis.tsx` — button-triggered analysis ("Analyze with Shamwari"). Server-side aggregation computes compact stats (~800 tokens) from raw records, sends to Claude for trend/pattern analysis. Results rendered as markdown with tanzanite border. "Discuss in Shamwari" link carries analysis context via `ShamwariContext`. Cached 1h server-side
- **Data source:** `GET /api/history?location=<slug>&days=<n>` backed by MongoDB `weather_history` collection
- **Charts:** Reusable chart components from `src/components/weather/charts/` (Canvas 2D via Chart.js)

**Dashboard metrics (7 charts + stats + table):**
1. **Temperature trend** — actual high/low area chart + feels-like (apparent) temperature overlay lines
2. **Precipitation & rain probability** — dual-axis: rainfall bars (mm) + probability line (%)
3. **UV index & cloud cover** — dual-axis: UV bars + cloud cover line (%)
4. **Wind speed & gusts** — overlapping area chart showing sustained speed vs peak gusts
5. **Barometric pressure** — line chart with auto-scaled Y axis
6. **Humidity** — area chart with gradient fill (0–100%)
7. **Daylight hours** — sunrise-to-sunset duration (shown when data available)

**Summary statistics (4 grouped sections):**
- Temperature: avg high/low, record high/low, feels-like high/low
- Precipitation: total rain, rainy days count, avg rain probability
- Atmosphere: avg humidity, cloud cover, pressure, avg/peak UV with severity label
- Wind & Daylight: avg wind, max gusts, avg daylight hours, data point count

**Data table columns:** Date, Condition, High, Low, Feels-Like, Rain, Rain Prob, Humidity, Cloud, Wind, Gusts, Direction, UV, Pressure, Sunrise, Sunset — responsively hidden on smaller screens

### Header & My Weather Modal

**Header** (`src/components/layout/Header.tsx`): Sticky header with the Mukoko logo on the left and a pill-shaped icon group on the right. The pill uses `bg-primary` with three 40px circular icon buttons:
1. **Map pin** — opens the My Weather modal (location tab)
2. **Clock** — links to `/history`
3. **Search** — opens the My Weather modal (location tab)

The header also renders `WeatherReportModal` (lazy-loaded, only mounts when `reportModalOpen` is true).

The header takes no props — location context comes from the URL path.

**Mobile Bottom Navigation** (visible `sm:hidden`): Fixed bottom nav with 5 items:
1. **Weather** (home icon) → `/`
2. **Explore** (compass icon) → `/explore`
3. **Shamwari** (sparkles icon) → `/shamwari` — center position
4. **History** (clock icon) → `/history`
5. **My Weather** (map-pin button) → opens modal

**My Weather Modal** (`src/components/weather/MyWeatherModal.tsx`): A centralized preferences modal (shadcn Dialog + Tabs) with three tabs:
- **Location** — search input, geolocation button, tag filter pills, scrollable location list with pending-slug highlighting. Selecting a location sets it as *pending* (does not navigate immediately).
- **Activities** — category tabs (mineral-colored), search, 2-column activity grid with toggle selection. Uses `CATEGORY_STYLES` for consistent mineral color theming. Auto-scrolls into view after location selection.
- **Settings** — theme radio group (light/dark/system) with visual indicators.

**Deferred navigation:** Location and activity selection are unified — picking a location (either manually or via geolocation) highlights it as pending and auto-advances to the Activities tab so the user can also select activities before navigating. The Done/Apply button commits both choices at once. Navigation only occurs on Done/Apply, not on location tap or geolocation detection. Built with shadcn Dialog (Radix), Tabs, Input, Button, and Badge components.

### Lazy Loading & Mobile Performance (TikTok-Style)

All pages use a **TikTok-style sequential mounting** pattern — only ONE section mounts at a time via a global FIFO queue. This caps peak memory regardless of how many sections exist.

`LazySection` (`src/components/weather/LazySection.tsx`) provides:
1. **Sequential mount queue** — global FIFO queue mounts ONE component at a time with rAF + settle delay (150ms mobile, 50ms desktop) between mounts
2. **Bidirectional visibility** — sections mount when entering viewport (100-300px margin) and UNMOUNT when scrolling 1500px past viewport to reclaim memory
3. **Adaptive timing** — mobile gets longer settle delays than desktop
4. **Skeleton fallbacks** — each section has an aspect-matched skeleton placeholder shown before mounting
5. **Memory pressure monitoring** — `useMemoryPressure()` hook monitors `performance.memory` for JS heap pressure

**Location page — only `CurrentConditions` loads eagerly.** All other sections are lazy:
- `HourlyForecast` → `LazySection` + `ChartErrorBoundary` + `Suspense`
- `AISummary` → `LazySection` + `Suspense`
- `AISummaryChat` → `LazySection` + `ChartErrorBoundary` + `Suspense` (only when AI summary loaded & not fallback)
- `ActivityInsights` → `LazySection` + `Suspense`
- `AtmosphericSummary` → `LazySection` + `Suspense`
- `DailyForecast` → `LazySection` + `ChartErrorBoundary` + `Suspense`
- `SunTimes` → `LazySection` + `Suspense`
- `MapPreview` → `LazySection` + `ChartErrorBoundary` + `Suspense`
- `RecentReports` → `LazySection` + `ChartErrorBoundary` + `Suspense`
- Location info card → `LazySection`

**History page — only the search/filters and summary stats load eagerly.** All charts and the data table are lazy:
- All 7 charts → `LazySection(fallback=<ChartSkeleton />)` + `ChartErrorBoundary` each
- Daily records data table → `LazySection(fallback=<ChartSkeleton />)` with infinite scroll

**Canvas rendering optimizations:**
- Chart.js Canvas 2D rendering — single `<canvas>` DOM element per chart (not thousands of SVG nodes)
- Mobile: `devicePixelRatio: 1`, `animation: false`, data downsampling for large datasets (>60 points on mobile)
- CSS variable resolution via `resolveColor()` — Chart.js needs concrete values, not `var(--chart-1)`
- `HistoryDashboard` uses `reduce()` instead of spread-based `Math.max(...array)` for large datasets

### Atmospheric Summary (Location Page)

`src/components/weather/AtmosphericSummary.tsx` — a 2×3 grid of compact metric cards replacing the previous 4-chart `AtmosphericDetails` on the location page. Following the Apple Weather / Google Weather pattern of showing current values with contextual labels instead of full charts on the main view.

**Cards shown:** Humidity, Cloud Cover, Wind (with gusts + direction), Pressure, UV Index, Feels Like. Each card has an icon, current value, and contextual label (e.g., "Comfortable", "Very High", "Cooler than actual").

**Contextual helpers:** `humidityLabel(h)`, `pressureLabel(p)`, `cloudLabel(c)` — map raw values to human-readable descriptions. UV labels come from `uvLevel()` in `weather.ts`.

**Link:** "24h trends →" links to `/${slug}/atmosphere` where the full atmospheric charts live for that location.

### Atmospheric Details (Atmosphere Sub-Route & History Page)

`src/components/weather/AtmosphericDetails.tsx` — orchestrates four chart components for 24-hour hourly atmospheric views. Used by the `/${slug}/atmosphere` sub-route page and the history page (via `LazyAtmosphericDetails`). Not rendered on the main location page.

**Imports chart components from `src/components/weather/charts/`:**
1. `HumidityCloudChart` — humidity area + cloud cover dashed line, 0–100%
2. `WindSpeedChart` — wind area + gusts dashed line, km/h (auto-scaled)
3. `PressureChart` — pressure line with auto-scaled Y axis, hPa
4. `UVIndexChart` — UV index bars with dynamic max scale

**Helper function:** `prepareAtmosphericData(hourly)` — slices 24 hours of data starting from the current hour, exported for testing.

### Shamwari AI Chat

**Route:** `/shamwari` — full-viewport AI chat (Claude app style). The chatbot fills the screen between the sticky header and mobile bottom nav. Chat input is fixed above the mobile navigation bar.

**Components:**
- `src/app/shamwari/page.tsx` — server wrapper (metadata, Header only — no Footer for max chat space)
- `src/app/shamwari/ShamwariPageClient.tsx` — client: full-viewport layout (`100dvh - header`), bottom padding for mobile nav (`pb-[4.5rem] sm:pb-0`)
- `src/components/explore/ExploreChatbot.tsx` — reusable chat UI: message bubbles, typing indicator, contextual suggested prompts, markdown rendering, location reference links

**Contextual navigation:** On mount, `ExploreChatbot` checks `useAppStore.shamwariContext`. If present and not expired (10 min), it generates a contextual greeting and location-specific suggested prompts based on the source page (location/explore/history). Context is consumed once and cleared after use. Greetings and prompts are fetched from the database-driven AI prompt library with hardcoded fallbacks.

**API:** `POST /api/py/chat` — Claude-powered chatbot with tool use. Rate-limited to 20 requests/hour/IP.
- **Tools:** `search_locations`, `get_weather`, `get_activity_advice`, `list_locations_by_tag`
- **Input validation:** message required (string, max 2000 chars), history capped at 10 messages (both user and assistant truncated via `truncateHistoryContent` to 2000 chars), activities array (user's selected activities from Zustand store) capped at 10 items and injected into system prompt for personalised advice, location slugs validated via `SLUG_RE` (`/^[a-z0-9-]{1,80}$/`), tags validated against `KNOWN_TAGS` allowlist
- **Security:** IP required (rejects unknown), circuit breaker on all Claude calls, structured messages API (boundary markers have no special meaning — no regex needed), system prompt DATA GUARDRAILS, history length caps
- **Resilience:** module-level singleton Anthropic client with key-rotation invalidation (`getAnthropicClient` — recreates client when API key changes), 15s per-tool timeout (`withToolTimeout`), in-request weather cache (`Map<string, WeatherResult>`), in-request suitability rules cache (`rulesCache`), reference deduplication preferring "location" type (`deduplicateReferences`), `list_locations_by_tag` capped to 20 results with note to Claude
- **Server-side caches:** location context (5-min TTL, bounded to 50 locations), activities (5-min TTL, used for dynamic system prompt activity list)
- **Response shape:** `{ response, references, error? }` — references include location slugs/names for quick-link rendering

### Explore (Browse + AI Search)

**Route:** `/explore` — location browsing by category/country (ISR 1h) + AI-powered natural-language search.

**Components:**
- `src/app/explore/page.tsx` — server component (ISR 1h), fetches tag counts and featured tags, renders AI search + Shamwari CTA card + category browse grid + country browse link
- `src/components/explore/ExploreSearch.tsx` — client component: natural-language search input (e.g., "farming areas with low frost risk"), results render as location cards with inline weather data. "Ask Shamwari for more" link sets `ShamwariContext` with `source: "explore"` + `exploreQuery`
- **API:** `POST /api/py/explore/search` — uses Claude with `search_locations` + `get_weather` tools. Falls back to text search if AI unavailable. Rate-limited 15 req/hour/IP

**Sub-routes:**
- `/explore/[tag]` — locations filtered by tag, server-rendered
- `/explore/country` — country index page with flag emoji
- `/explore/country/[code]` — locations in a country, grouped by province
- `/explore/country/[code]/[province]` — locations in a specific province

### Community Weather Reporting (Waze-Style)

Users can submit real-time ground-truth weather observations, similar to Waze for road incidents.

**Report types (10):** light-rain, heavy-rain, thunderstorm, hail, flooding, strong-wind, clear-skies, fog, dust, frost
**Severity levels (3):** mild (24h TTL), moderate (48h TTL), severe (72h TTL)

**Components:**
- `src/components/weather/reports/WeatherReportModal.tsx` — 3-step dialog wizard: select type (grid of icons) → AI clarification (1-2 follow-up questions) → confirm (summary + severity + submit). Uses shadcn Dialog, triggered via `reportModalOpen` store state
- `src/components/weather/reports/RecentReports.tsx` — shows recent community reports on location pages. Compact cards with type icon, severity badge, verified badge, time ago, upvote button. Includes "Report Weather" trigger

**API endpoints:**
- `POST /api/py/reports` — submit report (rate-limited 5/hour/IP, auto-captures weather snapshot for cross-validation)
- `GET /api/py/reports?location=<slug>&hours=<n>` — list recent reports for a location
- `POST /api/py/reports/upvote` — upvote a report (IP-based dedup)
- `POST /api/py/reports/clarify` — AI-generated follow-up questions (database-driven prompt via `system:report_clarification`)

**Cross-validation:** Reports are auto-verified against API weather data at the same location/time. User reports "heavy rain" but API shows 0% precipitation → unverified. User reports "clear skies" and API confirms → auto-verified with checkmark badge.

**MongoDB collection:** `weather_reports` with TTL-based expiration via `expiresAt` field

### Status Page

**Route:** `/status` — live system health dashboard.
- `src/app/status/page.tsx` — server wrapper (metadata)
- `src/app/status/StatusDashboard.tsx` — client component, calls `GET /api/status`
- Checks: MongoDB connectivity, Tomorrow.io API key, Open-Meteo availability, Anthropic API key, weather cache health
- Each service shows operational/degraded/down status with latency

## Testing

**Framework:** Vitest 4.0.18 (configured in `vitest.config.ts`)
- Environment: Node
- Global test APIs enabled
- Test glob: `src/**/*.test.ts`
- Path alias: `@/*` → `./src/*`

**Test files:**

*Library tests:*
- `src/lib/weather.test.ts` — frost detection, season logic, wind direction, UV levels, fallback weather, synthesizeOpenMeteoInsights
- `src/lib/weather-labels.test.ts` — humidity/pressure/cloud/feels-like label helpers
- `src/lib/locations.test.ts` — location searching, tag filtering, nearest location
- `src/lib/activities.test.ts` — activity definitions, categories, search, filtering, category styles
- `src/lib/suitability.test.ts` — suitability rule evaluation, condition matching, metric template resolution
- `src/lib/countries.test.ts` — country/province data, flag emoji, province slug generation
- `src/lib/tomorrow.test.ts` — Tomorrow.io weather code mapping, response normalization, insights extraction
- `src/lib/store.test.ts` — theme resolution (light/dark/system), SSR fallback, ShamwariContext set/clear/expiry
- `src/lib/suggested-prompts.test.ts` — suggested prompt generation, weather condition matching, max 3 cap
- `src/lib/circuit-breaker.test.ts` — circuit breaker state transitions, execute(), reset, error handling
- `src/lib/map-layers.test.ts` — map layer config, default layer, getMapLayerById
- `src/lib/utils.test.ts` — Tailwind class merging (cn utility)
- `src/lib/i18n.test.ts` — translations, formatting, interpolation
- `src/lib/db.test.ts` — database operations (CRUD, TTL, API keys, activities, suitability rules, Atlas Search time-based recovery, Vector Search embedding guard, $facet aggregation)
- `src/lib/suitability-cache.test.ts` — suitability cache TTL, reset, category styles
- `src/lib/geolocation.test.ts` — browser geolocation API wrapper, auto-creation statuses
- `src/lib/geocoding.test.ts` — geocoding module structure, slug generation (diacritics, country codes)
- `src/lib/rate-limit.test.ts` — rate limit module structure, atomic operations
- `src/lib/observability.test.ts` — structured logging, error reporting
- `src/lib/weather-icons.test.ts` — weather icon mapping
- `src/lib/error-retry.test.ts` — error retry logic
- `src/lib/accessibility.test.ts` — accessibility helpers

*API route tests:*
- `src/app/api/ai/ai-prompt.test.ts` — AI prompt formatting, system message
- `src/app/api/ai/ai-route.test.ts` — AI API route handling
- `src/app/api/explore/explore-route.test.ts` — explore chatbot route (validation, rate limiting, circuit breaker, tool definitions, suitability evaluation)
- `src/app/api/search/search-route.test.ts` — search API route (text, tag, geo queries)
- `src/app/api/weather/weather-route.test.ts` — weather API route, provider fallback
- `src/app/api/geo/geo-route.test.ts` — geo API route, nearest location, auto-creation
- `src/app/api/locations/locations-route.test.ts` — locations list API route
- `src/app/api/locations/add/locations-add-route.test.ts` — location add route, search/coordinate modes, rate limiting
- `src/app/api/activities/activities-route.test.ts` — activities API route (by ID, category, search, labels, categories)
- `src/app/api/suitability/suitability-route.test.ts` — suitability API route
- `src/app/api/tags/tags-route.test.ts` — tags API route
- `src/app/api/regions/regions-route.test.ts` — regions API route
- `src/app/api/history/history-route.test.ts` — history API route
- `src/app/api/map-tiles/map-tiles-route.test.ts` — map tile proxy route, layer validation, zoom clamping
- `src/app/api/og/og-route.test.ts` — OG image route (templates, brand tokens, rate limiting, metadata wiring in layout + location pages)
- `src/app/api/db-init/db-init-route.test.ts` — DB init route
- `src/app/api/status/status-route.test.ts` — status API route

*Page/component tests:*
- `src/app/seo.test.ts` — metadata generation, schema validation
- `src/app/explore/explore.test.ts` — explore page tests (browse-only, Shamwari CTA link)
- `src/app/shamwari/shamwari.test.ts` — Shamwari page structure, full-viewport layout, loading skeleton
- `src/app/[location]/FrostAlertBanner.test.ts` — banner rendering, severity styling
- `src/app/[location]/WeatherDashboard.test.ts` — weather dashboard tests
- `src/app/history/HistoryDashboard.test.ts` — history dashboard tests
- `src/components/explore/ExploreChatbot.test.ts` — chatbot component tests, MarkdownErrorBoundary, contextual navigation
- `src/components/explore/ExploreSearch.test.ts` — AI search structure, search flow, results rendering, Shamwari context
- `src/components/embed/MukokoWeatherEmbed.test.ts` — widget rendering, data fetching
- `src/components/ui/chart-fallbacks.test.ts` — CSS fallback table key parity (light/dark sync)
- `src/components/ui/primitives.test.ts` — UI primitive variants (StatusIndicator, CTACard, ToggleGroup, InfoRow, SectionHeader)
- `src/components/weather/charts.test.ts` — chart data preparation (hourly + daily + atmospheric), hexWithAlpha
- `src/components/weather/ActivityInsights.test.ts` — severity helpers, moon phases, precip types
- `src/components/weather/ActivityCard.test.ts` — suitability integration (levels, priority, fallbacks, severity tokens)
- `src/components/weather/AtmosphericSummary.test.ts` — gauge functions (UV, humidity, cloud, wind, pressure, feels-like)
- `src/components/weather/MetricCard.test.ts` — ArcGauge math, SVG geometry, ARIA contract, exports
- `src/components/weather/DailyForecast.test.ts` — temperature percent, gradient helpers
- `src/components/weather/ChartErrorBoundary.test.ts` — error boundary rendering
- `src/components/weather/CurrentConditions.test.ts` — current conditions rendering
- `src/components/weather/LazySection.test.ts` — lazy section mounting, visibility
- `src/components/weather/AISummaryChat.test.ts` — inline follow-up chat structure, max message cap, accessibility
- `src/components/weather/HistoryAnalysis.test.ts` — analysis structure, endpoint, request body, ShamwariContext, accessibility
- `src/components/weather/reports/WeatherReportModal.test.ts` — 3-step wizard, report types, severity, accessibility
- `src/components/weather/reports/RecentReports.test.ts` — report list, upvoting, report trigger, UI patterns

**Conventions:**
- Tests live next to the code they test (co-located)
- Use `describe`/`it`/`expect` pattern
- Any new utility function, CSS class mapping, API behavior, or component logic must have corresponding tests

## Pre-Commit Checklist (REQUIRED)

Before every commit, you MUST complete ALL of these steps. Do not skip any.

1. **Run tests** — `npm test` must pass with zero failures. If you changed behavior, add or update tests.
2. **Run lint** — `npm run lint` must have zero errors (warnings are acceptable).
3. **Run type check** — `npx tsc --noEmit` must pass with zero errors.
4. **Run build** — `npm run build` must compile and generate all pages successfully.
5. **Update tests** — Any new utility function, CSS class mapping, API behavior, or component logic must have corresponding tests.
6. **Update documentation** — If your change affects any of the following, update the corresponding docs:
   - Public API or routes → update README.md API section
   - Project structure (new files/directories) → update README.md project structure
   - Tech stack (new dependencies) → update README.md tech stack table and CLAUDE.md tech stack
   - Environment variables → update README.md env vars table and CLAUDE.md env vars section
   - Styling patterns or tokens → update CLAUDE.md Styling section
   - AI summary format or prompt → update CLAUDE.md AI Summaries section
   - Developer workflow → update CONTRIBUTING.md
7. **Verify no hardcoded styles** — No new hardcoded hex colors, rgba(), or inline `style={{}}` in components.
8. **Verify layered architecture** — New components follow the Layered Component Architecture (see above): error boundary, lazy loading, skeleton, accessibility, global styles, tests.

## Conventions

### Component Architecture
- **Layered imports** — components import from the layer below, never sideways or upward
- **Chart components** — all chart rendering lives in `src/components/weather/charts/`; dashboards import, never hardcode
- **Error isolation** — every section wrapped in `ChartErrorBoundary`; crashes never propagate
- **Sequential lazy loading** — every non-critical section wrapped in `LazySection` with skeleton fallback
- **Skeleton placeholders** — aspect-matched loading skeletons for every lazy-loaded section
- **Circuit breakers** — external API calls wrapped in circuit breakers (`src/lib/circuit-breaker.ts`)

### Styling
- **Global styles only** — all colors and tokens defined in `globals.css` as CSS custom properties
- **Never hardcode** — no hex colors, rgba(), inline `style={{}}`, or dynamic Tailwind class construction
- **Tailwind classes** — always use Tailwind utility classes backed by CSS custom properties
- **Canvas chart colors** — resolved at render time via `resolveColor()` from `src/components/ui/chart.tsx`

### General
- Components are in `src/components/`, organized by domain (`brand/`, `layout/`, `weather/`, `explore/`, `embed/`)
- Client components use `"use client"` directive
- Server components are the default (no directive needed)
- All interactive elements have 44px minimum touch targets
- All sections use `aria-labelledby` with heading IDs
- Icons are marked `aria-hidden="true"`
- The app is mobile-first — all layouts start from small screens
- TypeScript path alias: `@/*` maps to `./src/*` (e.g., `import { t } from "@/lib/i18n"`)
- CORS is configured in `next.config.ts` for `/api/*` and `/embed/*` routes

## Premium / Subscription Model

**Business model:** All weather data is free. Premium is a single paid plan that unlocks interactive map layers.

**Free tier (all users):**
- Current conditions, hourly/daily forecasts, area charts
- AI Shamwari insights
- Frost alerts
- Location maps with weather markers

**Premium tier (single plan):**
- Radar map layer (precipitation radar)
- Cloud cover satellite map layer
- Precipitation map layer
- All premium map layers use Leaflet/react-leaflet with tile overlays

**Authentication:** Stytch (upcoming)
- Handles sign-up, login, sessions, and premium entitlement checks
- Server-side session validation on premium API routes

**Map data providers:**
- **Tomorrow.io** — Radar satellite constellation with growing Africa coverage. 60+ data layers including precipitation, cloud, wind. Primary source for all premium map tile layers. API key stored in MongoDB (not env vars).
- **Base map tiles:** OpenStreetMap (free, no key) via Leaflet

**Map technical notes:**
- Leaflet/react-leaflet must be loaded as a `"use client"` component with `next/dynamic` and `ssr: false` (Leaflet requires the DOM)
- Premium map layers are gated server-side — tile proxy routes check Stytch session before forwarding to Tomorrow.io

**API key storage:** Third-party API keys (Tomorrow.io, Stytch) are stored in MongoDB (`api_keys` collection via `getApiKey`/`setApiKey` in `src/lib/db.ts`), not as server environment variables. This allows key rotation and management without redeployment. Keys are seeded via `POST /api/db-init` with body `{ "apiKeys": { "tomorrow": "..." } }`.

## Environment Variables

- `MONGODB_URI` — required, MongoDB Atlas connection string
- `ANTHROPIC_API_KEY` — optional, server-side only. Without it, a basic weather summary fallback is generated.
- `DB_INIT_SECRET` — optional, protects the `/api/db-init` endpoint in production (via `x-init-secret` header)

## Common Patterns

### Adding a location

**Seed locations (code):** Add to the `LOCATIONS` array in `src/lib/locations.ts`. Include accurate GPS coordinates, elevation, province, and relevant tags. Then run `POST /api/db-init` to sync locations to MongoDB.

**Community locations (dynamic):** Users can add locations at runtime via:
1. **Geolocation auto-create** — browser GPS → `/api/geo?autoCreate=true` → reverse geocode → create
2. **Search** — `POST /api/locations/add` with `{ query }` → forward geocode → pick candidate → create
3. **Coordinates** — `POST /api/locations/add` with `{ lat, lon }` → reverse geocode → create

Community locations are stored in the same MongoDB `locations` collection as seed data and are immediately available at `/{slug}`.

### Database (MongoDB Atlas)
- Client: `src/lib/mongo.ts` (module-scoped, connection-pooled via `@vercel/functions`)
- Operations: `src/lib/db.ts` (CRUD for weather_cache, ai_summaries, weather_history, locations, rate_limits, activities, activity_categories, suitability_rules, tags, regions, seasons, api_keys)
- Collections use TTL indexes for automatic cache expiration
- Historical weather data is recorded automatically on every fresh API fetch
- Rate limits collection has TTL index on `expiresAt` for automatic cleanup

**Atlas Search (fuzzy text search):**
- `searchLocationsFromDb(query, options)` — tries Atlas Search first (fuzzy + autocomplete via `$search`), falls back to `$text` index if Atlas Search index is unavailable
- `searchActivitiesFromDb(query)` — same pattern for activities (Atlas Search → `$text` fallback)
- Requires Atlas Search indexes named `location_search` and `activity_search` (definitions in `src/lib/db.ts` via `getAtlasSearchIndexDefinitions()`)
- **Time-based recovery:** When a missing-index error is detected (MongoDB code 40324), search is disabled for `ATLAS_RETRY_AFTER_MS` (5 minutes), then automatically retries. Transient errors (network, timeout) do not disable the search — only permanent index-missing errors do.

**Vector Search (semantic search — infrastructure):**
- `vectorSearchLocations(embedding, options)` — $vectorSearch pipeline with cosine similarity on 1024-dimension embeddings
- `storeLocationEmbedding(slug, embedding)` / `storeLocationEmbeddings(entries)` — store pre-computed embeddings on location documents
- **Foundation for future work:** No code currently generates or stores embeddings. The `vectorSearchLocations` function is guarded — it checks for at least one location with a stored embedding before running `$vectorSearch`, preventing unnecessary Atlas errors.
- Requires a Vector Search index named `location_vector` on the locations collection

**$facet aggregation:**
- `getTagCountsAndStats()` — runs tag counts and location stats in a single aggregation pipeline

### Modifying SEO
- Root metadata: `src/app/layout.tsx`
- Per-location metadata: `src/app/[location]/page.tsx` `generateMetadata()`
- Structured data: JSON-LD in both layout and location page

### Modifying colors
1. Add CSS custom properties in `src/app/globals.css` — both `:root` (light) and `[data-theme="dark"]` (dark) blocks
2. Register in the `@theme inline` block so Tailwind can generate utility classes
3. Use Tailwind classes (`text-frost-severe`, `bg-surface-card`) in components — never hardcoded values
4. Verify APCA contrast ratios using https://www.myndex.com/APCA/ for both light and dark themes

### Adding translations
1. Add keys to the `messages.en` object in `src/lib/i18n.ts`
2. Use `t("key.path")` in components
3. For interpolation: `t("weather.current", { location: name })`

### Cloudflare Workers (optional edge layer)
The `worker/` directory contains an independent Hono-based API that mirrors the Next.js API routes. It uses Cloudflare KV for caching instead of MongoDB. This is an optional deployment target — the primary deployment is Vercel.

## Deprecated Files

- `src/lib/kv-cache.ts` — replaced by MongoDB (`src/lib/db.ts`). Re-exports kept for migration compatibility.
- `src/types/cloudflare.d.ts` — empty, KV migration to MongoDB is complete.
