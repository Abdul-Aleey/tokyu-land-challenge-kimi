"""Rule-based risk scoring shared by the API response, the risk radar, and the
AI agents' fallback text (so a Gemini outage never removes the risk signal,
just the AI-generated prose around it)."""

from __future__ import annotations

from datetime import date, datetime, timedelta


def _days_until(iso_date: str) -> int:
    d = datetime.strptime(iso_date, "%Y-%m-%d").date()
    return (d - date.today()).days


def add_one_month(d: date) -> date:
    """Advances a date by one calendar month, clamping to the last valid day of
    the target month (e.g. Jan 31 -> Feb 28/29) rather than overflowing into
    the following month."""
    if d.month == 12:
        year, month = d.year + 1, 1
    else:
        year, month = d.year, d.month + 1
    for day in range(d.day, 0, -1):
        try:
            return date(year, month, day)
        except ValueError:
            continue
    return date(year, month, 1)


def effective_payment_status(payment_status: str, next_payment_due: str, today: date | None = None) -> str:
    """"Late Payment" is never stored -- it's Not Paid plus today being past
    next_payment_due, the recurring monthly due date (separate from the
    contract's renewal_date). Always computed relative to today so it never
    goes stale."""
    if payment_status == "Paid":
        return "Paid"
    today = today or date.today()
    due = datetime.strptime(next_payment_due, "%Y-%m-%d").date()
    return "Late Payment" if today > due else "Not Paid"


def enrich_company(company: dict) -> dict:
    """Attaches risk (and the effective payment status it's based on) without
    touching the raw, staff-facing payment_status field -- the table/drawer
    always show the plain ground truth (Paid/Not Paid); "Late Payment" is a
    computed signal used for risk scoring, Ask AI, and AI-generated text, but
    is never displayed as if it were the stored payment status itself."""
    company = dict(company)
    effective = effective_payment_status(company["payment_status"], company["next_payment_due"])
    company["effective_payment_status"] = effective
    risk_input = dict(company)
    risk_input["payment_status"] = effective
    company["risk"] = compute_risk(risk_input)
    return company


def compute_risk(company: dict) -> dict:
    """Risk is driven purely by payment status relative to next_payment_due
    (the recurring monthly due date -- separate from the contract's
    renewal_date), always computed relative to today: Paid -> no risk. An
    unpaid company can only reach Critical/High/Low if its invoice has
    actually been Sent -- a company can't be "late" on an invoice that was
    never sent, so Not Sent is always no risk regardless of the date. Not
    Paid + invoice Sent + due date already passed (effective status "Late
    Payment") -> Critical. Due today -> High. Due within the next week ->
    Low. Due further out -> no risk yet. days_to_renewal (contract term) is
    reported separately and does not affect the score -- it only drives the
    "renewals due soon" KPI/insight, independent of payment risk. The
    numeric score exists only for internal sort order, never shown in the UI."""
    days_to_renewal = _days_until(company["renewal_date"])
    days_to_due = _days_until(company["next_payment_due"])

    if company["payment_status"] == "Paid" or company["invoice_request_status"] != "Sent":
        return {"score": 0, "level": "None", "reasons": [], "days_to_renewal": days_to_renewal}

    if company["payment_status"] == "Late Payment":
        return {"score": 100, "level": "Critical", "reasons": ["Payment is late"], "days_to_renewal": days_to_renewal}

    if days_to_due == 0:
        return {"score": 70, "level": "High", "reasons": ["Payment due today, not yet received"], "days_to_renewal": days_to_renewal}

    if 1 <= days_to_due <= 7:
        reason = f"Payment due in {days_to_due} day(s), not yet received"
        return {"score": 30, "level": "Low", "reasons": [reason], "days_to_renewal": days_to_renewal}

    return {"score": 0, "level": "None", "reasons": [], "days_to_renewal": days_to_renewal}


_REASON_JA = {
    "Payment is late": "支払いが遅延しています",
    "Payment due today, not yet received": "本日が支払期日ですが、まだ入金が確認できていません",
}
_DUE_SOON_PREFIX = "Payment due in "  # matches "N day(s), not yet received"


def translate_reason(reason: str, lang: str) -> str:
    """Shared EN/JA rendering of a risk reason string for non-AI fallback text."""
    if lang != "ja":
        return reason
    if reason in _REASON_JA:
        return _REASON_JA[reason]
    if reason.startswith(_DUE_SOON_PREFIX):
        digits = "".join(ch for ch in reason if ch.isdigit())
        if digits:
            return f"支払期日まで残り{digits}日、まだ入金が確認できていません"
    return reason
