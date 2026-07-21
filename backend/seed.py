"""Deterministic seed data for the Sakura Deeptech Shibuya member console.

Deliberately makes zero network calls -- seeding must never depend on the AI
service being reachable. Dates are computed relative to "today" so the
dashboard always opens with a realistic, currently-relevant mix: some
renewals due soon, some late payments, a few invoices not yet sent.

Run directly: `python -m backend.seed`
"""

from __future__ import annotations

import random
from datetime import date, timedelta

from backend.db import db_session, init_db

random.seed(42)

TODAY = date.today()

# (name, industry, membership_plan)
COMPANIES: list[tuple[str, str, str]] = [
    ("Sakura Robotics K.K.", "Robotics", "Innovation Lab Bay"),
    ("Neuroflow AI Inc.", "AI / Deep Tech", "Private Suite"),
    ("株式会社 Quantum Leaf", "Deep Tech", "Private Suite"),
    ("Shibuya BioWorks", "Biotech", "Dedicated Desk"),
    ("Voltaic Mobility K.K.", "Mobility", "Innovation Lab Bay"),
    ("株式会社 Hikari Fintech", "Fintech", "Dedicated Desk"),
    ("Loop Commerce Japan", "E-commerce", "Standard Desk"),
    ("Kotodama Studio", "Design / Creative", "Standard Desk"),
    ("Zenith Semiconductor", "Semiconductor", "Private Suite"),
    ("株式会社 蒼空Dynamics", "Aerospace", "Innovation Lab Bay"),
    ("GreenGrid Energy K.K.", "Climate Tech", "Dedicated Desk"),
    ("Nami Health Labs", "HealthTech", "Dedicated Desk"),
    ("Tsubasa EdTech", "EdTech", "Standard Desk"),
    ("株式会社 Kaiju Games", "Gaming", "Standard Desk"),
    ("Origami Legal Tech", "LegalTech", "Standard Desk"),
    ("Meridian Web3 Labs", "Blockchain", "Dedicated Desk"),
    ("株式会社 Sumire Marketing", "Marketing Agency", "Standard Desk"),
    ("Rin Analytics K.K.", "SaaS / Data", "Dedicated Desk"),
    ("Cobalt Materials Japan", "Materials Science", "Private Suite"),
    ("株式会社 Fujimi Realty Tech", "PropTech", "Dedicated Desk"),
    ("Hanabi Media Group", "Media / Content", "Standard Desk"),
    ("Aozora Cloud Systems", "SaaS / Data", "Dedicated Desk"),
    ("株式会社 Kitsune Security", "Cybersecurity", "Dedicated Desk"),
    ("Wavelength Audio K.K.", "Consumer Hardware", "Standard Desk"),
    ("Tsuki Logistics AI", "Logistics Tech", "Innovation Lab Bay"),
    ("株式会社 Momiji Consulting", "Consulting", "Standard Desk"),
    ("Ember Robotics Collective", "Robotics", "Innovation Lab Bay"),
    ("Shirokuma FoodTech", "FoodTech", "Standard Desk"),
    ("株式会社 Ryusei Semicon", "Semiconductor", "Private Suite"),
    ("Northwind Insurtech", "InsurTech", "Dedicated Desk"),
    ("Kessho Materials Lab", "Materials Science", "Dedicated Desk"),
    ("株式会社 Asahi HR Cloud", "HR Tech", "Standard Desk"),
    ("Photon Dynamics K.K.", "Deep Tech", "Private Suite"),
    ("Mizu Water Solutions", "Climate Tech", "Standard Desk"),
    ("株式会社 Hagane Manufacturing DX", "Industrial DX", "Dedicated Desk"),
    ("Cascade Payments Japan", "Fintech", "Dedicated Desk"),
    ("Hoshizora Aerospace", "Aerospace", "Innovation Lab Bay"),
    ("株式会社 Nagi Wellness", "HealthTech", "Standard Desk"),
    ("Ridgeline Ventures Studio", "Venture Studio", "Private Suite"),
    ("Kinako Consumer Brands", "Consumer Goods", "Standard Desk"),
    ("株式会社 Enishi Legal", "LegalTech", "Standard Desk"),
    ("Delta Autonomy K.K.", "Mobility", "Innovation Lab Bay"),
    ("Sango Marine Tech", "Ocean Tech", "Dedicated Desk"),
    ("株式会社 Yuudachi Studio", "Design / Creative", "Standard Desk"),
    ("Halcyon BioSciences", "Biotech", "Private Suite"),
    ("Ripple Fintech Labs", "Fintech", "Dedicated Desk"),
    ("株式会社 Tomoshibi Energy", "Climate Tech", "Dedicated Desk"),
    ("Argon Chip Design", "Semiconductor", "Private Suite"),
    ("Nemuri Sleep Robotics", "Consumer Hardware", "Standard Desk"),
    ("株式会社 Shinrin Forestry DX", "AgriTech", "Standard Desk"),
    ("Vertex Cloud Security", "Cybersecurity", "Dedicated Desk"),
    ("Tanoshii Games Studio", "Gaming", "Standard Desk"),
    ("株式会社 Hoshi no Kuni AI", "AI / Deep Tech", "Private Suite"),
    ("Coral Reef Analytics", "SaaS / Data", "Standard Desk"),
    ("Ginkgo PropTech K.K.", "PropTech", "Dedicated Desk"),
]

