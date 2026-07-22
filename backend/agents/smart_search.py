from __future__ import annotations

import json
from datetime import date

from backend.config import GeminiNotConfiguredError, settings
from backend.gemini_client import GeminiAPIError, call_gemini
from backend.prompts import smart_search_system
from backend.risk import translate_reason

# (keywords, company dict field, output filter key, enum value)
_KEYWORDS = [
    (("late payment", "late", "支払い遅延", "延滞", "滞納"), "payment_status", "payment_status", "Late Payment"),
    (("not paid", "unpaid", "未払い"), "payment_status", "payment_status", "Not Paid"),
    (("paid", "支払済み", "支払完了"), "payment_status", "payment_status", "Paid"),
    (("expired", "契約終了"), "contract_status", "contract_status", "Expired"),
    (("active", "有効"), "contract_status", "contract_status", "Active"),
    (("invoice not sent", "not sent", "未送付", "未対応"), "invoice_request_status", "invoice_status", "Not Sent"),
    (("invoice sent", "送付済み"), "invoice_request_status", "invoice_status", "Sent"),
]

_RISK_WORDS = ("risk", "urgent", "danger", "リスク", "危険", "要注意", "緊急")
_SUPERLATIVE_WORDS = (
    "highest", "higher", "most", "greatest", "top", "biggest", "worst", "riskiest",
    "最も", "一番", "最大", "最高",
)

# Sum/average/etc over a field -- the rule engine can't compute these, so a status
# keyword elsewhere in the question (e.g. "cancelled") must not be mistaken for a
# plain filter request. Checked before the keyword-filter branch.
_AGGREGATE_WORDS = ("total", "sum", "average", "mean", "合計", "平均", "総額", "総計")

_COUNT_KEYWORDS = ("how many", "count", "number of", "何社", "いくつ")

_EMPTY_FILTERS = {"search": "", "contract_status": "", "payment_status": "", "invoice_status": ""}

# Questions about the dashboard itself, not its data -- the rule-based fallback
# can't explain features the way Gemini can, so it just points staff to the
# in-app user guide instead of misreading "how do I add a company" as a
# company-name search.
_META_WORDS = (
    "this dashboard", "this app", "what is this", "how do i", "how to use",
    "user guide", "help me", "what does this do",
    "このダッシュボード", "使い方", "使用方法", "どうやって", "ヘルプ",
)


def _is_short_query(term: str) -> bool:
    """CJK text has no whitespace between words, so a word-count check always
    reads a Japanese sentence as "1 word". Use character length for CJK,
    word count otherwise -- a company name fragment is short either way; a
    full question is not."""
    has_cjk = any("぀" <= ch <= "ヿ" or "一" <= ch <= "鿿" for ch in term)
    if has_cjk:
        return len(term) <= 12
    return len(term.split()) <= 5


def _match_keyword(q: str):
    for keywords, company_field, output_key, value in _KEYWORDS:
        if any(kw in q for kw in keywords):
            return company_field, output_key, value
    return None


