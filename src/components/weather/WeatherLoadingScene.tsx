"use client";

import { useRef, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  createWeatherScene,
  resolveScene,
  getCachedWeatherHint,
} from "@/lib/weather-scenes";
import type { WeatherSceneConfig } from "@/lib/weather-scenes";

interface Props {
  /** Location slug — used to look up cached weather hint for scene selection */
  slug?: string;
  /** Override the status text shown during loading */
  statusText?: string;
}

// useSyncExternalStore subscriptions for client-only media queries.
// Returns false on the server, then the real value on the client — no hydration mismatch.
//
// INTENTIONAL PATTERN: emptySubscribe never notifies React of changes. This is outside
// the standard use of useSyncExternalStore (which expects the subscription to fire when
// the external store changes). It works here because:
//   1. This is a short-lived loading screen (unmounts within seconds)
//   2. Media query values (prefers-reduced-motion, hover capability) don't change mid-load
//   3. If React re-renders for unrelated reasons, getSnapshot re-reads the current value
// In React 19+ concurrent mode, this could theoretically produce tearing if the component
// suspends mid-render, but the practical risk is negligible for a loading overlay.
const emptySubscribe = () => () => {};
const getUse3D = () => {
  try {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch { return false; }
};
const getIsMobile = () => {
  try {
    return window.matchMedia("(hover: none), (pointer: coarse)").matches;
  } catch { return false; }
};
const serverFalse = () => false;

/**
 * Branded weather loading animation.
 *
 * Shows a full-screen loading overlay with the mukoko weather logo and
 * animated dots on ALL devices. Three.js particle scene is rendered
 * behind the text, with the animation matching the cached weather
 * conditions for the loading location.
 *
 * First visit to a location shows a default partly-cloudy scene.
 * Subsequent visits show the last-known weather condition (cached 2h).
 *
 * Respects prefers-reduced-motion — skips 3D entirely.
 * Error boundaries ensure a Three.js failure never crashes the loading screen.
 */
export function WeatherLoadingScene({ slug, statusText }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Hydration-safe client detection via useSyncExternalStore.
  // Returns false on the server (serverFalse), real value on the client.
  const use3D = useSyncExternalStore(emptySubscribe, getUse3D, serverFalse);
  const isMobile = useSyncExternalStore(emptySubscribe, getIsMobile, serverFalse);

  // Extract slug from URL path as fallback if not passed as prop.
  // Guard against known app routes — only use pathname-derived slug when it
  // looks like a location slug (not a known non-location route like /explore).
  const KNOWN_ROUTES = new Set(["explore", "shamwari", "history", "about", "help", "privacy", "terms", "status", "embed"]);
  const pathname = usePathname();
  const pathnameSlug = pathname ? pathname.split("/").filter(Boolean)[0] : undefined;
  const resolvedSlug = slug ?? (pathnameSlug && !KNOWN_ROUTES.has(pathnameSlug) ? pathnameSlug : undefined);

  // Format slug for display: "bulawayo" → "Bulawayo"
  const locationDisplay = resolvedSlug
    ? resolvedSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : null;

  useEffect(() => {
    if (!use3D) return;

    const el = containerRef.current;
    if (!el) return;

    let disposed = false;
    let sceneCleanup: (() => void) | null = null;

    // Build scene config from cached weather hint
    const hint = resolvedSlug ? getCachedWeatherHint(resolvedSlug) : null;
    const sceneType = hint
      ? resolveScene(hint.weatherCode, hint.windSpeed)
      : "partly-cloudy";

    const config: WeatherSceneConfig = {
      type: sceneType,
      isDay: hint?.isDay ?? true,
      isMobile,
      temperature: hint?.temperature,
      windSpeed: hint?.windSpeed,
    };

    createWeatherScene(el, config)
      .then((result) => {
        if (disposed) {
          result.dispose();
        } else {
          sceneCleanup = result.dispose;
        }
      })
      .catch(() => {
        // Three.js failed to load — text-only fallback is already showing
      });

    return () => {
      disposed = true;
      sceneCleanup?.();
    };
  }, [use3D, isMobile, resolvedSlug]);

  // Determine status message
  const displayText =
    statusText ??
    (locationDisplay
      ? `Loading ${locationDisplay} weather...`
      : "Preparing your forecast");

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background">
      {use3D && (
        <div
          ref={containerRef}
          className="absolute inset-0"
          aria-hidden="true"
        />
      )}

      <div
        className="relative z-10 flex flex-col items-center gap-6 px-4 text-center"
        role="status"
      >
        <h2 className="font-heading text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
          <span className="text-primary">mukoko</span>{" "}
          <span className="text-text-secondary">weather</span>
        </h2>
        <p className="text-lg font-medium text-text-tertiary sm:text-xl">
          {displayText}
        </p>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:200ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:400ms]" />
        </div>
        <span className="sr-only">Loading weather data for your location</span>
      </div>
    </div>
  );
}
