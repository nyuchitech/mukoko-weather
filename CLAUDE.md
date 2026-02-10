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
- **Styling:** Tailwind CSS 4 with CSS custom properties (Brand System v6)
- **Markdown:** react-markdown 10 (AI summary rendering)
- **State:** Zustand 5.0.11 (persisted to localStorage)
- **AI:** Anthropic Claude SDK 0.73.0 (server-side only)
- **Weather data:** Open-Meteo API (free, no auth required)
- **Database:** MongoDB Atlas 7.1.0 (weather cache, AI summaries, historical data, locations)
- **On-device cache:** IndexedDB (weather 15-min TTL, AI 30-min TTL, auto-refresh every 60s)
- **i18n:** Custom lightweight system (`src/lib/i18n.ts`) — English complete, Shona/Ndebele structurally ready
- **Testing:** Vitest 4.0.18
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
│   │   ├── robots.ts                 # Dynamic robots.txt
│   │   ├── sitemap.ts                # Dynamic XML sitemap (all locations + pages)
│   │   ├── seo.test.ts               # SEO tests
│   │   ├── [location]/               # Dynamic weather pages (90+ locations)
│   │   │   ├── page.tsx              # Main weather page (force-dynamic SSR)
│   │   │   ├── loading.tsx           # Loading skeleton
│   │   │   ├── not-found.tsx         # 404 for invalid locations
│   │   │   ├── FrostAlertBanner.tsx  # Frost warning/advisory banner
│   │   │   └── FrostAlertBanner.test.ts
│   │   ├── about/page.tsx            # About page
│   │   ├── help/page.tsx             # Help/FAQ page
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
│   │   ├── brand/                    # Branding components
│   │   │   ├── MukokoLogo.tsx        # Logo with text fallback
│   │   │   ├── MineralsStripe.tsx    # 5-mineral decorative stripe
│   │   │   ├── ThemeProvider.tsx     # Syncs Zustand theme to document
│   │   │   └── ThemeToggle.tsx       # Light/dark mode toggle
│   │   ├── layout/
│   │   │   ├── Header.tsx            # Sticky header, location selector, theme toggle
│   │   │   └── Footer.tsx            # Footer with copyright, links, Ubuntu philosophy
│   │   ├── weather/
│   │   │   ├── CurrentConditions.tsx  # Large temp display, feels-like, stats grid
│   │   │   ├── HourlyForecast.tsx     # 24-hour hourly forecast
│   │   │   ├── DailyForecast.tsx      # 7-day forecast cards
│   │   │   ├── SunTimes.tsx           # Sunrise/sunset display
│   │   │   ├── SeasonBadge.tsx        # Zimbabwe season indicator
│   │   │   ├── LocationSelector.tsx   # Search/filter dropdown, geolocation
│   │   │   └── AISummary.tsx          # Shamwari AI markdown summary
│   │   └── embed/
│   │       ├── MukokoWeatherEmbed.tsx          # Embeddable widget (current/forecast/badge)
│   │       ├── MukokoWeatherEmbed.module.css   # Self-contained widget CSS (no Tailwind)
│   │       ├── MukokoWeatherEmbed.test.ts
│   │       └── index.ts
│   ├── lib/
│   │   ├── store.ts               # Zustand app state (theme, location)
│   │   ├── locations.ts           # 90+ Zimbabwe locations, search, filtering
│   │   ├── locations.test.ts
│   │   ├── weather.ts             # Open-Meteo client, frost detection, weather utils
│   │   ├── weather.test.ts
│   │   ├── mongo.ts               # MongoDB Atlas connection pooling
│   │   ├── db.ts                  # Database CRUD (weather_cache, ai_summaries, weather_history, locations)
│   │   ├── geolocation.ts         # Browser Geolocation API wrapper
│   │   ├── use-weather-sync.ts    # React hook: IndexedDB + API sync, 60s auto-refresh
│   │   ├── weather-idb.ts         # IndexedDB operations for offline-first cache
│   │   ├── weather-icons.tsx      # SVG weather icons as React components
│   │   ├── i18n.ts                # Lightweight i18n (en complete, sn/nd ready)
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
├── .github/ISSUE_TEMPLATE/        # Bug report and feature request templates
├── next.config.ts                 # CORS headers for /api/* and /embed/*
├── tsconfig.json                  # Strict, path alias @/* → ./src/*
├── vitest.config.ts               # Node env, glob src/**/*.test.ts
├── eslint.config.mjs              # Next.js core-web-vitals + TypeScript
├── postcss.config.mjs             # Tailwind CSS 4 plugin
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
- `/embed` — widget embedding docs
- `/api/weather` — GET, proxies Open-Meteo (MongoDB cached 15-min TTL + historical recording)
- `/api/geo` — GET, nearest location lookup (query: `lat`, `lon`)
- `/api/ai` — POST, AI weather summaries (MongoDB cached with tiered TTL: 30/60/120 min)
- `/api/history` — GET, historical weather data (query: `location`, `days`)
- `/api/db-init` — POST, one-time DB setup (requires `x-init-secret` header in production)

