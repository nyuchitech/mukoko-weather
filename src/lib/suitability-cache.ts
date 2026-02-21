/**
 * Client-side cache for suitability rules and category styles.
 *
 * Extracted from ActivityInsights.tsx so that:
 *   - Cache state is separate from component rendering logic
 *   - Tests can call resetCaches() for clean isolation
 *   - HMR in development only refreshes the component, not the cache module
 */

import { CATEGORY_STYLES } from "./activities";
import type { SuitabilityRuleDoc, ActivityCategoryDoc } from "./db";

// ---------------------------------------------------------------------------
// Suitability rules cache
// ---------------------------------------------------------------------------

let cachedRules: SuitabilityRuleDoc[] | null = null;
let cachedRulesAt = 0;
const RULES_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchSuitabilityRules(): Promise<SuitabilityRuleDoc[]> {
  if (cachedRules && Date.now() - cachedRulesAt < RULES_CACHE_TTL) {
    return cachedRules;
  }
  const res = await fetch("/api/suitability");
  if (!res.ok) return cachedRules ?? [];
  const data = await res.json();
  cachedRules = data?.rules ?? [];
  cachedRulesAt = Date.now();
  return cachedRules!;
}

// ---------------------------------------------------------------------------
// Category styles cache
// ---------------------------------------------------------------------------

// Seed with static CATEGORY_STYLES for instant mineral color rendering on mount.
// The API fetch upgrades this with any MongoDB-only categories.
let cachedCategoryStyles: Record<string, { bg: string; border: string; text: string; badge: string }> = { ...CATEGORY_STYLES };
let cachedStylesAt = 0;

export type CategoryStyle = { bg: string; border: string; text: string; badge: string };

export async function fetchCategoryStyles(): Promise<Record<string, CategoryStyle>> {
  if (cachedStylesAt > 0 && Date.now() - cachedStylesAt < RULES_CACHE_TTL) {
    return cachedCategoryStyles;
  }
  const res = await fetch("/api/activities?mode=categories");
  if (!res.ok) return cachedCategoryStyles;
  const data = await res.json();
  const styles: Record<string, CategoryStyle> = {};
  for (const cat of (data?.categories ?? []) as ActivityCategoryDoc[]) {
    if (cat.style) styles[cat.id] = cat.style;
  }
  cachedCategoryStyles = styles;
  cachedStylesAt = Date.now();
  return cachedCategoryStyles;
}

// ---------------------------------------------------------------------------
// Test helpers — reset caches for clean test isolation
// ---------------------------------------------------------------------------

export function resetCaches(): void {
  cachedRules = null;
  cachedRulesAt = 0;
  cachedCategoryStyles = { ...CATEGORY_STYLES };
  cachedStylesAt = 0;
}
