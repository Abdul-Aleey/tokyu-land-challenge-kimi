"""Rule-based risk scoring shared by the API response, the risk radar, and the
AI agents' fallback text (so a Gemini outage never removes the risk signal,
just the AI-generated prose around it)."""

from __future__ import annotations

from datetime import date, datetime


def _days_until(iso_date: str) -> int:
    d = datetime.strptime(iso_date, "%Y-%m-%d").date()
    return (d - date.today()).days


def effective_payment_status(payment_status: str, renewal_date: str, today: date | None = None) -> str:
    """"Late Payment" is never stored -- it's Not Paid plus today being past the
    renewal date (which doubles as the payment due date). Always computed
    relative to today so it never goes stale."""
    if payment_status == "Paid":
        return "Paid"
    today = today or date.today()
    due = datetime.strptime(renewal_date, "%Y-%m-%d").date()
    return "Late Payment" if today > due else "Not Paid"


def enrich_company(company: dict) -> dict:
    """Overrides payment_status with its computed effective value, then attaches
    risk -- the single place every router should go through so the effective
    status and risk score are always consistent with each other and with
    today's date."""
    company = dict(company)
    company["payment_status"] = effective_payment_status(company["payment_status"], company["renewal_date"])
    company["risk"] = compute_risk(company)
    return company


def compute_risk(company: dict) -> dict:
    """Risk is driven purely by payment status relative to the renewal date
    (which doubles as the payment due date), always computed relative to
    today: Paid -> no risk. An unpaid company can only reach Critical/High/Low
    if its invoice has actually been Sent -- a company can't be "late" on an
    invoice that was never sent, so Not Sent is always no risk regardless of
    the date. Not Paid + invoice Sent + due date already passed (effective
    status "Late Payment") -> Critical. Due today -> High. Due within the
    next 3 days -> Low. Due further out -> no risk yet. The numeric score
    exists only for internal sort order, never shown in the UI."""
    days_to_renewal = _days_until(company["renewal_date"])

    if company["payment_status"] == "Paid" or company["invoice_request_status"] != "Sent":
        return {"score": 0, "level": "None", "reasons": [], "days_to_renewal": days_to_renewal}

    if company["payment_status"] == "Late Payment":
        return {"score": 100, "level": "Critical", "reasons": ["Payment is late"], "days_to_renewal": days_to_renewal}

    if days_to_renewal == 0:
        return {"score": 70, "level": "High", "reasons": ["Payment due today, not yet received"], "days_to_renewal": days_to_renewal}

    if 1 <= days_to_renewal <= 3:
        reason = f"Renewal due in {days_to_renewal} day(s), payment not yet received"
        return {"score": 30, "level": "Low", "reasons": [reason], "days_to_renewal": days_to_renewal}

    return {"score": 0, "level": "None", "reasons": [], "days_to_renewal": days_to_renewal}


_REASON_JA = {
    "Payment is late": "支払いが遅延しています",
    "Payment due today, not yet received": "本日が支払期日ですが、まだ入金が確認できていません",
}
_RENEWAL_RE_1 = "Renewal due in "  # matches both "N day(s)" and "N days" forms


def translate_reason(reason: str, lang: str) -> str:
    """Shared EN/JA rendering of a risk reason string for non-AI fallback text."""
    if lang != "ja":
        return reason
    if reason in _REASON_JA:
        return _REASON_JA[reason]
    if reason.startswith(_RENEWAL_RE_1):
        digits = "".join(ch for ch in reason if ch.isdigit())
        if digits:
            return f"更新まで残り{digits}日"
    return reason
