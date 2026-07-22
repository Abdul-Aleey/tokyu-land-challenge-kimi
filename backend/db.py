"""Thin sqlite3 connection helper. No ORM -- the schema is small and stable."""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from typing import Iterator

from backend.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_kana TEXT,
    industry TEXT NOT NULL,
    membership_plan TEXT NOT NULL,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    contract_status TEXT NOT NULL,
    contract_start_date TEXT NOT NULL,
    renewal_date TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    last_payment_date TEXT,
    monthly_fee_jpy INTEGER NOT NULL,
    invoice_request_status TEXT NOT NULL,
    invoice_sent_date TEXT,
    notes TEXT,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_date TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_company ON activity_events(company_id);
"""


def get_connection() -> sqlite3.Connection:
    settings.db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _migrate(conn: sqlite3.Connection) -> None:
    """Adds/removes columns to bring an existing database file in line with the
    current schema, so upgrading a pre-existing tokyu.db doesn't break."""
    columns = {row["name"] for row in conn.execute("PRAGMA table_info(companies)").fetchall()}
    if "invoice_sent_date" not in columns:
        conn.execute("ALTER TABLE companies ADD COLUMN invoice_sent_date TEXT")
    if "next_payment_due" in columns:
        # Risk is driven by renewal_date alone -- a recurring monthly due date
        # decoupled from the contract term proved confusing (a company years
        # from renewal could still show Critical), so this column is retired.
        conn.execute("ALTER TABLE companies DROP COLUMN next_payment_due")


def init_db() -> None:
    conn = get_connection()
    try:
        conn.executescript(SCHEMA)
        _migrate(conn)
        conn.commit()
    finally:
        conn.close()


@contextmanager
def db_session() -> Iterator[sqlite3.Connection]:
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
