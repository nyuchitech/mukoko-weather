# CLAUDE.md — Project Context for Claude Code

## Project Overview

mukoko weather is an AI-powered weather intelligence platform for Zimbabwe. It provides real-time weather data, 7-day forecasts, frost alerts, and AI-generated contextual advice for farming, mining, travel, and daily life across 90+ Zimbabwe locations.

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
- **Charts:** Recharts 2 via shadcn chart component
- **Styling:** Tailwind CSS 4 with CSS custom properties (Brand System v6)
- **Markdown:** react-markdown 10 (AI summary rendering)
- **State:** Zustand 5.0.11 (in-memory, fresh on every page load)
- **AI:** Anthropic Claude SDK 0.73.0 (server-side only)
- **Weather data:** Tomorrow.io API (primary, free tier) + Open-Meteo API (fallback)
- **Database:** MongoDB Atlas 7.1.0 (weather cache, AI summaries, historical data, locations)
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
│   │   ├── favicon.ico               # Site favicon
│   │   ├── robots.ts                 # Dynamic robots.txt
│   │   ├── sitemap.ts                # Dynamic XML sitemap (all locations + pages)
│   │   ├── seo.test.ts               # SEO tests
│   │   ├── [location]/               # Dynamic weather pages (90+ locations)
│   │   │   ├── page.tsx              # Main weather page (force-dynamic SSR)
│   │   │   ├── loading.tsx           # Loading skeleton
│   │   │   ├── error.tsx             # Location-specific error boundary
│   │   │   ├── not-found.tsx         # 404 for invalid locations
│   │   │   ├── FrostAlertBanner.tsx  # Frost warning/advisory banner
│   │   │   ├── FrostAlertBanner.test.ts
│   │   │   └── WeatherUnavailableBanner.tsx  # Weather data unavailability alert
│   │   ├── about/page.tsx            # About page
│   │   ├── help/page.tsx             # Help/FAQ page
│   │   ├── history/                  # Historical weather data dashboard
│   │   │   ├── page.tsx              # History page (metadata, layout)
│   │   │   ├── HistoryDashboard.tsx  # Client-side dashboard (search, charts, table)
│   │   │   └── error.tsx             # History page error boundary
│   │   ├── privacy/page.tsx          # Privacy policy
│   │   ├── terms/page.tsx            # Terms of service
│   │   ├── embed/page.tsx            # Widget embedding docs
│   │   └── api/
│   │       ├── weather/route.ts      # GET — proxy Open-Meteo (MongoDB cached)
│   │       ├── ai/                   # POST — Claude AI summaries (tiered TTL cache)
│   │       │   ├── route.ts
│   │       │   └── ai-prompt.test.ts
│   │       ├── geo/route.ts          # GET — nearest location lookup
│   │       ├── history/route.ts      # GET — historical weather data
│   │       └── db-init/route.ts      # POST — one-time DB setup (indexes + locations)
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives
│   │   │   ├── card.tsx              # Card, CardHeader, CardContent, etc.
│   │   │   └── chart.tsx             # ChartContainer, ChartTooltip (wraps Recharts)
│   │   ├── brand/                    # Branding components
│   │   │   ├── MukokoLogo.tsx        # Logo with text fallback
│   │   │   ├── MineralsStripe.tsx    # 5-mineral decorative stripe
│   │   │   ├── ThemeProvider.tsx     # Syncs Zustand theme to document, listens for OS changes
│   │   │   └── ThemeToggle.tsx       # Light/dark/system mode toggle (3-state cycle)
│   │   ├── analytics/
│   │   │   └── GoogleAnalytics.tsx   # Google Analytics 4 (gtag.js) via next/script
│   │   ├── layout/
│   │   │   ├── Header.tsx            # Sticky header, location selector, theme toggle
│   │   │   └── Footer.tsx            # Footer with site stats, copyright, links, Ubuntu philosophy
│   │   ├── weather/
│   │   │   ├── CurrentConditions.tsx  # Large temp display, feels-like, stats grid
│   │   │   ├── HourlyForecast.tsx     # 24-hour hourly forecast
│   │   │   ├── HourlyChart.tsx        # Area chart: temperature + rain over 24h
│   │   │   ├── DailyForecast.tsx      # 7-day forecast cards
│   │   │   ├── DailyChart.tsx         # Area chart: high/low temps over 7 days
│   │   │   ├── AtmosphericDetails.tsx # 24h atmospheric charts (humidity, wind, pressure, UV)
│   │   │   ├── LazyAtmosphericDetails.tsx # Lazy-load wrapper (IntersectionObserver + React.lazy)
│   │   │   ├── ChartErrorBoundary.tsx # Error boundary for chart crash isolation
│   │   │   ├── WeatherLoadingScene.tsx # Three.js weather loading animation (desktop only)
│   │   │   ├── charts.test.ts         # Tests for chart data preparation
│   │   │   ├── SunTimes.tsx           # Sunrise/sunset display
│   │   │   ├── SeasonBadge.tsx        # Zimbabwe season indicator
│   │   │   ├── LocationSelector.tsx   # Search/filter dropdown, geolocation
│   │   │   ├── AISummary.tsx          # Shamwari AI markdown summary
│   │   │   ├── ActivitySelector.tsx   # Activity selection modal (personalized advice)
│   │   │   └── ActivityInsights.tsx   # Category-specific weather insight cards
│   │   └── embed/
│   │       ├── MukokoWeatherEmbed.tsx          # Embeddable widget (current/forecast/badge)
│   │       ├── MukokoWeatherEmbed.module.css   # Self-contained widget CSS (no Tailwind)
│   │       ├── MukokoWeatherEmbed.test.ts
│   │       └── index.ts
│   ├── lib/
│   │   ├── store.ts               # Zustand app state (theme with system detection, location, activities)
│   │   ├── store.test.ts          # Theme resolution tests
│   │   ├── locations.ts           # 90+ Zimbabwe locations, search, filtering
│   │   ├── locations.test.ts
│   │   ├── activities.ts          # Activity definitions for personalized weather insights
│   │   ├── activities.test.ts
│   │   ├── tomorrow.ts             # Tomorrow.io API client + WMO normalization
│   │   ├── tomorrow.test.ts
│   │   ├── weather.ts             # Open-Meteo client, frost detection, weather utils
│   │   ├── weather.test.ts
│   │   ├── mongo.ts               # MongoDB Atlas connection pooling
│   │   ├── db.ts                  # Database CRUD (weather_cache, ai_summaries, weather_history, locations)
│   │   ├── geolocation.ts         # Browser Geolocation API wrapper
│   │   ├── weather-icons.tsx      # SVG weather icons + ActivityIcon component
│   │   ├── i18n.ts                # Lightweight i18n (en complete, sn/nd ready)
│   │   ├── utils.ts               # Tailwind class merging helper (cn)
│   │   └── kv-cache.ts            # DEPRECATED — re-exports from db.ts for migration
│   └── types/
│       └── cloudflare.d.ts        # DEPRECATED — empty (KV migration complete)
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

