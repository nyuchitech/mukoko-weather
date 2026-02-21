import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { logError } from "@/lib/observability";
import { checkRateLimit } from "@/lib/rate-limit";
import { anthropicBreaker, CircuitOpenError } from "@/lib/circuit-breaker";
import {
  getAllLocationsFromDb,
  getLocationFromDb,
  searchLocationsFromDb,
  getAllActivitiesFromDb,
  getCachedWeather,
  getWeatherForLocation,
  getSeasonForDate,
  getLocationsByTagFromDb,
  type LocationDoc,
} from "@/lib/db";

/** Maximum allowed message length (characters). */
const MAX_MESSAGE_LENGTH = 2000;

// ---------------------------------------------------------------------------
// System prompt for the Explore assistant
// ---------------------------------------------------------------------------

const EXPLORE_SYSTEM_PROMPT = `You are Shamwari Explorer, the conversational AI assistant for mukoko weather — an AI-powered weather intelligence platform focused on Africa and developing regions.

Your personality:
- Warm, knowledgeable, and community-minded (Ubuntu philosophy)
- You speak with authority about weather, geography, agriculture, industry, and culture
- You are helpful, concise, and always actionable
- You prioritise safety and practical advice

You help users:
1. Discover locations and their weather conditions
2. Get activity-specific weather advice (farming, mining, travel, tourism, sports, drone flying, etc.)
3. Compare weather across locations
4. Understand seasonal patterns and forecasts
5. Plan activities based on current and forecasted weather

DATA GUARDRAILS — CRITICAL:
- ONLY use weather data returned by the tools (search_locations, get_weather, get_activity_advice, list_locations_by_tag). NEVER invent, estimate, or hallucinate weather numbers.
- All weather data comes from Tomorrow.io (primary) and Open-Meteo (fallback) APIs. Do not reference or claim data from any other weather provider.
- If a tool returns no data or an error, say so honestly — do not guess or fill in numbers.
- ONLY discuss locations that exist in our database. Use the search_locations tool to verify a location exists before providing weather info.
- Do not provide medical, legal, or financial advice. Stick to weather, activity planning, and geography.
- If asked about topics unrelated to weather, locations, or outdoor activities, politely redirect to weather-related topics.

When responding:
- Use markdown formatting: **bold** for emphasis, bullet points for lists, and clear structure
- Be concise but informative — aim for 3-6 sentences per topic
- When weather data is provided, reference specific numbers (temperatures, wind speeds, etc.)
- Always include at least one actionable recommendation
- Do not use emoji
- When mentioning a location, format it as a clickable link: [Location Name](/location-slug)
- When discussing activities, mention specific weather factors that matter (wind for drones, visibility for travel, etc.)
- If the user asks about a location you have data for, always include current conditions
- If you can't find the exact location, suggest similar ones from the available data

Available activity categories: farming, mining, travel, tourism, sports, casual
Key activities: crop farming, livestock, gardening, irrigation, mining, construction, driving, commuting, flying, safari, photography, birdwatching, camping, stargazing, fishing, running, cycling, hiking, football, swimming, golf, cricket, tennis, rugby, horse riding, walking, barbecue, outdoor events, drone flying, picnic`;

// ---------------------------------------------------------------------------
// Tool definitions for Claude function calling
// ---------------------------------------------------------------------------

