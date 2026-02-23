import { describe, it, expect, beforeEach, vi } from "vitest";
import type { CachedWeatherHint } from "./types";

// Mock localStorage for Node test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

// Import after localStorage is mocked
const { cacheWeatherHint, getCachedWeatherHint } = await import("./cache");

describe("weather hint cache", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  const hint: CachedWeatherHint = {
    weatherCode: 63,
    isDay: true,
    temperature: 22,
    windSpeed: 15,
    timestamp: Date.now(),
  };

  it("writes and reads back a hint", () => {
    cacheWeatherHint("harare", hint);
    const result = getCachedWeatherHint("harare");
    expect(result).toEqual(hint);
  });

  it("returns null for missing slug", () => {
    expect(getCachedWeatherHint("nonexistent")).toBeNull();
  });

  it("returns null for expired hint (>2h)", () => {
    const expired: CachedWeatherHint = {
      ...hint,
      timestamp: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
    };
    cacheWeatherHint("harare", expired);
    expect(getCachedWeatherHint("harare")).toBeNull();
  });

  it("removes expired entry from localStorage", () => {
    const expired: CachedWeatherHint = {
      ...hint,
      timestamp: Date.now() - 3 * 60 * 60 * 1000,
    };
    cacheWeatherHint("harare", expired);
    getCachedWeatherHint("harare");
    expect(localStorageMock.getItem("mukoko-weather-hint:harare")).toBeNull();
  });

  it("returns valid hint that is under 2h old", () => {
    const recent: CachedWeatherHint = {
      ...hint,
      timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago
    };
    cacheWeatherHint("bulawayo", recent);
    expect(getCachedWeatherHint("bulawayo")).toEqual(recent);
  });

  it("handles localStorage getItem throwing", () => {
    const original = localStorageMock.getItem;
    localStorageMock.getItem = () => { throw new Error("quota exceeded"); };
    expect(getCachedWeatherHint("harare")).toBeNull();
    localStorageMock.getItem = original;
  });

  it("handles localStorage setItem throwing", () => {
    const original = localStorageMock.setItem;
    localStorageMock.setItem = () => { throw new Error("quota exceeded"); };
    expect(() => cacheWeatherHint("harare", hint)).not.toThrow();
    localStorageMock.setItem = original;
  });

  it("handles malformed JSON gracefully", () => {
    localStorageMock.setItem("mukoko-weather-hint:harare", "not-json");
    expect(getCachedWeatherHint("harare")).toBeNull();
  });
});