### Location Data

All locations are defined in `src/lib/locations.ts` as a flat array. Each has: `slug`, `name`, `province`, `lat`, `lon`, `elevation`, `tags`. Tags include: `city`, `farming`, `mining`, `tourism`, `education`, `border`, `travel`, `national-park`.

Key functions: `searchLocations(query)`, `getLocationsByTag(tag)`, `findNearestLocation(lat, lon)`.

### Weather Data

`src/lib/weather.ts` contains the Open-Meteo client and pure utility functions:
- `fetchWeather(lat, lon)` — API call
- `checkFrostRisk(hourly)` — frost detection (temps <= 3°C between 10pm-8am)
- `weatherCodeToInfo(code)` — WMO code to label/icon
- `getZimbabweSeason(date)` — Zimbabwe seasonal calendar (Masika, Chirimo, Zhizha, Munakamwe)
- `windDirection(degrees)` — compass direction
- `uvLevel(index)` — UV severity level

### State Management (Zustand)

`src/lib/store.ts` exports `useAppStore` with:
- `theme: "light" | "dark"` — persisted, syncs to `data-theme` attribute on `<html>`
- `toggleTheme()` — switches theme
- `selectedLocation: string` — current location slug (default: `"harare"`)
- `setSelectedLocation(slug)` — updates location

Persistence: localStorage key `"mukoko-weather-prefs"`, rehydrates on mount via Zustand `persist` middleware.

### Styling / Brand System

CSS custom properties are defined in `src/app/globals.css` (Brand System v6). Colors are WCAG 3.0 APCA/AAA compliant. The theme supports light/dark mode, `prefers-contrast: more`, `prefers-reduced-motion: reduce`, and `forced-colors: active`.

**Rules:**
- Never use hardcoded hex colors, rgba(), or inline `style={{}}` in components — use Tailwind classes backed by CSS custom properties
- All new color tokens must be added to globals.css (both `:root` and `[data-theme="dark"]`) and registered in the `@theme` block
- The embed widget (`src/components/embed/`) uses a CSS module for self-contained styling — never use inline styles there
- Frost alert severity colors use `--color-frost-*` tokens, not hardcoded values

### AI Summaries

- Generated by Claude via `POST /api/ai`, rendered in `src/components/weather/AISummary.tsx`
- AI persona: "Shamwari Weather" (Ubuntu philosophy, Zimbabwe context)
- Summaries are **markdown-formatted** — the system prompt requests bold, bullet points, and no headings
- Rendered with `react-markdown` inside Tailwind `prose` classes
- Cached in MongoDB with tiered TTL (30/60/120 min by location tier) + IndexedDB on-device (30 min)
- If `ANTHROPIC_API_KEY` is unset, a basic weather summary fallback is generated

### Caching Strategy

**Server-side (MongoDB):**
- Weather cache: 15-min TTL (auto-expires via TTL index)
- AI summaries: tiered TTL — 30 min (major cities), 60 min (mid-tier), 120 min (small locations)
- Weather history: unlimited retention (recorded on every fresh API fetch)

**Client-side (IndexedDB via `src/lib/weather-idb.ts`):**
- Weather: 15-min TTL
- AI summaries: 30-min TTL
- Auto-refresh every 60s or on visibility change (tab switch / app resume)
- Falls back gracefully if IndexedDB is unavailable

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

## Testing

**Framework:** Vitest 4.0.18 (configured in `vitest.config.ts`)
- Environment: Node
- Global test APIs enabled
- Test glob: `src/**/*.test.ts`
- Path alias: `@/*` → `./src/*`

**Test files:**
- `src/lib/weather.test.ts` — frost detection, season logic, wind direction, UV levels
- `src/lib/locations.test.ts` — location searching, tag filtering, nearest location
- `src/app/api/ai/ai-prompt.test.ts` — AI prompt formatting, system message
- `src/app/seo.test.ts` — metadata generation, schema validation
- `src/app/[location]/FrostAlertBanner.test.ts` — banner rendering, severity styling
- `src/components/embed/MukokoWeatherEmbed.test.ts` — widget rendering, data fetching

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

### On-device cache (IndexedDB)
- `src/lib/weather-idb.ts` — low-level IndexedDB read/write for weather + AI summaries
- `src/lib/use-weather-sync.ts` — React hook with auto-refresh (60s interval + visibility change)

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
