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


def call_gemini(system_prompt: str, user_content: str, *, timeout: float = 30.0) -> dict:
    settings.require_gemini()

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        response_mime_type="application/json",
        http_options=types.HttpOptions(timeout=int(timeout * 1000)),
    )

    last_exc: Exception | None = None
    for attempt in range(_MAX_ATTEMPTS):
        try:
            response = _get_client().models.generate_content(
                model=settings.gemini_model,
                contents=user_content,
                config=config,
            )
            break
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
    else:
        raise GeminiAPIError(f"Gemini call failed after {_MAX_ATTEMPTS} attempts: {last_exc}")

    text = response.text
    if not text:
        raise GeminiAPIError("Gemini returned an empty response")

    import json

    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise GeminiAPIError(f"Gemini response was not valid JSON: {text[:500]}") from exc


def check_connection() -> tuple[bool, str]:
    """Minimal real call to verify Vertex AI/Gemini is actually reachable.

    Deliberately doesn't use settings.require_gemini() -- that no-ops in demo
    mode, but this check is meant to test real connectivity regardless of
    DEMO_MODE.
    """
    if not settings.gcp_project:
        return False, "GOOGLE_CLOUD_PROJECT not set in .env"

    try:
        response = _get_client().models.generate_content(
            model=settings.gemini_model,
            contents="ping",
            config=types.GenerateContentConfig(
                max_output_tokens=5,
                http_options=types.HttpOptions(timeout=15000),
            ),
        )
    except errors.APIError as exc:
        return False, f"Vertex AI error ({getattr(exc, 'code', '?')}): {exc}"
    except Exception as exc:
        return False, f"Could not reach Vertex AI: {exc}"

    if not response:
        return False, "Vertex AI returned an empty response"
    return True, f"Connected (model={settings.gemini_model})"
