"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore, hasStoreHydrated } from "@/lib/store";
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
 * Waits for Zustand rehydration before reading persisted state to avoid
 * acting on default values before localStorage is loaded.
 *
 * Uses router.replace() so the home page doesn't appear in browser history.
 */
export function HomeRedirect() {
  const router = useRouter();
  const hasRedirected = useRef(false);
  const selectedLocation = useAppStore((s) => s.selectedLocation);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);

  // Track Zustand rehydration — hasStoreHydrated() is not reactive,
  // so we poll via rAF until hydration completes (retries on slow devices).
  const [hydrated, setHydrated] = useState(hasStoreHydrated);
  useEffect(() => {
    if (hydrated) return;
    let id: number;
    const check = () => {
      if (hasStoreHydrated()) {
        setHydrated(true);
      } else {
        id = requestAnimationFrame(check);
      }
    };
    id = requestAnimationFrame(check);
    return () => cancelAnimationFrame(id);
  }, [hydrated]);

  useEffect(() => {
    if (hasRedirected.current || !hydrated) return;

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

    Promise.race([geoPromise, timeoutPromise])
      .then((result) => {
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
      })
      .catch(() => {
        if (cancelled || hasRedirected.current) return;
        hasRedirected.current = true;
        router.replace(`/${selectedLocation || FALLBACK_LOCATION}`);
      });

    return () => {
      cancelled = true;
    };
  }, [router, selectedLocation, hasOnboarded, hydrated]);

  return <WeatherLoadingScene statusText="Finding your location..." />;
}