def _fallback(question: str, companies: list[dict], lang: str) -> dict:
    q = question.lower()

    if any(w in q for w in _META_WORDS):
        if lang == "ja":
            answer = "このダッシュボードは、会員企業の契約・支払い・請求書ステータスをすぐに確認できるサクラ ディープテック渋谷の管理画面です。詳しい使い方は、右上の「？」ヘルプボタンからご覧いただけます。"
        else:
            answer = "This is the Sakura Deeptech Shibuya member status console, for quickly checking a member company's contract, payment, and invoice status. See the \"?\" Help button in the top right for a full guide to every feature."
        return {"answer": answer, **_EMPTY_FILTERS}

    # 1) "which company is riskiest" -- a genuine analytical answer, not just a filter.
    # Matched by co-occurrence (a risk word + a superlative/comparative word) rather than an
    # exact-phrase list, so natural rewordings ("at higher risk", "most urgent") still hit it.
    if any(w in q for w in _RISK_WORDS) and any(w in q for w in _SUPERLATIVE_WORDS):
        candidates = [c for c in companies if c["risk"]["level"] != "None"]
        if candidates:
            top = max(candidates, key=lambda c: c["risk"]["score"])
            reasons = [translate_reason(r, lang) for r in top["risk"]["reasons"]]
            if lang == "ja":
                reason_text = "、".join(reasons) if reasons else "特筆すべき要因はありません"
                answer = f"現在最もリスクが高いのは「{top['name']}」です（{top['risk']['level']}）。理由: {reason_text}。"
            else:
                reason_text = ", ".join(reasons) if reasons else "no specific factors flagged"
                answer = f"{top['name']} currently has the highest risk ({top['risk']['level']}) -- {reason_text}."
            return {"answer": answer, **_EMPTY_FILTERS, "search": top["name"]}

    # 2) sum/average/etc -- the rule engine can't compute this even if a status word
    # (e.g. "cancelled") also appears in the question; don't let branch 4 mistake it
    # for a plain filter and answer a different question than the one asked.
    if any(w in q for w in _AGGREGATE_WORDS):
        return _ai_needed(lang)

    match = _match_keyword(q)

    # 3) "how many X" -- a count answer, table filtered to the same set for staff to inspect
    if match and any(kw in q for kw in _COUNT_KEYWORDS):
        company_field, output_key, value = match
        count = sum(1 for c in companies if c[company_field] == value)
        answer = f"{value}に該当する会員企業は{count}社です。" if lang == "ja" else f"{count} companies match {value}."
        return {"answer": answer, **{**_EMPTY_FILTERS, output_key: value}}

    # 4) plain status-keyword filter, answer describes what got applied
    if match:
        company_field, output_key, value = match
        count = sum(1 for c in companies if c[company_field] == value)
        answer = (
            f"{value}に該当する{count}社を表に表示しました。" if lang == "ja"
            else f"Filtered the table to {count} companies matching {value}."
        )
        return {"answer": answer, **{**_EMPTY_FILTERS, output_key: value}}

    # 5) short questions are probably a name/industry fragment -- try a substring search.
    # Longer ones ("what is the average monthly fee for at-risk companies?") are almost
    # certainly an analytical question the rule-based fallback can't compute -- say so
    # honestly instead of dumping the whole sentence into a bogus "no match" search.
    term = question.strip()
    if _is_short_query(term):
        term_lower = term.lower()
        matches = [c for c in companies if term_lower in c["name"].lower() or term_lower in c["industry"].lower()]
        if lang == "ja":
            answer = f"「{term}」に一致する会員企業が{len(matches)}社見つかりました。" if matches else f"「{term}」に一致する会員企業は見つかりませんでした。"
        else:
            if matches:
                noun = "company" if len(matches) == 1 else "companies"
                answer = f'Found {len(matches)} {noun} matching "{term}".'
            else:
                answer = f'No companies matched "{term}".'
        return {"answer": answer, **_EMPTY_FILTERS, "search": term}

    return _ai_needed(lang)


def _ai_needed(lang: str) -> dict:
    if lang == "ja":
        answer = "この質問に答えるにはAI接続が必要ですが、現在一時的に利用できません。少し待って再度お試しいただくか、上部の検索・フィルターをご利用ください。"
    else:
        answer = "This question needs the AI service to answer, which is temporarily unavailable. Please try again shortly, or use the search/filters above."
    return {"answer": answer, **_EMPTY_FILTERS}


def answer_question(question: str, companies: list[dict], lang: str = "en", history: list[dict] | None = None) -> dict:
    """history, when present, is a list of {"question": ..., "answer": ...} prior
    turns from the same Ask AI session -- used so Gemini can handle follow-up
    questions ("and which one of those is at highest risk?") with context from
    earlier in the conversation. The full company dataset is only sent once,
    on the current turn, so it's always fresh -- not repeated (and going
    stale) on every historical turn."""
    try:
        settings.require_gemini()
        if settings.demo_mode:
            raise GeminiNotConfiguredError("demo mode enabled")

        system = smart_search_system(lang, date.today().isoformat())
        companies_context = [
            {
                "id": c["id"],
                "name": c["name"],
                "industry": c["industry"],
                "membership_plan": c["membership_plan"],
                "contract_status": c["contract_status"],
                "renewal_date": c["renewal_date"],
                "payment_status": c["effective_payment_status"],
                "invoice_status": c["invoice_request_status"],
                "monthly_fee_jpy": c["monthly_fee_jpy"],
                "risk_level": c["risk"]["level"],
                "risk_reasons": c["risk"]["reasons"],
            }
            for c in companies
        ]
        payload = {"question": question, "companies": companies_context}

        if history:
            turns = []
            for turn in history:
                turns.append({"role": "user", "parts": [{"text": turn.get("question", "")}]})
                turns.append({"role": "model", "parts": [{"text": json.dumps({"answer": turn.get("answer", "")}, ensure_ascii=False)}]})
            turns.append({"role": "user", "parts": [{"text": json.dumps(payload, ensure_ascii=False)}]})
            user_content = turns
        else:
            user_content = json.dumps(payload, ensure_ascii=False)

        result = call_gemini(system, user_content)
        if "answer" not in result:
            raise GeminiAPIError("Gemini response missing 'answer' key")
        filters = {
            "search": result.get("search") or "",
            "contract_status": result.get("contract_status") or "",
            "payment_status": result.get("payment_status") or "",
            "invoice_status": result.get("invoice_status") or "",
        }
        return {"answer": result["answer"], **filters, "source": "ai"}
    except (GeminiAPIError, GeminiNotConfiguredError, Exception):
        fallback = _fallback(question, companies, lang)
        fallback["source"] = "fallback"
        return fallback
