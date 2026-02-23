"use client";

import { useRef, useState, useEffect } from "react";
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
  const [use3D, setUse3D] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Extract slug from URL path as fallback if not passed as prop
  const pathname = usePathname();
  const resolvedSlug = slug ?? (pathname ? pathname.split("/").filter(Boolean)[0] : undefined);

  // Format slug for display: "bulawayo" → "Bulawayo"
  const locationDisplay = resolvedSlug
    ? resolvedSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : null;

  // Enable 3D on all device types. Only skip for prefers-reduced-motion.
  useEffect(() => {
    try {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!prefersReduced) {
        setUse3D(true);
      }
      const mobile = window.matchMedia(
        "(hover: none), (pointer: coarse)",
      ).matches;
      setIsMobile(mobile);
    } catch {
      // matchMedia not available — skip 3D
    }
  }, []);

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
