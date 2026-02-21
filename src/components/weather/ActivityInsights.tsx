"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { type Activity } from "@/lib/activities";
import type { WeatherInsights } from "@/lib/weather";
import { ActivityIcon } from "@/lib/weather-icons";
import { evaluateRule, type SuitabilityRating } from "@/lib/suitability";
import { fetchSuitabilityRules, fetchCategoryStyles, type CategoryStyle } from "@/lib/suitability-cache";
import type { SuitabilityRuleDoc } from "@/lib/db";

// ---------------------------------------------------------------------------
// Label helpers (exported for tests)
// ---------------------------------------------------------------------------

const MOON_PHASES = [
  "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
  "Full Moon", "Waning Gibbous", "Third Quarter", "Waning Crescent",
] as const;

export function moonPhaseName(phase: number): string {
  return MOON_PHASES[phase] ?? "Unknown";
}

export function heatStressLevel(index: number): { label: string; className: string } {
  if (index < 22) return { label: "None", className: "text-severity-low" };
  if (index < 24) return { label: "Mild", className: "text-severity-moderate" };
  if (index < 26) return { label: "Moderate", className: "text-severity-high" };
  if (index < 28) return { label: "Medium", className: "text-severity-high" };
  if (index < 30) return { label: "Severe", className: "text-severity-severe" };
  return { label: "Extreme", className: "text-severity-extreme" };
}

export function precipTypeName(type: number): string {
  switch (type) {
    case 0: return "None";
    case 1: return "Rain";
    case 2: return "Snow";
    case 3: return "Freezing Rain";
    case 4: return "Ice Pellets";
    default: return "Unknown";
  }
}

export function uvConcernLabel(concern: number): { label: string; className: string } {
  if (concern <= 2) return { label: "Low", className: "text-severity-low" };
  if (concern <= 5) return { label: "Moderate", className: "text-severity-moderate" };
  if (concern <= 7) return { label: "High", className: "text-severity-high" };
  if (concern <= 10) return { label: "Very High", className: "text-severity-severe" };
  return { label: "Extreme", className: "text-severity-extreme" };
}

// ---------------------------------------------------------------------------
// Suitability evaluation — fully database-driven
// ---------------------------------------------------------------------------

/** Generic fallback when no DB rules exist for a category */
const GENERIC_FALLBACK: SuitabilityRating = {
  level: "good",
  label: "Good",
  colorClass: "text-severity-low",
  bgClass: "bg-severity-low/10",
  detail: "Conditions look suitable for this activity",
};

/** Exported for testing — resolves the best suitability rule for an activity. */
export function evaluateSuitability(
  activity: Activity,
  insights: WeatherInsights,
  dbRules: Map<string, SuitabilityRuleDoc>,
): SuitabilityRating {
  // 1. Try activity-specific rule from database
  const activityRule = dbRules.get(`activity:${activity.id}`);
  if (activityRule) return evaluateRule(activityRule, insights);

  // 2. Try category rule from database
  const categoryRule = dbRules.get(`category:${activity.category}`);
  if (categoryRule) return evaluateRule(categoryRule, insights);

  // 3. Generic fallback — all rules should be in DB, but safety net
  return GENERIC_FALLBACK;
}

// ---------------------------------------------------------------------------
// Default category style (when API data hasn't loaded yet)
// ---------------------------------------------------------------------------

const DEFAULT_STYLE = {
  bg: "bg-primary/10",
  border: "border-primary",
  text: "text-primary",
  badge: "bg-primary text-primary-foreground",
};

// ---------------------------------------------------------------------------
// Activity suitability card (Tomorrow.io style)
// ---------------------------------------------------------------------------

function ActivityCard({
  activity,
  insights,
  dbRules,
  categoryStyles,
}: {
  activity: Activity;
  insights: WeatherInsights;
  dbRules: Map<string, SuitabilityRuleDoc>;
  categoryStyles: Record<string, CategoryStyle>;
}) {
  const style = categoryStyles[activity.category] ?? DEFAULT_STYLE;
  const rating = evaluateSuitability(activity, insights, dbRules);

  return (
    <div className={`flex items-center gap-3 rounded-[var(--radius-card)] bg-surface-card p-4 shadow-sm border-l-4 ${style.border}`}>
      {/* Activity icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
        <span className={style.text} aria-hidden="true">
          <ActivityIcon activity={activity.id} icon={activity.icon} size={20} />
        </span>
      </div>
      {/* Activity info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-text-primary">{activity.label}</p>
          <span className={`rounded-[var(--radius-badge)] px-2 py-0.5 text-xs font-bold ${rating.bgClass} ${rating.colorClass}`}>
            {rating.label}
          </span>
          {rating.metric && (
            <span className="ml-auto text-xs font-medium text-text-tertiary tabular-nums">{rating.metric}</span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-text-secondary">{rating.detail}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ActivityInsights({
  insights,
  activities,
}: {
  insights?: WeatherInsights;
  /** All activities from MongoDB — passed from parent. Empty array = loading, show nothing. */
  activities: Activity[];
}) {
  const selectedActivities = useAppStore((s) => s.selectedActivities);
  const openMyWeather = useAppStore((s) => s.openMyWeather);

  // Fetch suitability rules from database (module-level cache, 10min TTL)
  const [dbRules, setDbRules] = useState<Map<string, SuitabilityRuleDoc>>(new Map());
  // Fetch category styles from database (module-level cache, 10min TTL)
  const [categoryStyles, setCategoryStyles] = useState<Record<string, CategoryStyle>>({});
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    Promise.all([
      fetchSuitabilityRules()
        .then((rules) => {
          if (rules.length) {
            const rulesMap = new Map<string, SuitabilityRuleDoc>();
            for (const rule of rules) rulesMap.set(rule.key, rule);
            setDbRules(rulesMap);
          }
        })
        .catch(() => {}),
      fetchCategoryStyles()
        .then((styles) => {
          if (Object.keys(styles).length) setCategoryStyles(styles);
        })
        .catch(() => {}),
    ]);
  }, []);

  const selectedItems = useMemo(() => {
    return selectedActivities
      .map((id) => activities.find((a) => a.id === id))
      .filter((a): a is Activity => a != null);
  }, [selectedActivities, activities]);

  if (selectedItems.length === 0) return null;

  // When insights data is available, show per-activity suitability cards
  if (insights) {
    return (
      <section aria-labelledby="activity-insights-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="activity-insights-heading"
            className="text-lg font-semibold text-text-primary font-heading"
          >
            My Activities
          </h2>
          <button
            onClick={openMyWeather}
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Edit
          </button>
        </div>
        <div className="space-y-2">
          {selectedItems.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} insights={insights} dbRules={dbRules} categoryStyles={categoryStyles} />
          ))}
        </div>
      </section>
    );
  }

  // Fallback: show selected activities as badges when insights data isn't available
  return (
    <section aria-label="Selected activities">
      <div className="rounded-[var(--radius-card)] bg-surface-card p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary font-heading">Your Activities</h3>
          <button
            onClick={openMyWeather}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Edit
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((activity) => {
            const style = categoryStyles[activity.category] ?? DEFAULT_STYLE;
            return (
              <span
                key={activity.id}
                className={`inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] px-3 py-1.5 text-sm font-medium ${style.badge}`}
              >
                {activity.label}
              </span>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-text-tertiary">
          Detailed activity insights appear when extended weather data is available.
        </p>
      </div>
    </section>
  );
}