CONTACT_FIRST = ["Aoi", "Ren", "Sora", "Yui", "Hana", "Kaito", "Mei", "Riku",
                 "James", "Emily", "David", "Sophia", "Marco", "Priya", "Wei", "Noah"]
CONTACT_LAST = ["Tanaka", "Suzuki", "Sato", "Watanabe", "Kobayashi", "Yamamoto",
                "Nakamura", "Ito", "Chen", "Kim", "Miller", "Garcia", "Rossi", "Nguyen"]

EVENT_LOG = {
    "start": "Membership agreement signed and onboarded.",
    "renewed": "Contract renewed for another term.",
    "payment": "Monthly invoice paid in full.",
    "invoice_sent": "Invoice issued to member company.",
    "invoice_requested": "Member company requested a new invoice.",
    "reminder": "Renewal reminder sent to primary contact.",
    "overdue_notice": "Late payment notice sent.",
    "status_update": "Status manually reviewed by operations staff.",
}


def _rand_date(days_from_today_min: int, days_from_today_max: int) -> date:
    offset = random.randint(days_from_today_min, days_from_today_max)
    return TODAY + timedelta(days=offset)


def _contact() -> tuple[str, str, str]:
    first, last = random.choice(CONTACT_FIRST), random.choice(CONTACT_LAST)
    name = f"{first} {last}"
    email = f"{first.lower()}.{last.lower()}@{random.choice(['mail', 'corp', 'work'])}.example.com"
    phone = f"090-{random.randint(1000,9999)}-{random.randint(1000,9999)}"
    return name, email, phone


def _build_company(name: str, industry: str, plan: str, profile: str) -> dict:
    """Payment/invoice are now a strict two-value ground truth (Paid/Not Paid,
    Sent/Not Sent) -- a company can never be Paid without its invoice being
    Sent. "Late Payment" isn't set here at all: it's computed at read time
    from (Not Paid + renewal_date already passed), which doubles as the
    payment due date. Some profiles below deliberately put renewal_date in
    the past alongside Not Paid so the dashboard opens with a few Late
    Payment companies to demonstrate that."""
    started = _rand_date(-900, -60)
    contact_person, contact_email, contact_phone = _contact()
    fee = random.choice([48000, 68000, 98000, 128000, 168000, 248000, 398000])
    notes = ""
    invoice_sent_date = None
    last_payment = None

    if profile == "healthy":
        contract_status = "Active"
        renewal_date = _rand_date(120, 400)
        payment_status = "Paid"
        invoice_status = "Sent"
        invoice_sent_date = _rand_date(-40, -10)
        last_payment = _rand_date(-25, -2)
    elif profile == "renewal_due":
        contract_status = "Pending Renewal"
        renewal_date = _rand_date(3, 30)
        payment_status = random.choice(["Paid", "Not Paid"])
        invoice_status = "Sent"
        invoice_sent_date = _rand_date(-40, -10)
        if payment_status == "Paid":
            last_payment = _rand_date(-40, -5)
    elif profile == "payment_risk":
        # Renewal date already passed but staff hasn't updated contract_status
        # yet -- exactly the case "Late Payment" auto-detection is for.
        contract_status = "Active"
        renewal_date = _rand_date(-25, -1)
        payment_status = "Not Paid"
        invoice_status = random.choice(["Sent", "Not Sent"])
        if invoice_status == "Sent":
            invoice_sent_date = _rand_date(-60, -26)
        notes = "Finance flagged for follow-up call."
    elif profile == "payment_due_soon":
        # Renewal date is today or within the next 3 days and payment hasn't
        # come in yet -- demonstrates the High (due today) / Low (due in 1-3
        # days) risk tiers, distinct from "payment_risk" (already overdue).
        contract_status = "Pending Renewal"
        renewal_date = _rand_date(0, 3)
        payment_status = "Not Paid"
        invoice_status = random.choice(["Sent", "Not Sent"])
        if invoice_status == "Sent":
            invoice_sent_date = _rand_date(-20, -5)
        notes = "Payment due imminently; follow up before the renewal date."
    elif profile == "invoice_gap":
        contract_status = "Active"
        renewal_date = _rand_date(40, 250)
        payment_status = "Not Paid"  # can't be Paid -- invoice hasn't been sent
        invoice_status = "Not Sent"
        notes = "Billing contact requested a reissued invoice; not yet sent."
    elif profile == "critical":
        contract_status = "Pending Renewal"
        renewal_date = _rand_date(-14, -1)
        payment_status = "Not Paid"
        invoice_status = "Not Sent"
        notes = "Multiple issues open -- prioritize outreach."
    elif profile == "expired":
        contract_status = "Expired"
        renewal_date = _rand_date(-90, -5)
        payment_status = random.choice(["Paid", "Not Paid"])
        invoice_status = "Sent" if payment_status == "Paid" else random.choice(["Sent", "Not Sent"])
        if invoice_status == "Sent":
            invoice_sent_date = _rand_date(-120, -60)
        if payment_status == "Paid":
            last_payment = _rand_date(-120, -60)
        notes = "Contract lapsed; awaiting renewal decision."
    else:  # cancelled
        contract_status = "Cancelled"
        renewal_date = _rand_date(-200, -30)
        payment_status = "Paid"
        invoice_status = "Sent"
        invoice_sent_date = _rand_date(-210, -70)
        last_payment = _rand_date(-200, -60)
        notes = "Membership cancelled by member company."

    return {
        "name": name,
        "industry": industry,
        "membership_plan": plan,
        "contact_person": contact_person,
        "contact_email": contact_email,
        "contact_phone": contact_phone,
        "contract_status": contract_status,
        "contract_start_date": started.isoformat(),
        "renewal_date": renewal_date.isoformat(),
        "payment_status": payment_status,
        "last_payment_date": last_payment.isoformat() if last_payment else None,
        "monthly_fee_jpy": fee,
        "invoice_request_status": invoice_status,
        "invoice_sent_date": invoice_sent_date.isoformat() if invoice_sent_date else None,
        "notes": notes,
        "updated_at": _rand_date(-10, 0).isoformat(),
        "_started": started,
        "_renewal": renewal_date,
        "_last_payment": last_payment or renewal_date,
    }