### Routing

- `/` redirects to `/harare`
- `/[location]` — dynamic weather pages (90+ locations)
- `/about` — about page (company info, contact details)
- `/privacy` — privacy policy
- `/terms` — terms of service
- `/help` — user help/FAQ
- `/history` — historical weather data dashboard (search, charts, data table)
- `/embed` — widget embedding docs
- `/api/weather` — GET, proxies Open-Meteo (MongoDB cached 15-min TTL + historical recording)
- `/api/geo` — GET, nearest location lookup (query: `lat`, `lon`)
- `/api/ai` — POST, AI weather summaries (MongoDB cached with tiered TTL: 30/60/120 min)
- `/api/history` — GET, historical weather data (query: `location`, `days`)
- `/api/db-init` — POST, one-time DB setup + optional API key seeding (requires `x-init-secret` header in production)

### Error Handling

Next.js error boundaries are used at three levels:
- `src/app/error.tsx` — global fallback ("Something went wrong"), offers "Try again" and "Go home"
- `src/app/[location]/error.tsx` — weather page errors ("Weather Unavailable"), offers retry and link to Harare
- `src/app/history/error.tsx` — history page errors ("History Unavailable"), offers retry and home link
- `src/app/[location]/WeatherUnavailableBanner.tsx` — inline banner shown when weather providers fail but the page still renders with seasonal estimates; includes a "Refresh now" button

All error boundaries are client components (`"use client"`) and log the error to the console via `useEffect`.

### Location Data

All locations are defined in `src/lib/locations.ts` as a flat array. Each has: `slug`, `name`, `province`, `lat`, `lon`, `elevation`, `tags`. Tags include: `city`, `farming`, `mining`, `tourism`, `education`, `border`, `travel`, `national-park`.

Key functions: `getLocationBySlug(slug)`, `searchLocations(query)`, `getLocationsByTag(tag)`, `findNearestLocation(lat, lon)`.

### Activities

`src/lib/activities.ts` defines 20 activities across 6 categories for personalized weather advice. Activities extend the LocationTag system with user-activity categories.

**Categories:** farming, mining, travel, tourism, sports, casual

