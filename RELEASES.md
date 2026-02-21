# Releases

## PR #28 — Explore chatbot, activities expansion, and suitability rules

**Branch:** `claude/enhance-activities-locations-VFcbu`
**Date:** 2026-02-21

### New Features

**Atlas Search integration** (`src/lib/db.ts`)
- Fuzzy text search for locations with typo tolerance (maxEdits: 1) and autocomplete on name field
- Fuzzy text search for activities across label, description, and category
- Automatic fallback to `$text` indexes when Atlas Search is unavailable
- Time-based auto-recovery: retries Atlas Search every 5 minutes after index-missing errors
- Only permanent errors (MongoDB code 40324 / index not found) disable search; transient errors retry immediately

**Vector Search infrastructure** (`src/lib/db.ts`)
- `vectorSearchLocations()` — cosine similarity search on 1024-dimension embeddings
- `storeLocationEmbedding()` / `storeLocationEmbeddings()` — store pre-computed embeddings
- Embedding existence guard prevents unnecessary Atlas errors when no pipeline is wired up
- Foundation for future semantic search in the Shamwari chatbot

**$facet aggregation** (`src/lib/db.ts`)
- `getTagCountsAndStats()` — tag counts + location stats in a single pipeline
- Atlas Search index definitions available via `getAtlasSearchIndexDefinitions()` and returned in db-init response

### Improvements

**Explore route resilience** (`src/app/api/explore/route.ts`)
- Module-level singleton Anthropic client (connection pool reuse across warm invocations)
- 15-second per-tool timeout (`withToolTimeout`) prevents serverless function hangs
- Typed weather cache (`Map<string, WeatherResult>` instead of `Map<string, any>`)
- In-request suitability rules cache (`rulesCache`) prevents redundant DB queries across tool iterations
- Reference deduplication (`deduplicateReferences`) prefers "location" type over "weather" type
- Weather fetch failures now logged via `logWarn` (were silently swallowed)

**Suitability rules cleanup** (`src/lib/seed-suitability-rules.ts`)
- Removed `metricTemplate` from all 7 fallback blocks — field-name placeholders (`{gdd10To30}`, `{visibility}`, etc.) would silently resolve to `undefined` when insight fields were missing
- Condition-level metric templates using `{value}` (the matched condition value) are preserved

**Input validation** (`src/app/api/suitability/route.ts`)
- Key parameter validated against `^(activity|category):[a-z0-9-]+$` regex
- Returns 400 for invalid key format, 404 for key not found

**Error reporting** (`src/components/weather/ActivityInsights.tsx`)
- Suitability rules and category styles fetch failures now reported to GA4 via `reportErrorToAnalytics` (were silently swallowed)

**Database queries** (`src/lib/db.ts`)
- `getLocationsForContext()` sort fixed: `{ source: -1, name: 1 }` (descending) correctly prioritizes seed locations over community/geolocation
- `isAtlasSearchIndexMissing()` helper only permanently disables search on code 40324 / "index not found" — transient errors retry normally

### Security

**Sanitization approach** (`src/app/api/explore/route.ts`)
- Removed legacy `CONTEXT_BOUNDARY_RE` regex — `\n\nHuman:` / `\n\nAssistant:` markers have no special meaning in the Anthropic Messages API (structured turns, not flat text)
- Documented actual defenses inline: structured messages array, system prompt DATA GUARDRAILS, history length caps, server-controlled tool output, circuit breaker + rate limiter
- `sanitizeHistoryContent()` now focuses on what matters: enforcing `MAX_MESSAGE_LENGTH` via `.slice()`
- Current user message is sanitized consistently with history via `sanitizeHistoryContent(message)`

### Tests

Test count increased from 1080 to 1087 with this PR's changes:

- Atlas Search time-based recovery (timestamp-based disabling, auto-retry after 5 min, permanent vs transient errors)
- Vector Search embedding guard (checks for stored embeddings, documented as future infrastructure)
- Explore route security (structured messages API defense documentation, sanitizeHistoryContent max-length enforcement)
- Suitability route key validation (regex format check, 400/404 responses)
- Explore route resilience (singleton client, tool timeouts on all 4 tools, reference deduplication)
- Suitability fallback metric changes (metricTemplate removed from fallbacks)

### Files Changed

| File | Changes |
|------|---------|
| `src/lib/db.ts` | Atlas Search, Vector Search, $facet, time-based recovery, sort fix, index-missing helper |
| `src/app/api/explore/route.ts` | Singleton client, tool timeouts, typed caches, dedup refs, sanitize cleanup |
| `src/lib/seed-suitability-rules.ts` | Removed fallback metricTemplates |
| `src/app/api/suitability/route.ts` | Key validation regex |
| `src/components/weather/ActivityInsights.tsx` | Error reporting, removed fetchedRef guard |
| `src/app/api/db-init/route.ts` | Atlas Search index definitions in response |
| `src/lib/db.test.ts` | Atlas Search recovery, Vector Search guard, $facet tests |
| `src/app/api/explore/explore-route.test.ts` | Security, resilience, sanitization tests |
| `src/app/api/suitability/suitability-route.test.ts` | Key validation test |
| `src/app/api/db-init/db-init-route.test.ts` | Atlas Search index definitions test |
| `src/lib/suitability.test.ts` | Updated fallback expectations |
