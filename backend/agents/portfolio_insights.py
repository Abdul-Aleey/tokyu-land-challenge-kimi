from __future__ import annotations

import json

from backend.config import GeminiNotConfiguredError, settings
from backend.gemini_client import GeminiAPIError, call_gemini
from backend.prompts import portfolio_insights_system


def _fallback(summary: dict, at_risk: list[dict], lang: str) -> dict:
    if lang == "ja":
        headline = (f"{summary['at_risk_count']}社が要注意、{summary['renewals_due_30d']}社が30日以内に更新予定です。")
        bullets = []
        if summary["payments_late"]:
            bullets.append(f"{summary['payments_late']}社の支払いが遅延しています。至急フォローしてください。")
        if summary["invoices_not_sent"]:
            bullets.append(f"{summary['invoices_not_sent']}社に請求書がまだ送付されていません。")
        if summary["renewals_due_30d"]:
            bullets.append(f"{summary['renewals_due_30d']}社が今後30日以内に契約更新を迎えます。")
        if at_risk:
            top = at_risk[0]["name"]
            bullets.append(f"最優先: {top} の状況を確認してください。")
        if not bullets:
            bullets.append("現在、緊急対応が必要な案件はありません。")
    else:
        headline = (f"{summary['at_risk_count']} companies need attention, "
                    f"{summary['renewals_due_30d']} renewing within 30 days.")
        bullets = []
        if summary["payments_late"]:
            bullets.append(f"{summary['payments_late']} companies have late payments -- follow up promptly.")
        if summary["invoices_not_sent"]:
            bullets.append(f"{summary['invoices_not_sent']} companies haven't had an invoice sent yet.")
        if summary["renewals_due_30d"]:
            bullets.append(f"{summary['renewals_due_30d']} contracts renew within the next 30 days.")
        if at_risk:
            bullets.append(f"Top priority: check in with {at_risk[0]['name']}.")
        if not bullets:
            bullets.append("No urgent items right now -- portfolio is healthy.")

    return {"headline": headline, "bullets": bullets[:4]}


def generate_portfolio_insights(summary: dict, at_risk: list[dict], lang: str = "en") -> dict:
    try:
        settings.require_gemini()
        if settings.demo_mode:
            raise GeminiNotConfiguredError("demo mode enabled")

        system = portfolio_insights_system(lang)
        payload = {
            "summary": summary,
            "top_at_risk_companies": [
                {"name": c["name"], "risk_level": c["risk"]["level"], "reasons": c["risk"]["reasons"]}
                for c in at_risk[:5]
            ],
        }
        result = call_gemini(system, json.dumps(payload, ensure_ascii=False))
        if "headline" not in result or "bullets" not in result:
            raise GeminiAPIError("Gemini response missing keys")
        result["source"] = "ai"
        return result
    except (GeminiAPIError, GeminiNotConfiguredError, Exception):
        fallback = _fallback(summary, at_risk, lang)
        fallback["source"] = "fallback"
        return fallback
