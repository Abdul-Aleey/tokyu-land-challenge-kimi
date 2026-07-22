from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.agents.company_brief import generate_company_brief
from backend.agents.portfolio_insights import generate_portfolio_insights
from backend.agents.segment_insights import generate_segment_insights
from backend.agents.smart_search import answer_question
from backend.config import settings
from backend.db import db_session
from backend.gemini_client import check_connection
from backend.risk import enrich_company
from backend.routers.analytics import segmentation as get_segmentation

router = APIRouter(prefix="/api/ai", tags=["ai"])


class SmartSearchTurn(BaseModel):
    question: str
    answer: str


class SmartSearchRequest(BaseModel):
    question: str
    history: list[SmartSearchTurn] = []


def _all_companies_with_risk() -> list[dict]:
    with db_session() as conn:
        rows = conn.execute("SELECT * FROM companies").fetchall()
    return [enrich_company(dict(r)) for r in rows]


@router.post("/company-brief/{company_id}")
def company_brief(company_id: int, lang: str = "en"):
    with db_session() as conn:
        row = conn.execute("SELECT * FROM companies WHERE id = ?", (company_id,)).fetchone()
    if row is None:
        raise HTTPException(404, "Company not found")
    return generate_company_brief(enrich_company(dict(row)), lang=lang)


@router.post("/portfolio-insights")
def portfolio_insights(lang: str = "en"):
    companies = _all_companies_with_risk()
    at_risk = [c for c in companies if c["risk"]["level"] in ("High", "Critical")]
    at_risk.sort(key=lambda c: c["risk"]["score"], reverse=True)

    from collections import Counter

    contract_ct = Counter(c["contract_status"] for c in companies)
    payment_ct = Counter(c["payment_status"] for c in companies)
    invoice_ct = Counter(c["invoice_request_status"] for c in companies)
    renewals_due_30d = sum(
        1
        for c in companies
        if c["contract_status"] == "Active"
        and c["risk"]["days_to_renewal"] is not None
        and 0 <= c["risk"]["days_to_renewal"] <= 30
    )
    summary = {
        "total_companies": len(companies),
        "at_risk_count": len(at_risk),
        "renewals_due_30d": renewals_due_30d,
        "payments_late": payment_ct.get("Late Payment", 0),
        "invoices_not_sent": invoice_ct.get("Not Sent", 0),
        "active_contracts": contract_ct.get("Active", 0),
    }
    return generate_portfolio_insights(summary, at_risk, lang=lang)


@router.post("/smart-search")
def smart_search(payload: SmartSearchRequest, lang: str = "en"):
    companies = _all_companies_with_risk()
    history = [t.model_dump() for t in payload.history]
    return answer_question(payload.question, companies, lang=lang, history=history)


@router.post("/segment-insights")
def segment_insights(lang: str = "en"):
    seg = get_segmentation().model_dump()
    return generate_segment_insights(seg, lang=lang)


@router.get("/status")
def ai_status():
    if settings.demo_mode:
        return {"connected": False, "demo_mode": True, "model": settings.gemini_model, "message": "Demo mode enabled -- always using fallback text"}
    ok, message, model = check_connection()
    return {"connected": ok, "demo_mode": False, "model": model, "message": message}
