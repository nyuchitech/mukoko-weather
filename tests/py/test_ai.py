"""Tests for _ai.py — AI summary generation, TTL tiers, caching, season lookup."""

from __future__ import annotations

import os
import time
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock

import pytest

from py._ai import (
    _get_ttl,
    _get_client,
    _get_season,
    _is_stale,
    _get_cached_summary,
    _set_cached_summary,
    _get_system_prompt,
    generate_summary,
    AISummaryRequest,
    LocationInfo,
    TIER_2_TAGS,
    TTL_TIER_1,
    TTL_TIER_2,
    TTL_TIER_3,
    _FALLBACK_SYSTEM_PROMPT,
)


# ---------------------------------------------------------------------------
# _get_ttl — tiered TTL (data-driven via tags)
# ---------------------------------------------------------------------------


class TestGetTtl:
    def test_tier_1_city_tag(self):
        assert _get_ttl("any-city", ["city"]) == TTL_TIER_1
        assert _get_ttl("any-city", ["city"]) == 1800  # 30 min

    def test_tier_1_city_overrides_tier_2_tags(self):
        """Locations with both 'city' and tier-2 tags should get tier 1 TTL."""
        assert _get_ttl("any-city", ["city", "farming"]) == TTL_TIER_1

    def test_tier_2_farming_tag(self):
        assert _get_ttl("some-farm", ["farming"]) == TTL_TIER_2
        assert _get_ttl("some-farm", ["farming"]) == 3600  # 60 min

    def test_tier_2_mining_tag(self):
        assert _get_ttl("mine-site", ["mining"]) == TTL_TIER_2

    def test_tier_2_education_tag(self):
        assert _get_ttl("university", ["education"]) == TTL_TIER_2

    def test_tier_2_border_tag(self):
        assert _get_ttl("border-post", ["border"]) == TTL_TIER_2

    def test_tier_3_default(self):
        assert _get_ttl("small-place", ["tourism"]) == TTL_TIER_3
        assert _get_ttl("small-place", ["tourism"]) == 7200  # 120 min

    def test_tier_3_no_tags(self):
        assert _get_ttl("unknown", []) == TTL_TIER_3

    def test_tier_2_tags_set(self):
        """Verify the set of tags that qualify for tier 2."""
        assert TIER_2_TAGS == {"farming", "mining", "education", "border"}


# ---------------------------------------------------------------------------
# _get_client — Anthropic client singleton
# ---------------------------------------------------------------------------


class TestGetClient:
    def _reset_client(self):
        """Reset module-level client state."""
        import py._ai as ai_mod
        ai_mod._client = None
        ai_mod._client_key_last = None

    @patch("py._ai.get_api_key")
    @patch.dict(os.environ, {}, clear=True)
    def test_returns_none_when_no_key(self, mock_key):
        self._reset_client()
        mock_key.return_value = None
        result = _get_client()
        assert result is None

    @patch("py._ai.anthropic.Anthropic")
    @patch("py._ai.get_api_key")
    @patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}, clear=True)
    def test_creates_new_client(self, mock_key, mock_anthropic):
        self._reset_client()
        mock_anthropic.return_value = MagicMock()
        result = _get_client()
        assert result is not None
        mock_anthropic.assert_called_once_with(api_key="test-key")

    @patch("py._ai.anthropic.Anthropic")
    @patch("py._ai.get_api_key")
    @patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}, clear=True)
    def test_reuses_client_on_same_key(self, mock_key, mock_anthropic):
        self._reset_client()
        mock_client = MagicMock()
        mock_anthropic.return_value = mock_client

        first = _get_client()
        second = _get_client()
        assert first is second
        assert mock_anthropic.call_count == 1

    @patch("py._ai.anthropic.Anthropic")
    @patch("py._ai.get_api_key")
    def test_recreates_on_key_change(self, mock_key, mock_anthropic):
        self._reset_client()
        mock_key.return_value = None

        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "key-1"}, clear=True):
            _get_client()

        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "key-2"}, clear=True):
            _get_client()

        assert mock_anthropic.call_count == 2

    @patch("py._ai.get_api_key")
    @patch.dict(os.environ, {}, clear=True)
    def test_falls_back_to_db_key(self, mock_key):
        self._reset_client()
        mock_key.return_value = "db-api-key"

        with patch("py._ai.anthropic.Anthropic") as mock_anthropic:
            mock_anthropic.return_value = MagicMock()
            _get_client()
            mock_anthropic.assert_called_once_with(api_key="db-api-key")


