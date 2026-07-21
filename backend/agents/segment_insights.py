from __future__ import annotations

import json

from backend.config import GeminiNotConfiguredError, settings
from backend.gemini_client import GeminiAPIError, call_gemini
from backend.prompts import segment_insights_system


def _fallback(segmentation: dict, lang: str) -> dict:
    by_plan = segmentation["by_plan"]
    by_industry = [g for g in segmentation["by_industry"] if g["at_risk_count"] > 0]
    riskiest_plan = max(by_plan, key=lambda g: g["at_risk_count"], default=None)
    riskiest_industry = by_industry[0] if by_industry else None

    bullets: list[str] = []

    if lang == "ja":
        if riskiest_plan and riskiest_plan["at_risk_count"] > 0:
            headline = f"「{riskiest_plan['key']}」プランに要注意企業が最も多く集まっています。"
            bullets.append(f"{riskiest_plan['key']}プラン: {riskiest_plan['total']}社中{riskiest_plan['at_risk_count']}社が要注意です。")
        else:
            headline = "現時点で突出したリスク集中はありません。"
        if riskiest_industry:
            bullets.append(f"{riskiest_industry['key']}業種: 要注意企業が{riskiest_industry['at_risk_count']}社あります。")
        for g in by_plan:
            if g["payments_late"]:
                bullets.append(f"{g['key']}プラン: {g['payments_late']}社の支払いが遅延しています。")
                break
    else:
        if riskiest_plan and riskiest_plan["at_risk_count"] > 0:
            headline = f"The {riskiest_plan['key']} plan has the most at-risk companies."
            bullets.append(f"{riskiest_plan['key']} plan: {riskiest_plan['at_risk_count']} of {riskiest_plan['total']} companies are at risk.")
        else:
            headline = "No segment shows a notable risk concentration right now."
        if riskiest_industry:
            bullets.append(f"{riskiest_industry['key']} industry: {riskiest_industry['at_risk_count']} at-risk companies.")
        for g in by_plan:
            if g["payments_late"]:
                bullets.append(f"{g['key']} plan: {g['payments_late']} companies have late payments.")
                break

    return {"headline": headline, "bullets": bullets[:5]}


def generate_segment_insights(segmentation: dict, lang: str = "en") -> dict:
    try:
        settings.require_gemini()
        if settings.demo_mode:
            raise GeminiNotConfiguredError("demo mode enabled")

        system = segment_insights_system(lang)
        payload = {
            "by_plan": segmentation["by_plan"],
            "top_industries_by_risk": [g for g in segmentation["by_industry"] if g["at_risk_count"] > 0][:6],
        }
        result = call_gemini(system, json.dumps(payload, ensure_ascii=False))
        if "headline" not in result or "bullets" not in result:
            raise GeminiAPIError("Gemini response missing keys")
        result["source"] = "ai"
        return result
    except (GeminiAPIError, GeminiNotConfiguredError, Exception):
        fallback = _fallback(segmentation, lang)
        fallback["source"] = "fallback"
        return fallback
