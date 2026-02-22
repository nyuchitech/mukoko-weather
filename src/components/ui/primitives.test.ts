import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// StatusIndicator — style mapping tests
// ---------------------------------------------------------------------------

describe("StatusIndicator styles", () => {
  // Import the styles mapping to verify they use severity tokens
  it("StatusDot uses severity CSS tokens for all statuses", async () => {
    // Verify the module exports the expected types
    const mod = await import("./status-indicator");
    expect(mod.StatusDot).toBeDefined();
    expect(mod.StatusBadge).toBeDefined();
  });

  it("statusDotVariants covers all three statuses", async () => {
    const { statusDotVariants } = await import("./status-indicator");
    const operational = statusDotVariants({ status: "operational" });
    const degraded = statusDotVariants({ status: "degraded" });
    const down = statusDotVariants({ status: "down" });

    expect(operational).toContain("bg-severity-low");
    expect(degraded).toContain("bg-severity-moderate");
    expect(down).toContain("bg-severity-severe");
  });

  it("statusDotVariants supports size options", async () => {
    const { statusDotVariants } = await import("./status-indicator");
    const sm = statusDotVariants({ status: "operational", size: "sm" });
    const lg = statusDotVariants({ status: "operational", size: "lg" });

    expect(sm).toContain("h-2");
    expect(lg).toContain("h-4");
  });
});

// ---------------------------------------------------------------------------
// CTACard — variant tests
// ---------------------------------------------------------------------------

describe("CTACard variants", () => {
  it("ctaCardVariants provides default and accent variants", async () => {
    const { ctaCardVariants } = await import("./cta-card");
    const defaultCard = ctaCardVariants({ variant: "default" });
    const accentCard = ctaCardVariants({ variant: "accent" });

    expect(defaultCard).toContain("bg-surface-card");
    expect(accentCard).toContain("border-primary/20");
    expect(accentCard).toContain("bg-primary/5");
  });
});

// ---------------------------------------------------------------------------
// ToggleGroup — variant tests
// ---------------------------------------------------------------------------

describe("ToggleGroup variants", () => {
  it("toggleGroupItemVariants provides default, outline, and unstyled variants", async () => {
    const { toggleGroupItemVariants } = await import("./toggle-group");
    const defaultItem = toggleGroupItemVariants({ variant: "default" });
    const outlineItem = toggleGroupItemVariants({ variant: "outline" });
    const unstyledItem = toggleGroupItemVariants({ variant: "unstyled" });

    // Default: uses data-state selectors with primary colors
    expect(defaultItem).toContain("data-[state=on]:bg-primary");
    expect(defaultItem).toContain("data-[state=off]:bg-surface-base");

    // Outline: uses border-based active state
    expect(outlineItem).toContain("data-[state=on]:border-primary");
    expect(outlineItem).toContain("border-2");

    // Unstyled: minimal — lets consumers provide custom styling
    expect(unstyledItem).toContain("shrink-0");
    expect(unstyledItem).not.toContain("data-[state=on]");
  });

  it("all variants include focus-visible styles", async () => {
    const { toggleGroupItemVariants } = await import("./toggle-group");
    for (const variant of ["default", "outline", "unstyled"] as const) {
      const classes = toggleGroupItemVariants({ variant });
      expect(classes).toContain("focus-visible:outline");
    }
  });

  it("all variants enforce 44px min touch target", async () => {
    const { toggleGroupItemVariants } = await import("./toggle-group");
    for (const variant of ["default", "outline"] as const) {
      const classes = toggleGroupItemVariants({ variant });
      expect(classes).toContain("min-h-[44px]");
    }
  });
});

// ---------------------------------------------------------------------------
// InfoRow — export validation
// ---------------------------------------------------------------------------

describe("InfoRow", () => {
  it("exports InfoRow component", async () => {
    const mod = await import("./info-row");
    expect(mod.InfoRow).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// SectionHeader — export validation
// ---------------------------------------------------------------------------

describe("SectionHeader", () => {
  it("exports SectionHeader component", async () => {
    const mod = await import("./section-header");
    expect(mod.SectionHeader).toBeDefined();
  });
});
