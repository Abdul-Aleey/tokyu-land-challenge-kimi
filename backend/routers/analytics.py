from __future__ import annotations

from collections import Counter
from datetime import date, datetime

from fastapi import APIRouter

from backend.db import db_session
from backend.risk import enrich_company
from backend.schemas import (
    AnalyticsSummary,
    RenewalMonthBucket,
    RiskRadarItem,
    SegmentationOut,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _all_companies_with_risk() -> list[dict]:
    with db_session() as conn:
        rows = conn.execute("SELECT * FROM companies").fetchall()
    return [enrich_company(dict(r)) for r in rows]


@router.get("/summary", response_model=AnalyticsSummary)
def summary():
    companies = _all_companies_with_risk()
    contract_ct = Counter(c["contract_status"] for c in companies)
    payment_ct = Counter(c["payment_status"] for c in companies)
    invoice_ct = Counter(c["invoice_request_status"] for c in companies)

    renewals_due_30d = sum(
        1
        for c in companies
        if c["contract_status"] in ("Active", "Pending Renewal")
        and c["risk"]["days_to_renewal"] is not None
        and 0 <= c["risk"]["days_to_renewal"] <= 30
    )
    at_risk = sum(1 for c in companies if c["risk"]["level"] in ("High", "Critical"))

    return AnalyticsSummary(
        total_companies=len(companies),
        active_contracts=contract_ct.get("Active", 0),
        pending_renewal=contract_ct.get("Pending Renewal", 0),
        renewals_due_30d=renewals_due_30d,
        payments_late=payment_ct.get("Late Payment", 0),
        payments_not_paid=payment_ct.get("Not Paid", 0),
        invoices_not_sent=invoice_ct.get("Not Sent", 0),
        at_risk_count=at_risk,
        contract_status_breakdown=dict(contract_ct),
        payment_status_breakdown=dict(payment_ct),
        invoice_status_breakdown=dict(invoice_ct),
    )


@router.get("/renewals-by-month", response_model=list[RenewalMonthBucket])
def renewals_by_month():
    companies = _all_companies_with_risk()
    today = date.today()

    months: list[str] = []
    buckets: dict[str, int] = {}
    y, m = today.year, today.month
    for i in range(12):
        mm = (m - 1 + i) % 12 + 1
        yy = y + (m - 1 + i) // 12
        key = f"{yy}-{mm:02d}"
        months.append(key)
        buckets[key] = 0

    for c in companies:
        if c["contract_status"] == "Cancelled":
            continue
        rd = datetime.strptime(c["renewal_date"], "%Y-%m-%d").date()
        key = f"{rd.year}-{rd.month:02d}"
        if key in buckets:
            buckets[key] += 1

    return [RenewalMonthBucket(month=k, count=buckets[k]) for k in months]


@router.get("/risk-radar", response_model=list[RiskRadarItem])
def risk_radar(limit: int = 8):
    companies = _all_companies_with_risk()
    at_risk = [c for c in companies if c["risk"]["level"] in ("High", "Critical")]
    at_risk.sort(key=lambda c: c["risk"]["score"], reverse=True)
    return [
        RiskRadarItem(id=c["id"], name=c["name"], industry=c["industry"], risk=c["risk"])
        for c in at_risk[:limit]
    ]


def _segment_buckets(companies: list[dict], key_fn) -> list[dict]:
    groups: dict[str, dict] = {}
    for c in companies:
        key = key_fn(c)
        g = groups.setdefault(
            key,
            {
                "key": key, "total": 0, "active": 0, "pending_renewal": 0, "expired": 0,
                "cancelled": 0, "payments_late": 0, "invoices_not_sent": 0, "at_risk_count": 0,
            },
        )
        g["total"] += 1
        if c["contract_status"] == "Active":
            g["active"] += 1
        elif c["contract_status"] == "Pending Renewal":
            g["pending_renewal"] += 1
        elif c["contract_status"] == "Expired":
            g["expired"] += 1
        elif c["contract_status"] == "Cancelled":
            g["cancelled"] += 1
        if c["payment_status"] == "Late Payment":
            g["payments_late"] += 1
        if c["invoice_request_status"] == "Not Sent":
            g["invoices_not_sent"] += 1
        if c["risk"]["level"] in ("High", "Critical"):
            g["at_risk_count"] += 1
    return sorted(groups.values(), key=lambda g: (-g["at_risk_count"], -g["total"]))


@router.get("/segmentation", response_model=SegmentationOut)
def segmentation():
    companies = _all_companies_with_risk()
    return SegmentationOut(
        by_industry=_segment_buckets(companies, lambda c: c["industry"]),
        by_plan=_segment_buckets(companies, lambda c: c["membership_plan"]),
    )
