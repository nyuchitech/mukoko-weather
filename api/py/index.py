"""
Device Profile API — Phase 1 Python service for mukoko weather.

Manages device preferences (theme, location, activities) with MongoDB persistence.
Runs as a Vercel Python serverless function alongside the Next.js app.

Endpoints:
  POST   /api/py/devices              — create a new device profile
  GET    /api/py/devices/{device_id}   — get device profile
  PATCH  /api/py/devices/{device_id}   — update preferences
  GET    /api/py/health                — health check
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, DuplicateKeyError

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="mukoko weather — Device Profile API",
    version="1.0.0",
    docs_url=None,  # Disable Swagger UI in production
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# ---------------------------------------------------------------------------
# MongoDB connection (module-scoped, reused across warm invocations)
# ---------------------------------------------------------------------------

_client: Optional[MongoClient] = None


def get_db():
    """Lazy-init MongoDB client. Reuses connection across warm Vercel instances."""
    global _client
    if _client is None:
        uri = os.environ.get("MONGODB_URI")
        if not uri:
            raise HTTPException(
                status_code=503,
                detail="Database unavailable",
            )
        _client = MongoClient(uri, appName="mukoko-weather-py", maxIdleTimeMS=5000)
    return _client["mukoko-weather"]


def device_profiles_collection():
    return get_db()["device_profiles"]


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class Preferences(BaseModel):
    """User preferences that are persisted and recoverable."""
    theme: str = "system"  # "light" | "dark" | "system"
    selectedLocation: str = "harare"
    selectedActivities: list[str] = Field(default_factory=list)
    hasOnboarded: bool = False


class CreateDeviceRequest(BaseModel):
    """Request body for creating a new device profile."""
    deviceId: Optional[str] = None  # Client can provide or server generates
    preferences: Preferences = Field(default_factory=Preferences)


class UpdatePreferencesRequest(BaseModel):
    """Partial update — only provided fields are changed."""
    theme: Optional[str] = None
    selectedLocation: Optional[str] = None
    selectedActivities: Optional[list[str]] = None
    hasOnboarded: Optional[bool] = None


class DeviceProfileResponse(BaseModel):
    """Response shape for device profile endpoints."""
    deviceId: str
    preferences: Preferences
    createdAt: str
    updatedAt: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

VALID_THEMES = {"light", "dark", "system"}
MAX_ACTIVITIES = 30
SLUG_RE_PATTERN = r"^[a-z0-9-]{1,80}$"


def validate_theme(theme: str) -> str:
    if theme not in VALID_THEMES:
        raise HTTPException(status_code=400, detail=f"Invalid theme: {theme}")
    return theme


def validate_slug(slug: str) -> str:
    import re
    if not re.match(SLUG_RE_PATTERN, slug):
        raise HTTPException(status_code=400, detail=f"Invalid location slug: {slug}")
    return slug


def validate_activities(activities: list[str]) -> list[str]:
    if len(activities) > MAX_ACTIVITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many activities (max {MAX_ACTIVITIES})",
        )
    return activities


def doc_to_response(doc: dict) -> DeviceProfileResponse:
    """Convert MongoDB document to API response."""
    prefs = doc.get("preferences", {})
    return DeviceProfileResponse(
        deviceId=doc["deviceId"],
        preferences=Preferences(
            theme=prefs.get("theme", "system"),
            selectedLocation=prefs.get("selectedLocation", "harare"),
            selectedActivities=prefs.get("selectedActivities", []),
            hasOnboarded=prefs.get("hasOnboarded", False),
        ),
        createdAt=doc.get("createdAt", datetime.now(timezone.utc)).isoformat(),
        updatedAt=doc.get("updatedAt", datetime.now(timezone.utc)).isoformat(),
    )


# ---------------------------------------------------------------------------
# Ensure indexes (called lazily on first write)
# ---------------------------------------------------------------------------

_indexes_ensured = False


def ensure_indexes():
    global _indexes_ensured
    if _indexes_ensured:
        return
    col = device_profiles_collection()
    col.create_index("deviceId", unique=True)
    _indexes_ensured = True


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/api/py/health")
async def health():
    """Health check — verifies MongoDB connectivity."""
    try:
        db = get_db()
        db.command("ping")
        return {"status": "ok", "service": "device-profiles", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "service": "device-profiles", "database": "unavailable"},
        )


@app.post("/api/py/devices", status_code=201)
async def create_device(body: CreateDeviceRequest):
    """
    Create a new device profile.

    If deviceId is provided (migration case), uses that ID.
    Otherwise generates a new UUID.
    """
    ensure_indexes()

    device_id = body.deviceId or str(uuid.uuid4())

    # Validate preferences
    validate_theme(body.preferences.theme)
    validate_slug(body.preferences.selectedLocation)
    validate_activities(body.preferences.selectedActivities)

    now = datetime.now(timezone.utc)
    doc = {
        "deviceId": device_id,
        "preferences": body.preferences.model_dump(),
        "createdAt": now,
        "updatedAt": now,
    }

    try:
        device_profiles_collection().insert_one(doc)
    except DuplicateKeyError:
        # Device already exists — return existing profile instead of erroring.
        # This handles the case where migration runs twice (idempotent).
        existing = device_profiles_collection().find_one({"deviceId": device_id})
        if existing:
            return doc_to_response(existing)
        raise HTTPException(status_code=409, detail="Device profile already exists")

    return doc_to_response(doc)


@app.get("/api/py/devices/{device_id}")
async def get_device(device_id: str):
    """Get a device profile by ID."""
    doc = device_profiles_collection().find_one({"deviceId": device_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Device profile not found")
    return doc_to_response(doc)


@app.patch("/api/py/devices/{device_id}")
async def update_preferences(device_id: str, body: UpdatePreferencesRequest):
    """
    Partially update device preferences.

    Only provided (non-null) fields are updated. This allows the client
    to sync individual preference changes without overwriting everything.
    """
    # Build $set update from non-null fields
    updates: dict = {}
    if body.theme is not None:
        validate_theme(body.theme)
        updates["preferences.theme"] = body.theme
    if body.selectedLocation is not None:
        validate_slug(body.selectedLocation)
        updates["preferences.selectedLocation"] = body.selectedLocation
    if body.selectedActivities is not None:
        validate_activities(body.selectedActivities)
        updates["preferences.selectedActivities"] = body.selectedActivities
    if body.hasOnboarded is not None:
        updates["preferences.hasOnboarded"] = body.hasOnboarded

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates["updatedAt"] = datetime.now(timezone.utc)

    result = device_profiles_collection().find_one_and_update(
        {"deviceId": device_id},
        {"$set": updates},
        return_document=True,  # Return the updated document
    )

    if not result:
        raise HTTPException(status_code=404, detail="Device profile not found")

    return doc_to_response(result)


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------


@app.exception_handler(ConnectionFailure)
async def mongo_connection_error(request: Request, exc: ConnectionFailure):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database temporarily unavailable"},
    )