# ---------------------------------------------------------------------------
# _get_season — hemisphere-aware season lookup
# ---------------------------------------------------------------------------


class TestGetSeason:
    @patch("py._ai.get_db")
    def test_db_lookup_success(self, mock_db):
        mock_coll = MagicMock()
        mock_db.return_value.__getitem__ = MagicMock(return_value=mock_coll)
        mock_coll.find_one.return_value = {
            "name": "Wet season",
            "localName": "Masika",
            "description": "Heavy rains",
        }

        result = _get_season("ZW")
        assert result["name"] == "Wet season"
        assert result["localName"] == "Masika"
        assert result["description"] == "Heavy rains"

    @patch("py._ai.get_db")
    @patch("py._ai.datetime")
    def test_southern_hemisphere_summer(self, mock_dt, mock_db):
        mock_db.side_effect = Exception("DB down")
        mock_now = MagicMock()
        mock_now.month = 1
        mock_dt.now.return_value = mock_now

        result = _get_season("", lat=-17.0)
        assert result["name"] == "Summer"
        assert result["localName"] == "Summer"

    @patch("py._ai.get_db")
    @patch("py._ai.datetime")
    def test_southern_hemisphere_autumn(self, mock_dt, mock_db):
        mock_db.side_effect = Exception("DB down")
        mock_now = MagicMock()
        mock_now.month = 4
        mock_dt.now.return_value = mock_now

        result = _get_season("", lat=-20.0)
        assert result["name"] == "Autumn"

    @patch("py._ai.get_db")
    @patch("py._ai.datetime")
    def test_southern_hemisphere_winter(self, mock_dt, mock_db):
        mock_db.side_effect = Exception("DB down")
        mock_now = MagicMock()
        mock_now.month = 7
        mock_dt.now.return_value = mock_now

        result = _get_season("", lat=-17.0)
        assert result["name"] == "Winter"

    @patch("py._ai.get_db")
    @patch("py._ai.datetime")
    def test_southern_hemisphere_spring(self, mock_dt, mock_db):
        mock_db.side_effect = Exception("DB down")
        mock_now = MagicMock()
        mock_now.month = 9
        mock_dt.now.return_value = mock_now

        result = _get_season("", lat=-17.0)
        assert result["name"] == "Spring"

    @patch("py._ai.get_db")
    @patch("py._ai.datetime")
    def test_northern_hemisphere_summer(self, mock_dt, mock_db):
        mock_db.side_effect = Exception("DB down")
        mock_now = MagicMock()
        mock_now.month = 7
        mock_dt.now.return_value = mock_now

        result = _get_season("", lat=40.0)
        assert result["name"] == "Summer"

    @patch("py._ai.get_db")
    @patch("py._ai.datetime")
    def test_northern_hemisphere_winter(self, mock_dt, mock_db):
        mock_db.side_effect = Exception("DB down")
        mock_now = MagicMock()
        mock_now.month = 1
        mock_dt.now.return_value = mock_now

        result = _get_season("", lat=40.0)
        assert result["name"] == "Winter"


# ---------------------------------------------------------------------------
# _is_stale — staleness check
# ---------------------------------------------------------------------------


