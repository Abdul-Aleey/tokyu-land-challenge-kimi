"""Thin wrapper around Gemini on Vertex AI.

Business logic (prompts, what to send) lives in backend/agents/*.py and
backend/prompts.py -- this file only knows how to make the call and parse the
result. Calls Vertex AI directly through the google-genai SDK (no third-party
proxy in front of it, unlike the old Kimi setup) and asks Gemini for
response_mime_type="application/json" so the model returns clean JSON
directly -- no ```json fence-stripping, one less failure mode, and faster
than the old proxy + text-parsing round trip.
"""

from __future__ import annotations

import json
import time

from google import genai
from google.genai import errors, types

from backend.config import settings

# Direct Vertex AI calls are far more reliable than the old third-party proxy,
# so retries are fewer/shorter than the old Kimi client's -- this is bounded
# retry for genuine transient errors (429/500/503/504), not a safety net for a
# flaky upstream.
_RETRYABLE_CODES = (429, 500, 503, 504)
_MAX_ATTEMPTS = 2
_RETRY_BACKOFF_BASE_S = 1.5

# If GEMINI_MODEL isn't resolvable (typo'd, renamed, not yet available in this
# region/project), fall back to a known-good model rather than dropping
# straight to rule-based text -- most requests should still get a live answer.
_FALLBACK_MODEL = "gemini-2.5-flash"

_client: genai.Client | None = None


class GeminiAPIError(Exception):
    """Raised for any Gemini API failure, with a plain-language message."""


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(
            vertexai=settings.use_vertex,
            project=settings.gcp_project,
            location=settings.gcp_location,
        )
    return _client


def _generate(model: str, contents, config) -> types.GenerateContentResponse:
    last_exc: Exception | None = None
    for attempt in range(_MAX_ATTEMPTS):
        try:
            return _get_client().models.generate_content(model=model, contents=contents, config=config)
        except errors.APIError as exc:
            last_exc = exc
            code = getattr(exc, "code", None)
            if code in _RETRYABLE_CODES and attempt < _MAX_ATTEMPTS - 1:
                time.sleep(_RETRY_BACKOFF_BASE_S * (attempt + 1))
                continue
            raise GeminiAPIError(f"Gemini API error ({code}): {exc}") from exc
        except Exception as exc:  # network errors, etc.
            last_exc = exc
            if attempt < _MAX_ATTEMPTS - 1:
                time.sleep(_RETRY_BACKOFF_BASE_S * (attempt + 1))
                continue
            raise GeminiAPIError(f"Could not reach Gemini/Vertex AI: {exc}") from exc
    raise GeminiAPIError(f"Gemini call failed after {_MAX_ATTEMPTS} attempts: {last_exc}")


def _models_to_try() -> list[str]:
    models = [settings.gemini_model]
    if settings.gemini_model != _FALLBACK_MODEL:
        models.append(_FALLBACK_MODEL)
    return models


def call_gemini(system_prompt: str, user_content: str | list, *, timeout: float = 30.0) -> dict:
    """user_content is either a single string (one-shot question) or a list of
    {"role": "user"|"model", "parts": [{"text": ...}]} turns for a multi-turn
    session -- passed straight through to the SDK's `contents` parameter,
    which accepts both forms natively."""
    settings.require_gemini()

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        response_mime_type="application/json",
        http_options=types.HttpOptions(timeout=int(timeout * 1000)),
    )

    last_exc: Exception | None = None
    for model in _models_to_try():
        try:
            response = _generate(model, user_content, config)
            break
        except GeminiAPIError as exc:
            last_exc = exc
            continue
    else:
        raise last_exc

    text = response.text
    if not text:
        raise GeminiAPIError("Gemini returned an empty response")

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise GeminiAPIError(f"Gemini response was not valid JSON: {text[:500]}") from exc


def check_connection() -> tuple[bool, str, str]:
    """Minimal real call to verify Vertex AI/Gemini is actually reachable.

    Deliberately doesn't use settings.require_gemini() -- that no-ops in demo
    mode, but this check is meant to test real connectivity regardless of
    DEMO_MODE. Tries the configured model first, then the fallback model, so
    the badge reflects whichever one will actually answer requests.

    Returns (connected, message, model) -- model is whichever one actually
    responded (empty string if none did).
    """
    if not settings.gcp_project:
        return False, "GOOGLE_CLOUD_PROJECT not set in .env", settings.gemini_model

    config = types.GenerateContentConfig(max_output_tokens=5, http_options=types.HttpOptions(timeout=15000))

    last_message = ""
    for model in _models_to_try():
        try:
            response = _get_client().models.generate_content(model=model, contents="ping", config=config)
        except errors.APIError as exc:
            last_message = f"Vertex AI error ({getattr(exc, 'code', '?')}): {exc}"
            continue
        except Exception as exc:
            last_message = f"Could not reach Vertex AI: {exc}"
            continue

        if not response:
            last_message = "Vertex AI returned an empty response"
            continue
        return True, f"Connected (model={model})", model

    return False, last_message, settings.gemini_model
