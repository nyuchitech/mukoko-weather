"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { detectUserLocation } from "@/lib/geolocation";
import { WeatherLoadingScene } from "@/components/weather/WeatherLoadingScene";

const GEO_TIMEOUT_MS = 3000;
const FALLBACK_LOCATION = "harare";

/**
 * Smart home page redirect.
 *
 * Returning users → instantly redirect to their saved location.
 * New users → auto-detect location via geolocation (3s timeout) → redirect.
 * Fallback → redirect to Harare.
 *
 * Uses router.replace() so the home page doesn't appear in browser history.
 */
export function HomeRedirect() {
  const router = useRouter();
  const hasRedirected = useRef(false);
  const selectedLocation = useAppStore((s) => s.selectedLocation);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);

  useEffect(() => {
    if (hasRedirected.current) return;

    // Returning user with a saved location — go straight there
    if (hasOnboarded && selectedLocation && selectedLocation !== FALLBACK_LOCATION) {
      hasRedirected.current = true;
      router.replace(`/${selectedLocation}`);
      return;
    }

    // New user — attempt geolocation with timeout
    let cancelled = false;

    const geoPromise = detectUserLocation();
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), GEO_TIMEOUT_MS),
    );

    Promise.race([geoPromise, timeoutPromise]).then((result) => {
      if (cancelled || hasRedirected.current) return;
      hasRedirected.current = true;

      if (
        result &&
        "status" in result &&
        (result.status === "success" || result.status === "created") &&
        result.location
      ) {
        router.replace(`/${result.location.slug}`);
      } else {
        // Geolocation denied, timed out, or outside supported region
        router.replace(`/${selectedLocation || FALLBACK_LOCATION}`);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router, selectedLocation, hasOnboarded]);

  return <WeatherLoadingScene statusText="Finding your location..." />;
}
