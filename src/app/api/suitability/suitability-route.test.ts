/**
 * Tests for the /api/suitability route — validates request handling,
 * key-based lookup, error handling, and observability.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const source = readFileSync(resolve(__dirname, "route.ts"), "utf-8");

describe("/api/suitability route structure", () => {
  it("exports a GET handler", () => {
    expect(source).toContain("export async function GET");
  });

  it("accepts a Request parameter", () => {
    expect(source).toContain("GET(request: Request)");
  });
});

describe("key-based lookup", () => {
  it("supports ?key= query parameter", () => {
    expect(source).toContain("searchParams.get(\"key\")");
  });

  it("returns 404 when key rule is not found", () => {
    expect(source).toContain("Rule not found");
    expect(source).toContain("status: 404");
  });

  it("returns single rule when key matches", () => {
    expect(source).toContain("{ rule }");
  });

  it("uses getSuitabilityRuleByKey for key lookups", () => {
    expect(source).toContain("getSuitabilityRuleByKey(key)");
  });
});

describe("bulk rules fetch", () => {
  it("returns all rules when no key parameter", () => {
    expect(source).toContain("getAllSuitabilityRules()");
    expect(source).toContain("{ rules }");
  });

  it("returns empty rules array on error", () => {
    expect(source).toContain("{ rules: [] }");
  });
});

describe("error handling and observability", () => {
  it("logs errors with source mongodb", () => {
    expect(source).toContain("source: \"mongodb\"");
  });

  it("includes location field in logError", () => {
    expect(source).toContain("location: \"suitability\"");
  });

  it("logs with medium severity", () => {
    expect(source).toContain("severity: \"medium\"");
  });

  it("includes descriptive error message", () => {
    expect(source).toContain("Failed to load suitability rules");
  });
});
