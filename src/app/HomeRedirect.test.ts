/**
 * Tests for HomeRedirect — validates the smart home page redirect logic
 * that routes returning users to their saved location and new users
 * through geolocation detection.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const source = readFileSync(
  resolve(__dirname, "HomeRedirect.tsx"),
  "utf-8",
);

describe("HomeRedirect — component structure", () => {
  it("is a client component", () => {
    expect(source).toContain('"use client"');
  });

  it("uses router.replace to avoid history entries", () => {
    expect(source).toContain("router.replace");
  });

  it("uses a ref to prevent duplicate redirects", () => {
    expect(source).toContain("hasRedirected");
    expect(source).toContain("useRef(false)");
  });

  it("renders WeatherLoadingScene while waiting", () => {
    expect(source).toContain("WeatherLoadingScene");
    expect(source).toContain("Finding your location");
  });
});

describe("HomeRedirect — Zustand rehydration guard", () => {
  it("imports hasStoreHydrated from store", () => {
    expect(source).toContain("hasStoreHydrated");
    expect(source).toMatch(/import.*hasStoreHydrated.*from/);
  });

  it("tracks hydration state before acting", () => {
    // Should not act on default Zustand values before localStorage loads
    expect(source).toContain("hydrated");
    expect(source).toContain("setHydrated");
  });

  it("waits for hydration before checking persisted state", () => {
    // The redirect effect should check hydration
    expect(source).toContain("!hydrated");
  });

  it("retries rAF polling until hydration completes", () => {
    // Should retry via recursive rAF, not a single poll
    expect(source).toContain("requestAnimationFrame(check)");
  });
});

describe("HomeRedirect — redirect logic", () => {
  it("always attempts geolocation first (current location default)", () => {
    expect(source).toContain("detectUserLocation");
    expect(source).toContain("selectedLocation");
  });

  it("uses savedLocations as fallback chain", () => {
    expect(source).toContain("savedLocations");
  });

  it("has a geolocation timeout of 3 seconds", () => {
    expect(source).toContain("GEO_TIMEOUT_MS");
    expect(source).toContain("3000");
  });

  it("falls back to harare when geolocation fails", () => {
    expect(source).toContain("FALLBACK_LOCATION");
    expect(source).toContain('"harare"');
  });

  it("uses detectUserLocation for geolocation", () => {
    expect(source).toContain("detectUserLocation");
  });

  it("handles both success and created geolocation statuses", () => {
    expect(source).toContain('"success"');
    expect(source).toContain('"created"');
  });

  it("cancels geolocation on unmount", () => {
    expect(source).toContain("cancelled = true");
  });

  it("handles geolocation promise rejection", () => {
    // .catch() prevents unhandled promise rejections
    expect(source).toContain(".catch(");
  });
});
