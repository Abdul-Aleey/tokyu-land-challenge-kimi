from __future__ import annotations

import difflib
import re
from datetime import date

from fastapi import APIRouter, HTTPException

from backend.db import db_session
from backend.gcs_store import upload_db
from backend.risk import enrich_company
from backend.schemas import (
    CompanyDetailOut,
    CompanyOut,
    CompanySuggestion,
    CompanyWriteRequest,
    SendEmailRequest,
    SendEmailResponse,
    StatusUpdateRequest,
)

router = APIRouter(prefix="/api/companies", tags=["companies"])

VALID_CONTRACT = {"Active", "Expired"}
VALID_PAYMENT = {"Paid", "Not Paid"}  # "Late Payment" is computed, never stored directly
VALID_INVOICE = {"Sent", "Not Sent"}

_WRITABLE_FIELDS = (
    "name", "name_kana", "industry", "membership_plan", "contact_person", "contact_email",
    "contact_phone", "contract_status", "contract_start_date", "renewal_date", "payment_status",
    "last_payment_date", "monthly_fee_jpy", "invoice_request_status",
    "invoice_sent_date", "notes",
)


def _validate_write(payload: CompanyWriteRequest) -> dict:
    if payload.contract_status not in VALID_CONTRACT:
        raise HTTPException(400, f"Invalid contract_status: {payload.contract_status}")
    if payload.payment_status not in VALID_PAYMENT:
        raise HTTPException(400, f"Invalid payment_status: {payload.payment_status}")
    if payload.invoice_request_status not in VALID_INVOICE:
        raise HTTPException(400, f"Invalid invoice_request_status: {payload.invoice_request_status}")
    if payload.payment_status == "Paid" and payload.invoice_request_status != "Sent":
        raise HTTPException(400, "A company cannot be marked Paid before its invoice has been Sent")

    data = payload.model_dump()

    # last_payment_date / invoice_sent_date auto-derive from the status transition
    # unless the caller explicitly backdates them.
    if data["payment_status"] == "Paid":
        data["last_payment_date"] = data["last_payment_date"] or date.today().isoformat()
    else:
        data["last_payment_date"] = None

    if data["invoice_request_status"] == "Sent":
        data["invoice_sent_date"] = data["invoice_sent_date"] or date.today().isoformat()
    else:
        data["invoice_sent_date"] = None

    return data


@router.get("", response_model=list[CompanyOut])
def list_companies(search: str = "", contract_status: str = "", payment_status: str = "", invoice_status: str = ""):
    query = "SELECT * FROM companies WHERE 1=1"
    params: list = []
    if search:
        query += " AND (LOWER(name) LIKE ? OR LOWER(industry) LIKE ? OR LOWER(contact_person) LIKE ?)"
        like = f"%{search.lower()}%"
        params += [like, like, like]
    if contract_status:
        query += " AND contract_status = ?"
        params.append(contract_status)
    if invoice_status:
        query += " AND invoice_request_status = ?"
        params.append(invoice_status)
    query += " ORDER BY name"

    with db_session() as conn:
        rows = conn.execute(query, params).fetchall()

    companies = [enrich_company(dict(r)) for r in rows]
    # "Late Payment" isn't a raw column (it's Not Paid + past the renewal
    # date) -- Ask AI can still filter by it via effective_payment_status,
    # even though the table/filter dropdown only ever show the raw
    # Paid/Not Paid ground truth.
    if payment_status == "Late Payment":
        companies = [c for c in companies if c["effective_payment_status"] == "Late Payment"]
    elif payment_status:
        companies = [c for c in companies if c["payment_status"] == payment_status]
    companies.sort(key=lambda c: c["risk"]["score"], reverse=True)
    return companies


_TOKEN_SPLIT_RE = re.compile(r"[^\w]+", re.UNICODE)
_MIN_SUGGESTION_RATIO = 0.6