def _build_events(company_id: int, c: dict) -> list[tuple[str, str, str]]:
    events = [("start", c["_started"].isoformat(), EVENT_LOG["start"])]

    if c["contract_status"] in ("Active", "Pending Renewal") and c["_started"] < TODAY - timedelta(days=365):
        events.append(("renewed", (c["_started"] + timedelta(days=365)).isoformat(), EVENT_LOG["renewed"]))

    if c["last_payment_date"]:
        last_payment = c["_last_payment"]
        for i in range(random.randint(1, 3)):
            pay_date = last_payment - timedelta(days=30 * i)
            events.append(("payment", pay_date.isoformat(), EVENT_LOG["payment"]))

    if c["invoice_request_status"] == "Not Sent":
        events.append(("invoice_requested", (TODAY - timedelta(days=random.randint(2, 20))).isoformat(),
                        EVENT_LOG["invoice_requested"]))
    elif c["invoice_sent_date"]:
        events.append(("invoice_sent", c["invoice_sent_date"], EVENT_LOG["invoice_sent"]))

    if c["contract_status"] == "Pending Renewal":
        events.append(("reminder", (TODAY - timedelta(days=random.randint(1, 5))).isoformat(), EVENT_LOG["reminder"]))

    if c["payment_status"] == "Not Paid" and c["_renewal"] < TODAY:
        events.append(("overdue_notice", (TODAY - timedelta(days=random.randint(1, 10))).isoformat(),
                        EVENT_LOG["overdue_notice"]))

    events.sort(key=lambda e: e[1])
    return events


def seed() -> None:
    init_db()

    # 55 companies split across risk profiles so the dashboard opens with a
    # meaningful, non-trivial mix on first load.
    profiles = (
        ["healthy"] * 22
        + ["renewal_due"] * 6
        + ["payment_due_soon"] * 4
        + ["payment_risk"] * 8
        + ["invoice_gap"] * 6
        + ["critical"] * 5
        + ["expired"] * 3
        + ["cancelled"] * 1
    )
    random.shuffle(profiles)

    with db_session() as conn:
        conn.execute("DELETE FROM activity_events")
        conn.execute("DELETE FROM companies")
        conn.execute("DELETE FROM sqlite_sequence WHERE name IN ('companies','activity_events')")

        for (name, industry, plan), profile in zip(COMPANIES, profiles):
            c = _build_company(name, industry, plan, profile)
            cur = conn.execute(
                """
                INSERT INTO companies (
                    name, industry, membership_plan, contact_person, contact_email, contact_phone,
                    contract_status, contract_start_date, renewal_date, payment_status,
                    last_payment_date, monthly_fee_jpy, invoice_request_status, invoice_sent_date,
                    notes, updated_at
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """,
                (
                    c["name"], c["industry"], c["membership_plan"], c["contact_person"],
                    c["contact_email"], c["contact_phone"], c["contract_status"],
                    c["contract_start_date"], c["renewal_date"], c["payment_status"],
                    c["last_payment_date"], c["monthly_fee_jpy"], c["invoice_request_status"],
                    c["invoice_sent_date"], c["notes"], c["updated_at"],
                ),
            )
            company_id = cur.lastrowid
            for event_type, event_date, description in _build_events(company_id, c):
                conn.execute(
                    "INSERT INTO activity_events (company_id, event_type, event_date, description) VALUES (?,?,?,?)",
                    (company_id, event_type, event_date, description),
                )

    print(f"Seeded {len(COMPANIES)} companies into the database.")


if __name__ == "__main__":
    seed()
