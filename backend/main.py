from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.db import db_session, init_db
from backend.gcs_store import download_db
from backend.routers import ai, analytics, companies

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

app = FastAPI(title="Sakura Deeptech Shibuya Member Console")


def _seed_if_empty() -> None:
    """Cloud Run container disk is ephemeral -- a fresh instance boots with an
    empty database. Seed it automatically so the console is never blank, for
    local/offline dev or if GCS isn't reachable."""
    with db_session() as conn:
        count = conn.execute("SELECT COUNT(*) FROM companies").fetchone()[0]
    if count == 0:
        from backend.seed import seed

        seed()


def _load_data() -> None:
    """tokyu.db in Google Cloud Storage is the source of truth -- pull it down
    before init_db() so the schema migration below applies to it. Falls back
    to seed data if GCS isn't configured/reachable or the object doesn't
    exist yet. Whatever data is already there (from GCS or seed) is left
    exactly as-is -- no automatic rewriting of existing records."""
    downloaded = download_db()
    init_db()
    if not downloaded:
        _seed_if_empty()


_load_data()

app.include_router(companies.router)
app.include_router(analytics.router)
app.include_router(ai.router)

app.mount("/static", StaticFiles(directory=FRONTEND_DIR / "static"), name="static")


@app.get("/")
def index():
    return FileResponse(FRONTEND_DIR / "index.html")