class TestIsStale:
    def test_stale_on_large_temp_change(self):
        cached = {"weatherSnapshot": {"temperature": 20, "weatherCode": 0}}
        assert _is_stale(cached, 26, 0) is True

    def test_stale_on_weather_code_change(self):
        cached = {"weatherSnapshot": {"temperature": 20, "weatherCode": 0}}
        assert _is_stale(cached, 20, 61) is True

    def test_not_stale_when_similar(self):
        cached = {"weatherSnapshot": {"temperature": 20, "weatherCode": 0}}
        assert _is_stale(cached, 22, 0) is False

    def test_exactly_5_degrees_not_stale(self):
        """Exactly 5 degrees should NOT be stale (> 5, not >= 5)."""
        cached = {"weatherSnapshot": {"temperature": 20, "weatherCode": 0}}
        assert _is_stale(cached, 25, 0) is False

    def test_slightly_over_5_degrees_is_stale(self):
        cached = {"weatherSnapshot": {"temperature": 20, "weatherCode": 0}}
        assert _is_stale(cached, 25.1, 0) is True

    def test_missing_snapshot_defaults_to_zero(self):
        cached = {"weatherSnapshot": {}}
        assert _is_stale(cached, 0, 0) is False

    def test_temp_decrease_also_stale(self):
        cached = {"weatherSnapshot": {"temperature": 30, "weatherCode": 0}}
        assert _is_stale(cached, 24, 0) is True


# ---------------------------------------------------------------------------
# _get_cached_summary
# ---------------------------------------------------------------------------


class TestGetCachedSummary:
    @patch("py._ai.get_db")
    def test_returns_cached_doc(self, mock_db):
        mock_coll = MagicMock()
        mock_db.return_value.__getitem__ = MagicMock(return_value=mock_coll)
        now = datetime.now(timezone.utc)
        mock_coll.find_one.return_value = {
            "insight": "Sunny weather today.",
            "generatedAt": now,
            "weatherSnapshot": {"temperature": 25, "weatherCode": 0},
        }

        result = _get_cached_summary("test-location")
        assert result is not None
        assert result["insight"] == "Sunny weather today."
        assert result["generatedAt"] == now

    @patch("py._ai.get_db")
    def test_returns_none_when_not_cached(self, mock_db):
        mock_coll = MagicMock()
        mock_db.return_value.__getitem__ = MagicMock(return_value=mock_coll)
        mock_coll.find_one.return_value = None

        result = _get_cached_summary("test-location")
        assert result is None


# ---------------------------------------------------------------------------
# _set_cached_summary
# ---------------------------------------------------------------------------


class TestSetCachedSummary:
    @patch("py._ai.get_db")
    def test_calls_update_one_with_upsert(self, mock_db):
        mock_coll = MagicMock()
        mock_db.return_value.__getitem__ = MagicMock(return_value=mock_coll)

        _set_cached_summary("test-loc", "Sunny weather.", {"temperature": 25}, [])
        mock_coll.update_one.assert_called_once()
        call_args = mock_coll.update_one.call_args
        assert call_args[0][0] == {"locationSlug": "test-loc"}
        assert call_args[1]["upsert"] is True

    @patch("py._ai.get_db")
    def test_uses_correct_ttl_for_tier_1(self, mock_db):
        mock_coll = MagicMock()
        mock_db.return_value.__getitem__ = MagicMock(return_value=mock_coll)

        _set_cached_summary("any-city", "Summary.", {"temperature": 25}, ["city"])
        call_args = mock_coll.update_one.call_args
        update_doc = call_args[0][1]["$set"]
        diff = (update_doc["expiresAt"] - update_doc["generatedAt"]).total_seconds()
        assert diff == TTL_TIER_1

    @patch("py._ai.get_db")
    def test_uses_correct_ttl_for_tier_2(self, mock_db):
        mock_coll = MagicMock()
        mock_db.return_value.__getitem__ = MagicMock(return_value=mock_coll)

        _set_cached_summary("farm-area", "Summary.", {"temperature": 25}, ["farming"])
        call_args = mock_coll.update_one.call_args
        update_doc = call_args[0][1]["$set"]
        diff = (update_doc["expiresAt"] - update_doc["generatedAt"]).total_seconds()
        assert diff == TTL_TIER_2

    @patch("py._ai.get_db")
    def test_uses_correct_ttl_for_tier_3(self, mock_db):
        mock_coll = MagicMock()
        mock_db.return_value.__getitem__ = MagicMock(return_value=mock_coll)

        _set_cached_summary("tiny-village", "Summary.", {"temperature": 25}, ["tourism"])
        call_args = mock_coll.update_one.call_args
        update_doc = call_args[0][1]["$set"]
        diff = (update_doc["expiresAt"] - update_doc["generatedAt"]).total_seconds()
        assert diff == TTL_TIER_3


