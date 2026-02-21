import { NextResponse } from "next/server";
import { getAllSuitabilityRules, getSuitabilityRuleByKey } from "@/lib/db";
import { logError } from "@/lib/observability";

/**
 * GET /api/suitability
 *
 * Returns all suitability rules from the database.
 * Used by ActivityInsights to evaluate weather conditions dynamically.
 *
 * Query parameters:
 *   ?key=activity:drone-flying — Get a specific rule by key
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      const rule = await getSuitabilityRuleByKey(key);
      if (!rule) {
        return NextResponse.json({ error: "Rule not found" }, { status: 404 });
      }
      return NextResponse.json({ rule });
    }

    const rules = await getAllSuitabilityRules();
    return NextResponse.json({ rules });
  } catch (err) {
    logError({
      source: "mongodb",
      severity: "medium",
      message: "Failed to load suitability rules",
      location: "suitability",
      error: err,
    });
    return NextResponse.json({ rules: [] });
  }
}
