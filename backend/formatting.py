"""Locale-aware date/label formatting shared by the fallback (non-AI) text generators."""

from __future__ import annotations

from datetime import datetime

_MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"]

_STATUS_JA = {
    "Active": "有効", "Pending Renewal": "更新手続き中", "Expired": "契約終了", "Cancelled": "解約済み",
    "Paid": "支払済み", "Not Paid": "未払い", "Late Payment": "支払遅延",
    "Sent": "送付済み", "Not Sent": "未送付",
}


def format_date(iso_date: str, lang: str) -> str:
    d = datetime.strptime(iso_date, "%Y-%m-%d").date()
    if lang == "ja":
        return f"{d.year}年{d.month}月{d.day}日"
    return f"{_MONTHS_EN[d.month - 1]} {d.day}, {d.year}"


def status_label(value: str, lang: str) -> str:
    if lang == "ja":
        return _STATUS_JA.get(value, value)
    return value
