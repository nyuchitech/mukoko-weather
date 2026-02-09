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

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS 4 with CSS custom properties (Brand System v7)
- **State:** Zustand 5
- **AI:** Anthropic Claude SDK (server-side only)
- **Weather data:** Open-Meteo API (free, no auth required)
- **Database:** MongoDB Atlas (weather cache, AI summaries, historical data, locations)
- **On-device cache:** IndexedDB (auto-refresh every 60s, offline-first)
- **Testing:** Vitest
- **Deployment:** Vercel (with `@vercel/functions` for MongoDB connection pooling)

## Key Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
npm test          # Run Vitest tests
```

## Architecture

### Routing

- `/` redirects to `/harare`
- `/[location]` — dynamic weather pages (90+ locations)
- `/about` — about page (company info, contact details)
- `/privacy` — privacy policy
- `/terms` — terms of service
- `/help` — user help/FAQ
- `/api/weather` — GET, proxies Open-Meteo (MongoDB cached + historical recording)
- `/api/geo` — GET, nearest location lookup
- `/api/ai` — POST, AI weather summaries (MongoDB cached with tiered TTL)
- `/api/history` — GET, historical weather data (location + days params)
- `/api/db-init` — POST, one-time DB setup (indexes + location sync)
- `/embed` — widget embedding docs

### Location Data

All locations are defined in `src/lib/locations.ts` as a flat array. Each has: `slug`, `name`, `province`, `lat`, `lon`, `elevation`, `tags`. Tags include: `city`, `farming`, `mining`, `tourism`, `education`, `border`, `travel`, `national-park`.

### Weather Data

`src/lib/weather.ts` contains the Open-Meteo client and pure utility functions:
- `fetchWeather(lat, lon)` — API call
- `checkFrostRisk(hourly)` — frost detection (temps <= 3°C between 10pm-8am)
- `weatherCodeToInfo(code)` — WMO code to label/icon
- `getZimbabweSeason(date)` — Zimbabwe seasonal calendar
- `windDirection(degrees)` — compass direction
- `uvLevel(index)` — UV severity level

### Styling / Brand System

CSS custom properties are defined in `src/app/globals.css` (Brand System v7). Colors are WCAG 3.0 APCA/AAA compliant. The theme supports light/dark mode, `prefers-contrast: more`, `prefers-reduced-motion: reduce`, and `forced-colors: active`.

### SEO

- Dynamic `robots.ts` and `sitemap.ts`
- Per-page metadata via `generateMetadata()` in `[location]/page.tsx`
- JSON-LD schemas: WebApplication, Organization, WebSite, FAQPage, BreadcrumbList, WebPage+Place
- Twitter cards (`@mukokoafrica`) and Open Graph tags on all pages

## Conventions

- Components are in `src/components/`, organized by domain (`brand/`, `layout/`, `weather/`)
- Client components use `"use client"` directive
- Server components are the default (no directive needed)
- All interactive elements have 44px minimum touch targets
- All sections use `aria-labelledby` with heading IDs
- Icons are marked `aria-hidden="true"`
- The app is mobile-first — all layouts start from small screens

## Environment Variables

- `MONGODB_URI` — required, MongoDB Atlas connection string
- `ANTHROPIC_API_KEY` — optional, server-side only. Without it, a basic weather summary fallback is generated.
- `DB_INIT_SECRET` — optional, protects the `/api/db-init` endpoint in production

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
Update CSS custom properties in `src/app/globals.css`. Verify APCA contrast ratios using https://www.myndex.com/APCA/ for both light and dark themes.
