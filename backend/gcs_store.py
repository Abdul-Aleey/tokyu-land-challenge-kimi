"""Syncs the local SQLite file with the `tokyu.db` object in Google Cloud
Storage, which is the durable source of truth for member data. Auth is via
Application Default Credentials -- the same mechanism already used for
Vertex AI (`gcloud auth application-default login` locally, the Cloud Run
service account in production), so no separate credentials are needed.

Every call here is best-effort: GCS being unreachable (not configured, no
permissions, offline dev) must never break the app -- it just means the
local seed data is used instead, same "AI down -> fallback" philosophy as
the rest of this app.
"""

from __future__ import annotations

from google.cloud import storage

from backend.config import settings

_client: storage.Client | None = None


def _get_client() -> storage.Client:
    global _client
    if _client is None:
        _client = storage.Client(project=settings.gcp_project or None)
    return _client


def _blob():
    bucket = _get_client().bucket(settings.gcs_bucket)
    return bucket.blob(settings.gcs_db_object)


def download_db() -> bool:
    """Pulls tokyu.db from GCS to the local db path. Returns True on success,
    False if GCS isn't configured/reachable or the object doesn't exist yet
    (caller should fall back to seeding in that case)."""
    if not settings.gcs_bucket:
        return False
    try:
        blob = _blob()
        if not blob.exists():
            return False
        settings.db_path.parent.mkdir(parents=True, exist_ok=True)
        blob.download_to_filename(str(settings.db_path))
        return True
    except Exception as exc:
        print(f"WARNING: could not download tokyu.db from gs://{settings.gcs_bucket}/{settings.gcs_db_object}: {exc}")
        return False


def upload_db() -> None:
    """Pushes the local tokyu.db back to GCS after a write, so staff edits
    survive a redeploy or instance restart. Failure here is logged only --
    the API response the caller already sent must not be affected."""
    if not settings.gcs_bucket:
        return
    try:
        _blob().upload_from_filename(str(settings.db_path))
    except Exception as exc:
        print(f"WARNING: could not upload tokyu.db to gs://{settings.gcs_bucket}/{settings.gcs_db_object}: {exc}")
