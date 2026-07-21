"""Environment-driven settings for the Sakura Deeptech Shibuya console."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


class GeminiNotConfiguredError(Exception):
    """Raised when a Gemini call is attempted without a GCP project configured."""


class Settings:
    def __init__(self) -> None:
        self.use_vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "true").strip().lower() == "true"
        self.gcp_project = os.getenv("GOOGLE_CLOUD_PROJECT", "")
        self.gcp_location = os.getenv("GOOGLE_CLOUD_LOCATION", "asia-northeast1")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        self.demo_mode = os.getenv("DEMO_MODE", "false").strip().lower() == "true"
        self.db_path = ROOT_DIR / "data" / "tokyu.db"

        # GCS-backed persistence: source of truth for tokyu.db. Empty bucket name
        # means "not configured" -- falls back to local seed data (dev/offline).
        self.gcs_bucket = os.getenv("GCS_BUCKET_NAME", "")
        self.gcs_db_object = os.getenv("GCS_DB_OBJECT_NAME", "tokyu.db")

    def require_gemini(self) -> None:
        """No-ops in demo mode; otherwise ensures a GCP project is configured before a real call."""
        if self.demo_mode:
            return
        if not self.gcp_project:
            raise GeminiNotConfiguredError("GOOGLE_CLOUD_PROJECT not set in .env")


settings = Settings()
