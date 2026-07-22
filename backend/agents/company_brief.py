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
    # The call script/email need to convey lateness, not just the raw Paid/Not
    # Paid ground truth the table shows -- use the computed effective status.
    payment = status_label(company["effective_payment_status"], lang)
    invoice = status_label(company["invoice_request_status"], lang)
    greeting_name = company.get("contact_person") or company["name"]

    if risk["reasons"]:
        action = translate_reason(risk["reasons"][0], lang)
    else:
        action = "No action needed" if lang == "en" else "現時点で対応は不要です"

    if lang == "ja":
        summary = (f"{company['name']}様（{company['industry']}）は{company['membership_plan']}プランをご利用中です。"
                   f"契約は{contract}、更新日は{renewal}です。支払状況は{payment}、請求書対応は{invoice}です。")
        call_script = (f"お世話になっております。サクラ ディープテック渋谷でございます。"
                       f"契約状況は{contract}で、更新日は{renewal}です。お支払い状況は{payment}、"
                       f"請求書のご依頼につきましては{invoice}となっております。")
        if risk["reasons"]:
            call_script += "担当より追ってご連絡させていただきます。"
        recommended_action = action if action == "現時点で対応は不要です" else f"要対応: {action}"

        body_lines = [
            f"{greeting_name}様",
            "",
            f"平素より大変お世話になっております。サクラ ディープテック渋谷でございます。"
            f"契約状況は{contract}、更新日は{renewal}です。お支払い状況は{payment}、"
            f"請求書のご依頼につきましては{invoice}となっております。",
        ]
        if risk["reasons"]:
            body_lines.append(f"つきましては、{action}についてご確認をお願いいたします。")
        body_lines += ["", "何卒よろしくお願いいたします。", "", "サクラ ディープテック渋谷 運営チーム"]
        email_body = "\n".join(body_lines)
    else:
        summary = (f"{company['name']} ({company['industry']}) is on the {company['membership_plan']} plan. "
                   f"Contract is {contract}, renewal on {renewal}. Payment is {payment}, "
                   f"invoice request is {invoice}.")
        call_script = (f"Hi, this is Sakura Deeptech Shibuya calling regarding your account. Your contract is "
                       f"currently {contract}, with renewal scheduled for {renewal}. Your payment status shows as "
                       f"{payment}, and your invoice request is {invoice}.")
        if risk["reasons"]:
            call_script += " I'll have our team follow up on this shortly."
        recommended_action = action if action == "No action needed" else f"Action needed: {action}"

        body_lines = [
            f"Dear {greeting_name},",
            "",
            f"Thank you for being a member of Sakura Deeptech Shibuya. Your contract is currently "
            f"{contract}, with renewal scheduled for {renewal}. Your payment status shows as {payment}, "
            f"and your invoice request is {invoice}.",
        ]
        if risk["reasons"]:
            body_lines.append(f"Please note: {action}.")
        body_lines += ["", "Best regards,", "Sakura Deeptech Shibuya Operations Team"]
        email_body = "\n".join(body_lines)

    return {"summary": summary, "call_script": call_script, "email_body": email_body, "recommended_action": recommended_action}


def generate_company_brief(company: dict, lang: str = "en") -> dict:
    """`company` must already be enriched via backend.risk.enrich_company (i.e.
    effective_payment_status and company["risk"] are present) so the call
    script and fallback text always match what staff see on screen."""
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
            "contact_person": company.get("contact_person"),
            "contract_status": company["contract_status"],
            "renewal_date": company["renewal_date"],
            "payment_status": company["effective_payment_status"],
            "invoice_request_status": company["invoice_request_status"],
            "risk_reasons": risk["reasons"],
        }
        result = call_gemini(system, json.dumps(payload, ensure_ascii=False))
        for key in ("summary", "call_script", "email_body", "recommended_action"):
            if key not in result:
                raise GeminiAPIError(f"Gemini response missing key: {key}")
        result["source"] = "ai"
        return result
    except (GeminiAPIError, GeminiNotConfiguredError, Exception):
        fallback = _fallback(company, risk, lang)
        fallback["source"] = "fallback"
        return fallback