# ---------------------------------------------------------------------------
# _get_system_prompt
# ---------------------------------------------------------------------------


class TestGetSystemPrompt:
    def _reset_prompt_cache(self):
        import py._ai as ai_mod
        ai_mod._prompt_cache = {}
        ai_mod._prompt_cache_at = 0

    @patch("py._ai._get_prompt")
    def test_returns_db_template(self, mock_get):
        mock_get.return_value = {"template": "Custom system prompt from DB."}
        result = _get_system_prompt()
        assert result == "Custom system prompt from DB."

    @patch("py._ai._get_prompt")
    def test_returns_fallback_when_db_unavailable(self, mock_get):
        mock_get.return_value = None
        result = _get_system_prompt()
        assert result == _FALLBACK_SYSTEM_PROMPT
        assert "Shamwari Weather" in result

    @patch("py._ai._get_prompt")
    def test_returns_fallback_on_empty_template(self, mock_get):
        mock_get.return_value = {"template": ""}
        result = _get_system_prompt()
        assert result == _FALLBACK_SYSTEM_PROMPT


# ---------------------------------------------------------------------------
# generate_summary endpoint
# ---------------------------------------------------------------------------


class TestGenerateSummary:
    def _make_request(self, temp=25, code=0, activities=None):
        return AISummaryRequest(
            weatherData={
                "current": {
                    "temperature_2m": temp,
                    "relative_humidity_2m": 60,
                    "weather_code": code,
                },
                "daily": {
                    "temperature_2m_max": [30],
                    "temperature_2m_min": [15],
                    "weather_code": [code],
                },
            },
            location=LocationInfo(name="Nairobi", elevation=1795, country="KE", lat=-1.29, lon=36.82),
            activities=activities or [],
        )

    @pytest.mark.asyncio
    @patch("py._ai._set_cached_summary")
    @patch("py._ai._is_stale")
    @patch("py._ai._get_cached_summary")
    @patch("py._ai.get_db")
    async def test_cached_non_stale_returns_cached(self, mock_db, mock_cache, mock_stale, mock_set):
        mock_db_inst = MagicMock()
        mock_db.return_value = mock_db_inst
        mock_db_inst.__getitem__ = MagicMock(return_value=MagicMock(
            find_one=MagicMock(return_value={"tags": []})
        ))
        now = datetime.now(timezone.utc)
        mock_cache.return_value = {
            "insight": "Cached insight.",
            "generatedAt": now,
            "weatherSnapshot": {"temperature": 25, "weatherCode": 0},
        }
        mock_stale.return_value = False

        result = await generate_summary(self._make_request())
        assert result["cached"] is True
        assert result["insight"] == "Cached insight."
        mock_set.assert_not_called()

    @pytest.mark.asyncio
    @patch("py._ai._set_cached_summary")
    @patch("py._ai._get_season")
    @patch("py._ai._get_client")
    @patch("py._ai._get_cached_summary")
    @patch("py._ai.get_db")
    async def test_no_client_returns_fallback(self, mock_db, mock_cache, mock_client,
                                               mock_season, mock_set):
        mock_db_inst = MagicMock()
        mock_db.return_value = mock_db_inst
        mock_db_inst.__getitem__ = MagicMock(return_value=MagicMock(
            find_one=MagicMock(return_value=None)
        ))
        mock_cache.return_value = None
        mock_client.return_value = None
        mock_season.return_value = {"name": "Summer", "localName": "Summer",
                                     "description": "Warm season with possible thunderstorms"}

        result = await generate_summary(self._make_request())
        assert "Summer" in result["insight"]
        assert "Nairobi" in result["insight"]
        assert result["cached"] is False
        mock_set.assert_called_once()

    @pytest.mark.asyncio
    @patch("py._ai._set_cached_summary")
    @patch("py._ai.anthropic_breaker")
    @patch("py._ai._get_season")
    @patch("py._ai._get_client")
    @patch("py._ai._get_cached_summary")
    @patch("py._ai.get_db")
    async def test_circuit_breaker_open_returns_fallback(self, mock_db, mock_cache,
                                                          mock_client, mock_season,
                                                          mock_breaker, mock_set):
        mock_db_inst = MagicMock()
        mock_db.return_value = mock_db_inst
        mock_db_inst.__getitem__ = MagicMock(return_value=MagicMock(
            find_one=MagicMock(return_value=None)
        ))
        mock_cache.return_value = None
        mock_client.return_value = MagicMock()
        mock_breaker.is_allowed = False  # Circuit open
        mock_season.return_value = {"name": "Winter", "localName": "Winter",
                                     "description": "Cool and dry"}

        result = await generate_summary(self._make_request())
        assert "Winter" in result["insight"]
        assert result["cached"] is False

    @pytest.mark.asyncio
    @patch("py._ai._set_cached_summary")
    @patch("py._ai._get_prompt")
    @patch("py._ai._get_system_prompt")
    @patch("py._ai.anthropic_breaker")
    @patch("py._ai._get_season")
    @patch("py._ai._get_client")
    @patch("py._ai._get_cached_summary")
    @patch("py._ai.get_db")
    async def test_successful_ai_call(self, mock_db, mock_cache, mock_client, mock_season,
                                       mock_breaker, mock_sys_prompt, mock_prompt, mock_set):
        mock_db_inst = MagicMock()
        mock_db.return_value = mock_db_inst
        mock_db_inst.__getitem__ = MagicMock(return_value=MagicMock(
            find_one=MagicMock(return_value=None)
        ))
        mock_cache.return_value = None
        mock_breaker.is_allowed = True
        mock_season.return_value = {"name": "Spring", "localName": "Spring",
                                     "description": "Warming temperatures"}
        mock_sys_prompt.return_value = "You are Shamwari."
        mock_prompt.return_value = {"model": "claude-haiku-4-5-20251001", "maxTokens": 400}

        # Mock Claude response
        text_block = MagicMock()
        text_block.type = "text"
        text_block.text = "AI-generated summary for Nairobi."
        mock_message = MagicMock()
        mock_message.content = [text_block]
        mock_ai_client = MagicMock()
        mock_ai_client.messages.create.return_value = mock_message
        mock_client.return_value = mock_ai_client

        result = await generate_summary(self._make_request())
        assert result["insight"] == "AI-generated summary for Nairobi."
        assert result["cached"] is False
        mock_breaker.record_success.assert_called_once()
        mock_set.assert_called_once()

    @pytest.mark.asyncio
    @patch("py._ai._set_cached_summary")
    @patch("py._ai._get_prompt")
    @patch("py._ai._get_system_prompt")
    @patch("py._ai.anthropic_breaker")
    @patch("py._ai._get_season")
    @patch("py._ai._get_client")
    @patch("py._ai._get_cached_summary")
    @patch("py._ai.get_db")
    async def test_ai_error_returns_fallback(self, mock_db, mock_cache, mock_client, mock_season,
                                              mock_breaker, mock_sys_prompt, mock_prompt, mock_set):
        mock_db_inst = MagicMock()
        mock_db.return_value = mock_db_inst
        mock_db_inst.__getitem__ = MagicMock(return_value=MagicMock(
            find_one=MagicMock(return_value=None)
        ))
        mock_cache.return_value = None
        mock_breaker.is_allowed = True
        mock_season.return_value = {"name": "Summer", "localName": "Summer",
                                     "description": "Warm season"}
        mock_sys_prompt.return_value = "You are Shamwari."
        mock_prompt.return_value = None

        mock_ai_client = MagicMock()
        mock_ai_client.messages.create.side_effect = Exception("API Error")
        mock_client.return_value = mock_ai_client

        result = await generate_summary(self._make_request())
        assert "Summer" in result["insight"]
        assert "Nairobi" in result["insight"]
        mock_breaker.record_failure.assert_called_once()

    @pytest.mark.asyncio
    @patch("py._ai._set_cached_summary")
    @patch("py._ai._get_prompt")
    @patch("py._ai._get_system_prompt")
    @patch("py._ai.anthropic_breaker")
    @patch("py._ai._get_season")
    @patch("py._ai._get_client")
    @patch("py._ai._get_cached_summary")
    @patch("py._ai.get_db")
    async def test_activities_included_in_prompt(self, mock_db, mock_cache, mock_client,
                                                  mock_season, mock_breaker, mock_sys_prompt,
                                                  mock_prompt, mock_set):
        """User activities should appear in the prompt sent to Claude."""
        mock_db_inst = MagicMock()
        mock_db.return_value = mock_db_inst
        mock_db_inst.__getitem__ = MagicMock(return_value=MagicMock(
            find_one=MagicMock(return_value=None)
        ))
        mock_cache.return_value = None
        mock_breaker.is_allowed = True
        mock_season.return_value = {"name": "Summer", "localName": "Summer",
                                     "description": "Warm season"}
        mock_sys_prompt.return_value = "System prompt."
        mock_prompt.return_value = None

        text_block = MagicMock()
        text_block.type = "text"
        text_block.text = "AI summary."
        mock_message = MagicMock()
        mock_message.content = [text_block]
        mock_ai_client = MagicMock()
        mock_ai_client.messages.create.return_value = mock_message
        mock_client.return_value = mock_ai_client

        await generate_summary(self._make_request(activities=["running", "farming"]))

        # Verify that activities appear in the user content
        call_args = mock_ai_client.messages.create.call_args
        messages = call_args[1]["messages"]
        user_content = messages[0]["content"]
        assert "running" in user_content
        assert "farming" in user_content

    @pytest.mark.asyncio
    @patch("py._ai._set_cached_summary")
    @patch("py._ai._is_stale")
    @patch("py._ai._get_cached_summary")
    @patch("py._ai.get_db")
    async def test_stale_cache_triggers_regeneration(self, mock_db, mock_cache, mock_stale, mock_set):
        """When cache is stale, should regenerate the summary."""
        mock_db_inst = MagicMock()
        mock_db.return_value = mock_db_inst
        mock_db_inst.__getitem__ = MagicMock(return_value=MagicMock(
            find_one=MagicMock(return_value=None)
        ))
        now = datetime.now(timezone.utc)
        mock_cache.return_value = {
            "insight": "Old cached insight.",
            "generatedAt": now,
            "weatherSnapshot": {"temperature": 15, "weatherCode": 0},
        }
        mock_stale.return_value = True

        with patch("py._ai._get_season") as mock_season, \
             patch("py._ai._get_client") as mock_client:
            mock_season.return_value = {"name": "Summer", "localName": "Summer",
                                         "description": "Warm"}
            mock_client.return_value = None  # No AI client -> fallback

            result = await generate_summary(self._make_request())
            assert result["insight"] != "Old cached insight."
            assert result["cached"] is False
