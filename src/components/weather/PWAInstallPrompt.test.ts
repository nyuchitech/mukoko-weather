import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const src = readFileSync(
  join(__dirname, "PWAInstallPrompt.tsx"),
  "utf-8",
);

describe("PWAInstallPrompt — component structure", () => {
  it("is a client component", () => {
    expect(src).toMatch(/^"use client"/);
  });

  it("listens for beforeinstallprompt event", () => {
    expect(src).toContain("beforeinstallprompt");
  });

  it("checks if already running as standalone PWA", () => {
    expect(src).toContain("display-mode: standalone");
  });

  it("respects dismissal cooldown via localStorage", () => {
    expect(src).toContain("mukoko-pwa-install-dismissed");
  });

  it("delays showing the prompt to let user experience the app", () => {
    expect(src).toContain("SHOW_DELAY_MS");
  });

  it("prevents Chrome default mini-infobar", () => {
    expect(src).toContain("e.preventDefault()");
  });

  it("tracks install events via analytics", () => {
    expect(src).toContain("trackEvent");
    expect(src).toContain("pwa_install");
  });
});

describe("PWAInstallPrompt — accessibility", () => {
  it("uses Dialog component from shadcn/ui", () => {
    expect(src).toContain("@/components/ui/dialog");
    expect(src).toContain("<Dialog");
  });

  it("has DialogTitle for screen readers", () => {
    expect(src).toContain("<DialogTitle");
  });

  it("has DialogDescription for screen readers", () => {
    expect(src).toContain("<DialogDescription");
  });

  it("buttons have type='button'", () => {
    const typeCount = (src.match(/type="button"/g) || []).length;
    expect(typeCount).toBeGreaterThanOrEqual(2);
  });

  it("install button has 56px height touch target", () => {
    expect(src).toContain("h-14");
  });
});

describe("PWAInstallPrompt — styling", () => {
  it("uses no hardcoded colors", () => {
    expect(src).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(src).not.toMatch(/rgb\(/);
    expect(src).not.toMatch(/rgba\(/);
  });

  it("uses CSS custom property classes", () => {
    expect(src).toContain("bg-primary");
    expect(src).toContain("text-primary");
    expect(src).toContain("text-text-secondary");
  });
});