**Key functions:** `getActivitiesByCategory(category)`, `getActivityById(id)`, `getActivityLabels(ids)`, `getRelevantActivities(locationTags, selectedIds)`, `searchActivities(query)`

**Styling:** `CATEGORY_STYLES` in `activities.ts` maps each category to mineral color CSS classes (`bg`, `border`, `text`, `badge`). Used by `ActivitySelector`, `ActivityInsights`, and any category-aware UI.

**UI:** `src/components/weather/ActivitySelector.tsx` — mineral-colored activity cards with icon, description, and category badge. Selected activities display as bordered cards (not badges). Modal grid items and category tabs use mineral color accents. Selections are persisted in Zustand (`selectedActivities`) and sent to the AI prompt for context-aware advice.

**Insights:** `src/components/weather/ActivityInsights.tsx` — category-specific weather insight cards (farming GDD, mining safety, sports fitness, travel driving, tourism photography, casual comfort). Each card uses its category's mineral color border and icon accent. Only shown when Tomorrow.io data provides extended fields (GDD, heat stress, thunderstorm probability, etc.).

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

**Provider strategy:** The weather API route (`/api/weather`) tries Tomorrow.io first. If the API key is missing, rate-limited (429), or the request fails, it falls back to Open-Meteo. The `X-Weather-Provider` response header indicates which provider served the data.

### State Management (Zustand)

`src/lib/store.ts` exports `useAppStore` with:
- `theme: "light" | "dark" | "system"` — defaults to `"system"` (follows OS `prefers-color-scheme`), resets on page load
- `setTheme(theme)` — explicitly set a theme preference
- `toggleTheme()` — cycles through light → dark → system
- `selectedLocation: string` — current location slug (default: `"harare"`)
- `setSelectedLocation(slug)` — updates location
- `selectedActivities: string[]` — activity IDs (from `src/lib/activities.ts`), resets on page load
- `toggleActivity(id)` — adds/removes an activity selection

**Theme system:**
- `resolveTheme(pref)` — resolves `"system"` to `"light"` or `"dark"` based on `matchMedia('(prefers-color-scheme: dark)')`
- `ThemeProvider` listens for OS theme changes when in `"system"` mode and updates `data-theme` on `<html>` in real time
- `ThemeToggle` shows three states: sun (→ light), moon (→ dark), monitor (→ system)
- An inline script in `layout.tsx` prevents FOUC by detecting system theme preference before first paint

State is in-memory only (no localStorage persistence). Every page load starts fresh with system theme detection. Stale localStorage from previous app versions is automatically cleared.

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

**Rules:**
- Never use hardcoded hex colors, rgba(), or inline `style={{}}` in components — use Tailwind classes backed by CSS custom properties
- All new color tokens must be added to globals.css (both `:root` and `[data-theme="dark"]`) and registered in the `@theme` block
- Use `CATEGORY_STYLES` from `src/lib/activities.ts` for category-specific styling — do not construct dynamic Tailwind class names
- The embed widget (`src/components/embed/`) uses a CSS module for self-contained styling — never use inline styles there
- Frost alert severity colors use `--color-frost-*` tokens, not hardcoded values

### AI Summaries

- Generated by Claude via `POST /api/ai`, rendered in `src/components/weather/AISummary.tsx`
- AI persona: "Shamwari Weather" (Ubuntu philosophy, Zimbabwe context)
- Summaries are **markdown-formatted** — the system prompt requests bold, bullet points, and no headings
- Rendered with `react-markdown` inside Tailwind `prose` classes
- Cached in MongoDB with tiered TTL (30/60/120 min by location tier)
- If `ANTHROPIC_API_KEY` is unset, a basic weather summary fallback is generated

### Caching Strategy

**Server-side (MongoDB):**
- Weather cache: 15-min TTL (auto-expires via TTL index)
- AI summaries: tiered TTL — 30 min (major cities), 60 min (mid-tier), 120 min (small locations)
- Weather history: unlimited retention (recorded on every fresh API fetch)

**Client-side:**
- No client-side caching — every page load fetches fresh data from the server
- Stale localStorage from previous versions is cleared on page load

### i18n

`src/lib/i18n.ts` provides lightweight translation without a heavy library:
- `t(key, params?, locale)` — translation lookup with `{param}` interpolation
- `formatTemp()`, `formatWindSpeed()`, `formatPercent()`, `formatTime()`, `formatDayName()`, `formatDate()` — Intl API-based formatting
- English (`en`) fully implemented; Shona (`sn`) and Ndebele (`nd`) structurally ready
- Locale for Intl: `en-ZW`, `sn-ZW`, `nd-ZW`

### SEO

