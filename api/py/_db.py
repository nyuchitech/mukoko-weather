"""
Shared MongoDB connection for all Python API endpoints.

Module-scoped client — reused across warm Vercel serverless invocations.
Uses the same MONGODB_URI and database as the Next.js app.
"""

from __future__ import annotations

import os
from typing import Optional

from fastapi import HTTPException
from pymongo import MongoClient
from pymongo.database import Database

_client: Optional[MongoClient] = None


def get_db() -> Database:
    """Lazy-init MongoDB client. Reuses connection across warm Vercel instances."""
    global _client
    if _client is None:
        uri = os.environ.get("MONGODB_URI")
        if not uri:
            raise HTTPException(status_code=503, detail="Database unavailable")
        _client = MongoClient(uri, appName="mukoko-weather-py", maxIdleTimeMS=5000)
    return _client["mukoko-weather"]


# ---------------------------------------------------------------------------
# Collection accessors
# ---------------------------------------------------------------------------


def device_profiles_collection():
    return get_db()["device_profiles"]


def locations_collection():
    return get_db()["locations"]


def weather_cache_collection():
    return get_db()["weather_cache"]


def ai_summaries_collection():
    return get_db()["ai_summaries"]


def activities_collection():
    return get_db()["activities"]


def suitability_rules_collection():
    return get_db()["suitability_rules"]


def rate_limits_collection():
    return get_db()["rate_limits"]


def api_keys_collection():
    return get_db()["api_keys"]


def tags_collection():
    return get_db()["tags"]


def ai_prompts_collection():
    return get_db()["ai_prompts"]


def ai_suggested_rules_collection():
    return get_db()["ai_suggested_rules"]


def weather_reports_collection():
    return get_db()["weather_reports"]


def history_analysis_collection():
    return get_db()["history_analysis"]


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


def get_api_key(provider: str) -> Optional[str]:
    """Fetch an API key from MongoDB."""
    doc = api_keys_collection().find_one({"provider": provider})
    return doc["key"] if doc else None


def check_rate_limit(ip: str, action: str, max_requests: int, window_seconds: int) -> dict:
    """
    MongoDB-backed rate limiter using atomic findOneAndUpdate.
    Returns { "allowed": bool, "remaining": int }.
    """
    from datetime import datetime, timezone, timedelta

    key = f"{action}:{ip}"
    now = datetime.now(timezone.utc)
    expires = now + timedelta(seconds=window_seconds)

    result = rate_limits_collection().find_one_and_update(
        {"key": key},
        {
            "$inc": {"count": 1},
            "$setOnInsert": {"expiresAt": expires},
        },
        upsert=True,
        return_document=True,
    )

    count = result.get("count", 1) if result else 1
    allowed = count <= max_requests
    return {"allowed": allowed, "remaining": max(0, max_requests - count)}
