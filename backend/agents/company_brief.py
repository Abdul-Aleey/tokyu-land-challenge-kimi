from __future__ import annotations

import json

from backend.config import GeminiNotConfiguredError, settings
from backend.formatting import format_date, status_label
from backend.gemini_client import GeminiAPIError, call_gemini
from backend.prompts import company_brief_system
from backend.risk import translate_reason


def _fallback(company: dict, risk: dict, lang: str) -> dict:
    renewal = format_date(company["renewal_date"], lang)
    contract = status_label(company["contract_status"], lang)
    payment = status_label(company["payment_status"], lang)
    invoice = status_label(company["invoice_request_status"], lang)

    if risk["reasons"]:
        action = translate_reason(risk["reasons"][0], lang)
    else:
        action = "No action needed" if lang == "en" else "現時点で対応は不要です"

    if lang == "ja":
        summary = (f"{company['name']}様（{company['industry']}）は{company['membership_plan']}プランをご利用中です。"
                   f"契約は{contract}、更新日は{renewal}です。支払状況は{payment}、請求書対応は{invoice}です。")
        call_script = (f"お問い合わせありがとうございます。ただいま確認いたします。"
                       f"契約状況は{contract}で、更新日は{renewal}です。お支払い状況は{payment}、"
                       f"請求書のご依頼につきましては{invoice}となっております。")
        if risk["reasons"]:
            call_script += "担当より追ってご連絡させていただきます。"
        recommended_action = action if action == "現時点で対応は不要です" else f"要対応: {action}"
    else:
        summary = (f"{company['name']} ({company['industry']}) is on the {company['membership_plan']} plan. "
                   f"Contract is {contract}, renewal on {renewal}. Payment is {payment}, "
                   f"invoice request is {invoice}.")
        call_script = (f"Thank you for calling, let me check that for you. Your contract is currently "
                       f"{contract}, with renewal scheduled for {renewal}. Your payment status shows as "
                       f"{payment}, and your invoice request is {invoice}.")
        if risk["reasons"]:
            call_script += " I'll have our team follow up on this shortly."
        recommended_action = action if action == "No action needed" else f"Action needed: {action}"

    return {"summary": summary, "call_script": call_script, "recommended_action": recommended_action}


def generate_company_brief(company: dict, lang: str = "en") -> dict:
    """`company` must already be enriched via backend.risk.enrich_company (i.e.
    payment_status is the effective Paid/Not Paid/Late Payment value, and
    company["risk"] is present) so the call script and fallback text always
    match what staff see on screen."""
    risk = company["risk"]
    try:
        settings.require_gemini()
        if settings.demo_mode:
            raise GeminiNotConfiguredError("demo mode enabled")

        system = company_brief_system(lang)
        payload = {
            "name": company["name"],
            "industry": company["industry"],
            "membership_plan": company["membership_plan"],
            "contract_status": company["contract_status"],
            "renewal_date": company["renewal_date"],
            "payment_status": company["payment_status"],
            "invoice_request_status": company["invoice_request_status"],
            "risk_reasons": risk["reasons"],
        }
        result = call_gemini(system, json.dumps(payload, ensure_ascii=False))
        for key in ("summary", "call_script", "recommended_action"):
            if key not in result:
                raise GeminiAPIError(f"Gemini response missing key: {key}")
        result["source"] = "ai"
        return result
    except (GeminiAPIError, GeminiNotConfiguredError, Exception):
        fallback = _fallback(company, risk, lang)
        fallback["source"] = "fallback"
        return fallback