const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_locations",
    description:
      "Search for weather locations by name, province, or country. Returns matching locations with their coordinates and tags.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query — location name, province, or country",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_weather",
    description:
      "Get current weather conditions and forecast for a specific location by its slug (URL-safe name). Returns temperature, humidity, wind, precipitation, UV index, and 7-day forecast.",
    input_schema: {
      type: "object" as const,
      properties: {
        location_slug: {
          type: "string",
          description: "The URL slug of the location (e.g. 'harare', 'victoria-falls', 'bulawayo')",
        },
      },
      required: ["location_slug"],
    },
  },
  {
    name: "get_activity_advice",
    description:
      "Get weather suitability advice for specific activities at a location. Checks wind, visibility, precipitation, UV, heat stress, and thunderstorm risk relevant to the activity.",
    input_schema: {
      type: "object" as const,
      properties: {
        location_slug: {
          type: "string",
          description: "The URL slug of the location",
        },
        activities: {
          type: "array",
          items: { type: "string" },
          description: "Activity IDs to check (e.g. ['drone-flying', 'hiking', 'crop-farming'])",
        },
      },
      required: ["location_slug", "activities"],
    },
  },
  {
    name: "list_locations_by_tag",
    description:
      "List all locations matching a specific tag/category. Tags: city, farming, mining, tourism, national-park, education, border, travel.",
    input_schema: {
      type: "object" as const,
      properties: {
        tag: {
          type: "string",
          description: "The location tag to filter by",
        },
      },
      required: ["tag"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution helpers
// ---------------------------------------------------------------------------

async function executeSearchLocations(query: string) {
  const result = await searchLocationsFromDb(query);
  if (result.locations.length === 0) {
    return { found: false, message: `No locations found for "${query}"`, locations: [] };
  }
  return {
    found: true,
    count: result.total,
    locations: result.locations.slice(0, 10).map((loc) => ({
      name: loc.name,
      slug: loc.slug,
      province: loc.province,
      country: loc.country ?? "ZW",
      tags: loc.tags,
      lat: loc.lat,
      lon: loc.lon,
      elevation: loc.elevation,
    })),
  };
}

async function executeGetWeather(locationSlug: string) {
  // Try cache first, then fetch fresh
  const cached = await getCachedWeather(locationSlug);
  if (cached) {
    // Look up the location name for display purposes
    const loc = await getLocationFromDb(locationSlug);
    const season = await getSeasonForDate(new Date(), loc?.country ?? "ZW");
    return {
      found: true,
      locationSlug,
      locationName: loc?.name ?? locationSlug,
      current: {
        temperature: cached.current.temperature_2m,
        feelsLike: cached.current.apparent_temperature,
        humidity: cached.current.relative_humidity_2m,
        windSpeed: cached.current.wind_speed_10m,
        windGusts: cached.current.wind_gusts_10m,
        windDirection: cached.current.wind_direction_10m,
        precipitation: cached.current.precipitation,
        cloudCover: cached.current.cloud_cover,
        uvIndex: cached.current.uv_index,
        pressure: cached.current.surface_pressure,
      },
      daily: {
        dates: cached.daily.time.slice(0, 5),
        maxTemps: cached.daily.temperature_2m_max.slice(0, 5),
        minTemps: cached.daily.temperature_2m_min.slice(0, 5),
        precipitationSum: cached.daily.precipitation_sum.slice(0, 5),
        precipitationProbability: cached.daily.precipitation_probability_max.slice(0, 5),
        maxWindSpeed: cached.daily.wind_speed_10m_max.slice(0, 5),
        uvIndexMax: cached.daily.uv_index_max.slice(0, 5),
      },
      insights: cached.insights ?? null,
      season: { name: season.name, shona: season.shona, description: season.description },
    };
  }

  // Try fetching fresh weather data
  try {
    const location = await getLocationFromDb(locationSlug);
    if (!location) {
      return { found: false, message: `Location "${locationSlug}" not found` };
    }
    const weatherResult = await getWeatherForLocation(
      location.slug,
      location.lat,
      location.lon,
      location.elevation,
    );
    const weather = weatherResult.data;
    const season = await getSeasonForDate(new Date(), location.country ?? "ZW");
    return {
      found: true,
      locationSlug: location.slug,
      locationName: location.name,
      current: {
        temperature: weather.current.temperature_2m,
        feelsLike: weather.current.apparent_temperature,
        humidity: weather.current.relative_humidity_2m,
        windSpeed: weather.current.wind_speed_10m,
        windGusts: weather.current.wind_gusts_10m,
        windDirection: weather.current.wind_direction_10m,
        precipitation: weather.current.precipitation,
        cloudCover: weather.current.cloud_cover,
        uvIndex: weather.current.uv_index,
        pressure: weather.current.surface_pressure,
      },
      daily: {
        dates: weather.daily.time.slice(0, 5),
        maxTemps: weather.daily.temperature_2m_max.slice(0, 5),
        minTemps: weather.daily.temperature_2m_min.slice(0, 5),
        precipitationSum: weather.daily.precipitation_sum.slice(0, 5),
        precipitationProbability: weather.daily.precipitation_probability_max.slice(0, 5),
        maxWindSpeed: weather.daily.wind_speed_10m_max.slice(0, 5),
        uvIndexMax: weather.daily.uv_index_max.slice(0, 5),
      },
      insights: weather.insights ?? null,
      season: { name: season.name, shona: season.shona, description: season.description },
    };
  } catch {
    return { found: false, message: `Unable to fetch weather for "${locationSlug}"` };
  }
}

async function executeGetActivityAdvice(locationSlug: string, activityIds: string[]) {
  const weatherResult = await executeGetWeather(locationSlug);
  if (!weatherResult.found) {
    return weatherResult;
  }

  const allActivities = await getAllActivitiesFromDb();
  const matchedActivities = activityIds
    .map((id) => allActivities.find((a) => a.id === id))
    .filter((a) => a != null);

  return {
    found: true,
    locationSlug,
    weather: weatherResult,
    activities: matchedActivities.map((a) => ({
      id: a.id,
      label: a.label,
      category: a.category,
      description: a.description,
    })),
    insights: "insights" in weatherResult ? weatherResult.insights : null,
  };
}

async function executeListLocationsByTag(tag: string) {
  const locations = await getLocationsByTagFromDb(tag);
  return {
    tag,
    count: locations.length,
    locations: locations.slice(0, 15).map((loc: LocationDoc) => ({
      name: loc.name,
      slug: loc.slug,
      province: loc.province,
      country: loc.country ?? "ZW",
    })),
  };
}

// ---------------------------------------------------------------------------
// Main POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting ────────────────────────────────────────────────────────
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateLimit = await checkRateLimit(ip, "explore", 20, 3600); // 20 requests/hour/IP
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)) },
        },
      );
    }

    const { message, history } = await request.json();

    // ── Input validation ─────────────────────────────────────────────────────
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        response: "The Explore assistant requires an AI configuration. Please check the setup.",
        references: [],
      });
    }

    const anthropic = new Anthropic({ apiKey });

    // Build conversation history
    const messages: Anthropic.MessageParam[] = [];

    // Add prior conversation history if provided
    if (Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        if (msg.role === "user" && typeof msg.content === "string") {
          messages.push({ role: "user", content: msg.content.slice(0, MAX_MESSAGE_LENGTH) });
        } else if (msg.role === "assistant" && typeof msg.content === "string") {
          messages.push({ role: "assistant", content: msg.content });
        }
      }
    }

    // Add the current message
    messages.push({ role: "user", content: message });

    // Fetch location context to give Claude awareness of available locations
    let locationContext = "";
    try {
      const allLocations = await getAllLocationsFromDb();
      const locationNames = allLocations.slice(0, 50).map(
        (l: LocationDoc) => `${l.name} (/${l.slug}) — ${l.province}, ${(l.country ?? "ZW").toUpperCase()}`
      );
      locationContext = `\n\nAvailable locations (sample of ${allLocations.length} total):\n${locationNames.join("\n")}`;
    } catch {
      // Continue without location context
    }

    // ── Claude call with circuit breaker ──────────────────────────────────────
    let response = await anthropicBreaker.execute(() =>
      anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: EXPLORE_SYSTEM_PROMPT + locationContext,
        tools: TOOLS,
        messages,
      }),
    );

    // Agentic tool-use loop — process tool calls until Claude returns a final text response
    const maxIterations = 5;
    let iterations = 0;
    const references: { slug: string; name: string; type: string }[] = [];

    while (response.stop_reason === "tool_use" && iterations < maxIterations) {
      iterations++;
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        let result: unknown;
        try {
          const input = toolUse.input as Record<string, unknown>;
          switch (toolUse.name) {
            case "search_locations": {
              const query = typeof input.query === "string" ? input.query : "";
              if (!query) { result = { error: "Missing query parameter" }; break; }
              result = await executeSearchLocations(query);
              const searchResult = result as { found: boolean; locations?: { slug: string; name: string }[] };
              if (searchResult.found && searchResult.locations) {
                for (const loc of searchResult.locations) {
                  references.push({ slug: loc.slug, name: loc.name, type: "location" });
                }
              }
              break;
            }
            case "get_weather": {
              const slug = typeof input.location_slug === "string" ? input.location_slug : "";
              if (!slug) { result = { error: "Missing location_slug parameter" }; break; }
              result = await executeGetWeather(slug);
              const weatherResult = result as { found: boolean; locationSlug?: string; locationName?: string };
              if (weatherResult.found && weatherResult.locationSlug) {
                references.push({ slug: weatherResult.locationSlug, name: weatherResult.locationName ?? weatherResult.locationSlug, type: "weather" });
              }
              break;
            }
            case "get_activity_advice": {
              const slug = typeof input.location_slug === "string" ? input.location_slug : "";
              const activities = Array.isArray(input.activities) ? input.activities.filter((a): a is string => typeof a === "string") : [];
              if (!slug) { result = { error: "Missing location_slug parameter" }; break; }
              result = await executeGetActivityAdvice(slug, activities);
              break;
            }
            case "list_locations_by_tag": {
              const tag = typeof input.tag === "string" ? input.tag : "";
              if (!tag) { result = { error: "Missing tag parameter" }; break; }
              result = await executeListLocationsByTag(tag);
              break;
            }
            default:
              result = { error: `Unknown tool: ${toolUse.name}` };
          }
        } catch (err) {
          result = { error: `Tool execution failed: ${err instanceof Error ? err.message : "Unknown error"}` };
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // Continue conversation with tool results
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });

      response = await anthropicBreaker.execute(() =>
        anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: EXPLORE_SYSTEM_PROMPT + locationContext,
          tools: TOOLS,
          messages,
        }),
      );
    }

    // Extract the final text response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const responseText = textBlock?.text ?? "I wasn't able to process that request. Please try rephrasing your question.";

    return NextResponse.json({
      response: responseText,
      references: [...new Map(references.map((r) => [r.slug, r])).values()],
    });
  } catch (err) {
    // Circuit breaker is open — Anthropic is temporarily unavailable
    if (err instanceof CircuitOpenError) {
      return NextResponse.json({
        response: "The AI assistant is temporarily unavailable due to service issues. Please try again in a few minutes.",
        references: [],
        error: true,
      });
    }

    logError({
      source: "ai-api",
      severity: "medium",
      message: "Explore assistant error",
      location: "explore",
      error: err,
    });

    return NextResponse.json({
      response: "I'm having trouble processing your request right now. Please try again in a moment.",
      references: [],
      error: true,
    });
  }
}
