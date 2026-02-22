/**
 * Tests for the OG image API route — validates route structure, template
 * definitions, parameter handling, and brand token usage.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const source = readFileSync(resolve(__dirname, "route.tsx"), "utf-8");

describe("OG route structure", () => {
  it("uses edge runtime for fast cold starts", () => {
    expect(source).toContain('export const runtime = "edge"');
  });

  it("exports a GET handler", () => {
    expect(source).toContain("export async function GET");
  });

  it("uses ImageResponse from next/og", () => {
    expect(source).toContain('import { ImageResponse } from "next/og"');
  });

  it("generates a 1200x630 image", () => {
    expect(source).toContain("width: 1200");
    expect(source).toContain("height: 630");
  });
});

describe("brand tokens", () => {
  it("uses tanzanite primary color", () => {
    expect(source).toContain("#4B0082");
  });

  it("uses cobalt secondary color", () => {
    expect(source).toContain("#0047AB");
  });

  it("uses malachite color", () => {
    expect(source).toContain("#004D40");
  });

  it("uses gold accent color", () => {
    expect(source).toContain("#F9A825");
  });

  it("includes Zimbabwe flag colors for accent stripe", () => {
    expect(source).toContain("#00A651"); // green
    expect(source).toContain("#FDD116"); // yellow
    expect(source).toContain("#D4634A"); // red
  });

  it("shows mukoko weather brand name", () => {
    expect(source).toContain("mukoko weather");
  });

  it("shows weather.mukoko.com URL", () => {
    expect(source).toContain("weather.mukoko.com");
  });
});

describe("templates", () => {
  it("defines home template", () => {
    expect(source).toContain("home:");
    expect(source).toContain("Weather Intelligence");
  });

  it("defines location template", () => {
    expect(source).toContain("location:");
    expect(source).toContain("Live Forecast");
  });

  it("defines explore template", () => {
    expect(source).toContain("explore:");
    expect(source).toContain("Explore Locations");
  });

  it("defines history template", () => {
    expect(source).toContain("history:");
    expect(source).toContain("Weather History");
  });

  it("defines season template", () => {
    expect(source).toContain("season:");
    expect(source).toContain("Seasonal Outlook");
  });

  it("defines shamwari template", () => {
    expect(source).toContain("shamwari:");
    expect(source).toContain("Shamwari Weather");
  });

  it("validates template parameter with fallback to home", () => {
    expect(source).toContain("templateParam in TEMPLATES");
  });
});

describe("query parameters", () => {
  it("reads title from search params", () => {
    expect(source).toContain('searchParams.get("title")');
  });

  it("reads subtitle from search params", () => {
    expect(source).toContain('searchParams.get("subtitle")');
  });

  it("reads location from search params", () => {
    expect(source).toContain('searchParams.get("location")');
  });

  it("reads province from search params", () => {
    expect(source).toContain('searchParams.get("province")');
  });

  it("reads temperature from search params", () => {
    expect(source).toContain('searchParams.get("temp")');
  });

  it("reads condition from search params", () => {
    expect(source).toContain('searchParams.get("condition")');
  });

  it("reads season from search params", () => {
    expect(source).toContain('searchParams.get("season")');
  });

  it("reads template from search params", () => {
    expect(source).toContain('searchParams.get("template")');
  });

  it("provides sensible defaults for all parameters", () => {
    expect(source).toContain('?? "AI Weather Intelligence"');
    expect(source).toContain('?? ""');
    expect(source).toContain('?? "home"');
  });
});

describe("OG image component", () => {
  it("renders title with responsive font size", () => {
    expect(source).toContain("title.length > 50");
    expect(source).toContain("title.length > 30");
  });

  it("conditionally renders season pill", () => {
    expect(source).toContain("{season && (");
  });

  it("conditionally renders temperature badge", () => {
    expect(source).toContain("{temperature && (");
  });

  it("conditionally renders condition text", () => {
    expect(source).toContain("{condition && (");
  });

  it("conditionally renders location in footer", () => {
    expect(source).toContain("{location && (");
  });

  it("appends province to location when present", () => {
    expect(source).toContain("province ?");
  });

  it("includes Ubuntu philosophy quote", () => {
    expect(source).toContain("Rain unites people");
  });

  it("renders large decorative emoji per template", () => {
    expect(source).toContain("{tmpl.emoji}");
  });

  it("uses template gradient for background", () => {
    expect(source).toContain("tmpl.gradient");
  });

  it("uses template badge text", () => {
    expect(source).toContain("tmpl.badge");
  });
});

describe("OG image wiring in metadata", () => {
  const layoutSource = readFileSync(
    resolve(__dirname, "../../layout.tsx"),
    "utf-8",
  );
  const locationPageSource = readFileSync(
    resolve(__dirname, "../../[location]/page.tsx"),
    "utf-8",
  );

  it("layout.tsx includes OG image URL for home template", () => {
    expect(layoutSource).toContain("/api/og?");
    expect(layoutSource).toContain("template=home");
  });

  it("layout.tsx sets OG image dimensions", () => {
    expect(layoutSource).toContain("width: 1200");
    expect(layoutSource).toContain("height: 630");
  });

  it("layout.tsx includes twitter image", () => {
    expect(layoutSource).toContain("twitter:");
    expect(layoutSource).toContain("/api/og?");
  });

  it("[location]/page.tsx builds dynamic OG image URL", () => {
    expect(locationPageSource).toContain("/api/og?");
    expect(locationPageSource).toContain("ogParams");
    expect(locationPageSource).toContain("ogImageUrl");
  });

  it("[location]/page.tsx uses location template", () => {
    expect(locationPageSource).toContain('template: "location"');
  });

  it("[location]/page.tsx includes location name and province in OG params", () => {
    expect(locationPageSource).toContain("location: loc.name");
    expect(locationPageSource).toContain("province: loc.province");
  });

  it("[location]/page.tsx uses local season from DB (not hardcoded)", () => {
    // Season comes from getSeasonForDate (DB-driven), not getZimbabweSeason (legacy)
    expect(locationPageSource).toContain("getSeasonForDate");
    // The season name is passed to OG params
    expect(locationPageSource).toContain("season: season.name");
  });

  it("[location]/page.tsx passes OG image to openGraph.images", () => {
    expect(locationPageSource).toContain("images: [{ url: ogImageUrl");
  });

  it("[location]/page.tsx passes OG image to twitter.images", () => {
    expect(locationPageSource).toContain("images: [ogImageUrl]");
  });
});
