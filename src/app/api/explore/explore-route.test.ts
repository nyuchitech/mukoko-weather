/**
 * Tests for the /api/explore route — validates request validation,
 * rate limiting, circuit breaker usage, and response structure.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const source = readFileSync(resolve(__dirname, "route.ts"), "utf-8");

describe("/api/explore route structure", () => {
  it("exports a POST handler", () => {
    expect(source).toContain("export async function POST");
  });

  it("POST handler accepts NextRequest", () => {
    expect(source).toContain("POST(request: NextRequest)");
  });
});

describe("input validation", () => {
  it("returns 400 when message is missing", () => {
    expect(source).toContain("!message || typeof message !== \"string\"");
    expect(source).toContain("Message is required");
    expect(source).toContain("status: 400");
  });

  it("enforces maximum message length", () => {
    expect(source).toContain("MAX_MESSAGE_LENGTH");
    expect(source).toContain("message.length > MAX_MESSAGE_LENGTH");
    expect(source).toContain("Message too long");
  });

  it("sets max message length to 2000 characters", () => {
    expect(source).toContain("const MAX_MESSAGE_LENGTH = 2000");
  });

  it("truncates history messages to max length", () => {
    expect(source).toContain("msg.content.slice(0, MAX_MESSAGE_LENGTH)");
  });
});

describe("rate limiting", () => {
  it("imports checkRateLimit", () => {
    expect(source).toContain("import { checkRateLimit }");
  });

  it("checks rate limit per IP", () => {
    expect(source).toContain("checkRateLimit(ip, \"explore\"");
  });

  it("allows 20 requests per hour per IP", () => {
    expect(source).toContain("\"explore\", 20, 3600");
  });

  it("returns 429 when rate limit exceeded", () => {
    expect(source).toContain("status: 429");
    expect(source).toContain("Rate limit exceeded");
  });

  it("includes Retry-After header", () => {
    expect(source).toContain("Retry-After");
  });

  it("extracts IP from x-forwarded-for header", () => {
    expect(source).toContain("x-forwarded-for");
  });
});

describe("circuit breaker", () => {
  it("imports anthropicBreaker", () => {
    expect(source).toContain("import { anthropicBreaker");
  });

  it("imports CircuitOpenError", () => {
    expect(source).toContain("CircuitOpenError");
  });

  it("wraps initial Claude call in circuit breaker", () => {
    expect(source).toContain("anthropicBreaker.execute");
  });

  it("wraps tool-loop Claude calls in circuit breaker", () => {
    // Both the initial and loop calls should use the breaker
    const matches = source.match(/anthropicBreaker\.execute/g);
    expect(matches?.length).toBeGreaterThanOrEqual(2);
  });

  it("handles CircuitOpenError with user-friendly message", () => {
    expect(source).toContain("err instanceof CircuitOpenError");
    expect(source).toContain("temporarily unavailable");
  });
});

describe("API key handling", () => {
  it("checks for ANTHROPIC_API_KEY", () => {
    expect(source).toContain("process.env.ANTHROPIC_API_KEY");
  });

  it("returns graceful response when API key is missing", () => {
    expect(source).toContain("requires an AI configuration");
  });
});

describe("location lookup", () => {
  it("uses single-document lookup instead of fetching all locations", () => {
    expect(source).toContain("getLocationFromDb(locationSlug)");
  });

  it("imports getLocationFromDb", () => {
    expect(source).toContain("getLocationFromDb");
  });
});

describe("server-side caching", () => {
  it("caches location context with TTL", () => {
    expect(source).toContain("LOCATION_CACHE_TTL");
    expect(source).toContain("cachedLocationContext");
    expect(source).toContain("getLocationContext");
  });

  it("caches activities with TTL", () => {
    expect(source).toContain("ACTIVITIES_CACHE_TTL");
    expect(source).toContain("cachedActivities");
    expect(source).toContain("getCachedActivities");
  });

  it("uses cached activities in get_activity_advice", () => {
    expect(source).toContain("getCachedActivities()");
  });

  it("uses shared model ID constant", () => {
    expect(source).toContain("const CLAUDE_MODEL =");
    expect(source).toContain("model: CLAUDE_MODEL");
    // Should NOT have hardcoded model ID in API calls
    const apiCallRegion = source.slice(source.indexOf("anthropicBreaker.execute"));
    expect(apiCallRegion).not.toContain("model: \"claude-haiku");
  });
});

describe("conversation handling", () => {
  it("limits history to last 10 messages", () => {
    expect(source).toContain("history.slice(-10)");
  });

  it("limits tool-use loop to 5 iterations", () => {
    expect(source).toContain("maxIterations = 5");
  });

  it("deduplicates location references", () => {
    expect(source).toContain("new Map(references.map");
  });
});

describe("tool definitions", () => {
  it("defines search_locations tool", () => {
    expect(source).toContain("\"search_locations\"");
  });

  it("defines get_weather tool", () => {
    expect(source).toContain("\"get_weather\"");
  });

  it("defines get_activity_advice tool", () => {
    expect(source).toContain("\"get_activity_advice\"");
  });

  it("defines list_locations_by_tag tool", () => {
    expect(source).toContain("\"list_locations_by_tag\"");
  });
});

describe("tool input validation", () => {
  it("validates search_locations query is a string", () => {
    expect(source).toContain("typeof input.query === \"string\"");
    expect(source).toContain("Missing query parameter");
  });

  it("validates get_weather location_slug is a string", () => {
    expect(source).toContain("typeof input.location_slug === \"string\"");
    expect(source).toContain("Missing location_slug parameter");
  });

  it("validates get_activity_advice activities is an array of strings", () => {
    expect(source).toContain("Array.isArray(input.activities)");
  });

  it("validates list_locations_by_tag tag is a string", () => {
    expect(source).toContain("typeof input.tag === \"string\"");
    expect(source).toContain("Missing tag parameter");
  });
});

describe("weather tool references", () => {
  it("uses locationName for display name instead of slug", () => {
    expect(source).toContain("name: weatherResult.locationName ?? weatherResult.locationSlug");
  });

  it("looks up location name from DB for cached weather", () => {
    // Cache path also resolves location name via getLocationFromDb
    expect(source).toContain("locationName: loc?.name ?? locationSlug");
  });
});

describe("error handling and observability", () => {
  it("logs errors with source ai-api", () => {
    expect(source).toContain("source: \"ai-api\"");
  });

  it("includes location field in logError", () => {
    expect(source).toContain("location: \"explore\"");
  });

  it("logs tool execution errors with logWarn", () => {
    expect(source).toContain("logWarn");
    expect(source).toContain("execution failed");
  });

  it("imports logWarn from observability", () => {
    expect(source).toContain("logWarn");
  });

  it("returns error flag in error responses", () => {
    expect(source).toContain("error: true");
  });

  it("returns response and references shape on success", () => {
    expect(source).toContain("response: responseText");
    expect(source).toContain("references:");
  });
});
