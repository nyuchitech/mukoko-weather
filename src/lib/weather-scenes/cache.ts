import type { CachedWeatherHint } from "./types";

const KEY_PREFIX = "mukoko-weather-hint:";
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Store a weather hint for a location in localStorage.
 * Used by WeatherDashboard to enable weather-aware loading scenes on return visits.
 */
export function cacheWeatherHint(slug: string, hint: CachedWeatherHint): void {
  try {
    localStorage.setItem(KEY_PREFIX + slug, JSON.stringify(hint));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/**
 * Read a cached weather hint for a location.
 * Returns null if no cache, expired (>2h), or localStorage unavailable.
 */
export function getCachedWeatherHint(slug: string): CachedWeatherHint | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + slug);
    if (!raw) return null;

    const hint: CachedWeatherHint = JSON.parse(raw);
    if (Date.now() - hint.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(KEY_PREFIX + slug);
      return null;
    }

    return hint;
  } catch {
    return null;
  }
}