def _tokens(text: str) -> list[str]:
    return [t for t in _TOKEN_SPLIT_RE.split(text.lower()) if t]


# Registered before /{company_id} -- otherwise "suggest" would be swallowed as
# an int-typed company_id path param and 422 instead of falling through here.
@router.get("/suggest", response_model=list[CompanySuggestion])
def suggest_companies(q: str = "", limit: int = 5):
    q = q.strip().lower()
    if not q:
        return []

    with db_session() as conn:
        rows = conn.execute("SELECT id, name, industry FROM companies").fetchall()

    scored: list[tuple[float, dict]] = []
    for r in rows:
        candidates = _tokens(r["name"]) + [r["name"].lower()]
        best = max((difflib.SequenceMatcher(None, q, tok).ratio() for tok in candidates), default=0.0)
        if best >= _MIN_SUGGESTION_RATIO:
            scored.append((best, {"id": r["id"], "name": r["name"], "industry": r["industry"]}))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    # Collapse duplicate companies (a name can match on more than one token).
    seen: set[int] = set()
    out = []
    for _, c in scored:
        if c["id"] in seen:
            continue
        seen.add(c["id"])
        out.append(c)
        if len(out) >= limit:
            break
    return out


def _fetch_detail(conn, company_id: int) -> dict:
    row = conn.execute("SELECT * FROM companies WHERE id = ?", (company_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "Company not found")
    events = conn.execute(
        "SELECT * FROM activity_events WHERE company_id = ? ORDER BY event_date DESC", (company_id,)
    ).fetchall()
    d = enrich_company(dict(row))
    d["timeline"] = [dict(e) for e in events]
    return d


@router.get("/{company_id}", response_model=CompanyDetailOut)
def get_company(company_id: int):
    with db_session() as conn:
        return _fetch_detail(conn, company_id)


@router.post("", response_model=CompanyDetailOut, status_code=201)
def create_company(payload: CompanyWriteRequest):
    data = _validate_write(payload)
    data["updated_at"] = date.today().isoformat()

    with db_session() as conn:
        columns = _WRITABLE_FIELDS + ("updated_at",)
        placeholders = ",".join("?" for _ in columns)
        cur = conn.execute(
            f"INSERT INTO companies ({','.join(columns)}) VALUES ({placeholders})",
            tuple(data[c] for c in columns),
        )
        company_id = cur.lastrowid
        conn.execute(
            "INSERT INTO activity_events (company_id, event_type, event_date, description) VALUES (?,?,?,?)",
            (company_id, "status_update", date.today().isoformat(), f"Record created by staff for {data['name']}."),
        )
        result = _fetch_detail(conn, company_id)
    upload_db()
    return result


@router.put("/{company_id}", response_model=CompanyDetailOut)
def update_company(company_id: int, payload: CompanyWriteRequest):
    data = _validate_write(payload)
    data["updated_at"] = date.today().isoformat()

    with db_session() as conn:
        existing = conn.execute("SELECT * FROM companies WHERE id = ?", (company_id,)).fetchone()
        if existing is None:
            raise HTTPException(404, "Company not found")

        changes = [
            f"{field.replace('_', ' ')}: {existing[field]} -> {data[field]}"
            for field in _WRITABLE_FIELDS
            if str(existing[field] or "") != str(data[field] or "")
        ]

        columns = _WRITABLE_FIELDS + ("updated_at",)
        set_clause = ", ".join(f"{c} = ?" for c in columns)
        conn.execute(
            f"UPDATE companies SET {set_clause} WHERE id = ?",
            (*(data[c] for c in columns), company_id),
        )

        if changes:
            conn.execute(
                "INSERT INTO activity_events (company_id, event_type, event_date, description) VALUES (?,?,?,?)",
                (company_id, "status_update", date.today().isoformat(), "Staff modified record: " + "; ".join(changes)),
            )

        result = _fetch_detail(conn, company_id)
    upload_db()
    return result


@router.delete("/{company_id}", status_code=204)
def delete_company(company_id: int):
    with db_session() as conn:
        existing = conn.execute("SELECT id FROM companies WHERE id = ?", (company_id,)).fetchone()
        if existing is None:
            raise HTTPException(404, "Company not found")
        conn.execute("DELETE FROM companies WHERE id = ?", (company_id,))
    upload_db()
    return None


@router.patch("/{company_id}/status", response_model=CompanyDetailOut)
def update_status(company_id: int, payload: StatusUpdateRequest):
    updates: dict = {}
    if payload.contract_status is not None:
        if payload.contract_status not in VALID_CONTRACT:
            raise HTTPException(400, f"Invalid contract_status: {payload.contract_status}")
        updates["contract_status"] = payload.contract_status
    if payload.payment_status is not None:
        if payload.payment_status not in VALID_PAYMENT:
            raise HTTPException(400, f"Invalid payment_status: {payload.payment_status}")
        updates["payment_status"] = payload.payment_status
    if payload.invoice_request_status is not None:
        if payload.invoice_request_status not in VALID_INVOICE:
            raise HTTPException(400, f"Invalid invoice_request_status: {payload.invoice_request_status}")
        updates["invoice_request_status"] = payload.invoice_request_status

    if not updates:
        raise HTTPException(400, "No valid fields to update")

    with db_session() as conn:
        existing = conn.execute("SELECT * FROM companies WHERE id = ?", (company_id,)).fetchone()
        if existing is None:
            raise HTTPException(404, "Company not found")

        final_payment = updates.get("payment_status", existing["payment_status"])
        final_invoice = updates.get("invoice_request_status", existing["invoice_request_status"])
        if final_payment == "Paid" and final_invoice != "Sent":
            raise HTTPException(400, "A company cannot be marked Paid before its invoice has been Sent")

        if "payment_status" in updates:
            updates["last_payment_date"] = date.today().isoformat() if final_payment == "Paid" else None
        if "invoice_request_status" in updates:
            updates["invoice_sent_date"] = date.today().isoformat() if final_invoice == "Sent" else None

        updates["updated_at"] = date.today().isoformat()

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        conn.execute(f"UPDATE companies SET {set_clause} WHERE id = ?", (*updates.values(), company_id))

        change_desc = "; ".join(f"{k.replace('_', ' ')} -> {v}" for k, v in updates.items() if k != "updated_at")
        conn.execute(
            "INSERT INTO activity_events (company_id, event_type, event_date, description) VALUES (?,?,?,?)",
            (company_id, "status_update", date.today().isoformat(), f"Staff updated status: {change_desc}"),
        )

        result = _fetch_detail(conn, company_id)
    upload_db()
    return result


@router.post("/{company_id}/send-email", response_model=SendEmailResponse)
def send_email(company_id: int, payload: SendEmailRequest):
    """Demo-only: no real email is sent -- this just logs the (possibly
    staff-edited) script to the activity timeline and reports success, so the
    "Send Email" button in the drawer has something real to show for itself
    without wiring up an actual mail provider."""
    with db_session() as conn:
        existing = conn.execute("SELECT contact_email FROM companies WHERE id = ?", (company_id,)).fetchone()
        if existing is None:
            raise HTTPException(404, "Company not found")

        to_email = existing["contact_email"]
        conn.execute(
            "INSERT INTO activity_events (company_id, event_type, event_date, description) VALUES (?,?,?,?)",
            (company_id, "email_sent", date.today().isoformat(), f"Email sent to {to_email or 'contact (no email on file)'}: {payload.script}"),
        )
        events = conn.execute(
            "SELECT * FROM activity_events WHERE company_id = ? ORDER BY event_date DESC", (company_id,)
        ).fetchall()
    upload_db()
    return SendEmailResponse(sent=True, to=to_email, timeline=[dict(e) for e in events])