- Dynamic `robots.ts` and `sitemap.ts`
- Per-page metadata via `generateMetadata()` in `[location]/page.tsx`
- JSON-LD schemas: WebApplication, Organization, WebSite, FAQPage, BreadcrumbList, WebPage+Place
- Twitter cards (`@mukokoafrica`) and Open Graph tags on all pages

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
- **Features:** location search, configurable time period (7d–1y), comprehensive charts, summary statistics, and daily records table
- **Data source:** `GET /api/history?location=<slug>&days=<n>` backed by MongoDB `weather_history` collection
- **Charts:** Recharts via shadcn ChartContainer (same pattern as HourlyChart/DailyChart)

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

### Atmospheric Details

`src/components/weather/AtmosphericDetails.tsx` — a client component rendering four 24-hour hourly atmospheric charts on the weather page:

1. **Humidity & Cloud Cover** — area chart (humidity) + dashed line (cloud cover), 0–100%
2. **Wind Speed & Gusts** — area chart (sustained speed) + dashed line (gusts), km/h
3. **Barometric Pressure** — line chart with auto-scaled Y axis, hPa
4. **UV Index** — bar chart with dynamic max scale

**Helper function:** `prepareAtmosphericData(hourly)` — slices 24 hours of data starting from the current hour, exported for testing.

All four charts use `ComposedChart` from Recharts via the shadcn `ChartContainer` wrapper, following the same pattern as `HourlyChart` and `DailyChart`.

## Testing

**Framework:** Vitest 4.0.18 (configured in `vitest.config.ts`)
- Environment: Node
- Global test APIs enabled
- Test glob: `src/**/*.test.ts`
- Path alias: `@/*` → `./src/*`

**Test files:**
- `src/lib/weather.test.ts` — frost detection, season logic, wind direction, UV levels
- `src/lib/locations.test.ts` — location searching, tag filtering, nearest location
- `src/lib/activities.test.ts` — activity definitions, categories, search, filtering, category styles
- `src/lib/tomorrow.test.ts` — Tomorrow.io weather code mapping, response normalization, insights extraction
- `src/lib/store.test.ts` — theme resolution (light/dark/system), SSR fallback
- `src/app/api/ai/ai-prompt.test.ts` — AI prompt formatting, system message
- `src/app/seo.test.ts` — metadata generation, schema validation
- `src/app/[location]/FrostAlertBanner.test.ts` — banner rendering, severity styling
- `src/components/embed/MukokoWeatherEmbed.test.ts` — widget rendering, data fetching
- `src/components/weather/charts.test.ts` — chart data preparation (hourly + daily)

**Conventions:**
- Tests live next to the code they test (co-located)
- Use `describe`/`it`/`expect` pattern
- Any new utility function, CSS class mapping, API behavior, or component logic must have corresponding tests

## Pre-Commit Checklist (REQUIRED)

Before every commit, you MUST complete ALL of these steps. Do not skip any.

1. **Run tests** — `npm test` must pass with zero failures. If you changed behavior, add or update tests.
2. **Run lint** — `npm run lint` must have zero errors (warnings are acceptable).
3. **Run type check** — `npx tsc --noEmit` must pass with zero errors.
4. **Update tests** — Any new utility function, CSS class mapping, API behavior, or component logic must have corresponding tests.
5. **Update documentation** — If your change affects any of the following, update the corresponding docs:
   - Public API or routes → update README.md API section
   - Project structure (new files/directories) → update README.md project structure
   - Tech stack (new dependencies) → update README.md tech stack table and CLAUDE.md tech stack
   - Environment variables → update README.md env vars table and CLAUDE.md env vars section
   - Styling patterns or tokens → update CLAUDE.md Styling section
   - AI summary format or prompt → update CLAUDE.md AI Summaries section
   - Developer workflow → update CONTRIBUTING.md
6. **Verify no hardcoded styles** — No new hardcoded hex colors, rgba(), or inline `style={{}}` in components.

## Conventions

- Components are in `src/components/`, organized by domain (`brand/`, `layout/`, `weather/`, `embed/`)
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
Add to the `LOCATIONS` array in `src/lib/locations.ts`. Include accurate GPS coordinates, elevation, province, and relevant tags. Then run `POST /api/db-init` to sync locations to MongoDB.

### Database (MongoDB Atlas)
- Client: `src/lib/mongo.ts` (module-scoped, connection-pooled via `@vercel/functions`)
- Operations: `src/lib/db.ts` (CRUD for weather_cache, ai_summaries, weather_history, locations)
- Collections use TTL indexes for automatic cache expiration
- Historical weather data is recorded automatically on every fresh API fetch

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
