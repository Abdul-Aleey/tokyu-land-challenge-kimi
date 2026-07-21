# Project Spec: Sakura Deeptech Shibuya — Member Status Console

> **Purpose of this document.** This is a self-contained technical spec of a working local MVP,
> written so it can be handed to any AI coding assistant (or a human) to regenerate an equivalent
> project from scratch — without needing the original conversation that produced it. It captures
> the original challenge brief, every architectural decision, the exact data model, API surface,
> AI prompt contracts, and the design language, so nothing is lost in translation.

## 1. The problem (original hackathon brief, paraphrased)

Sakura Deeptech Shibuya (a member-company facility operated by Tokyu Land) currently tracks
membership, contracts, payments, and billing across scattered files and channels. Staff can't
quickly answer basic questions like "is this company's contract still active?" or "have they
paid?" when a member calls in.

**Build the smallest MVP** that lets staff answer, in seconds, for any member company:
- Company name
- Contract status
- Renewal / update date
- Payment status
- Invoice / billing request status
- ...with a simple search.

Explicitly **not** a request for a full management system — one clear workflow, done well:
*"Can staff quickly check what's happening with each member company?"*

**Scenario to satisfy end-to-end:** staff gets a call from "Company ABC" asking about their
contract. Staff searches "Company ABC" and immediately sees: Contract: Active · Renewal Date:
August 31, 2026 · Payment Status: Paid · Invoice Request: Sent. Staff answers in seconds.

## 2. Product decision: over-deliver without scope creep

Ship the required MVP exactly as specified, then add features that serve the *same* workflow
(finding a company's status fast, and knowing what to do about it) rather than unrelated
management-system features:

- **AI Risk Radar** — surfaces which companies need attention *before* anyone has to search,
  addressing the brief's own "why this matters" questions (which companies need renewal soon,
  which payments are pending, which invoice requests are missing).
- **AI call-script generator** — directly answers the phone-call scenario: staff opens a company
  and gets a ready-to-read script plus a recommended next action.
- **AI portfolio insight banner** — a daily summary of what needs attention across all companies.
- **Ask AI** — a schema-aware Q&A bar, not a filter-only search. It's given the full company +
  computed-risk dataset as context, so it answers analytical questions directly ("which company is
  at higher risk?", "how many companies have overdue payments?") in either language, in addition to
  simple lookups. Upgraded from an initial filter-only version after real use surfaced that a
  filter-mapping agent can't answer a question that isn't a filter.
- **Inline status editing + activity timeline** — makes it a working tool, not just a viewer.
- **Analytics (status breakdowns, renewals-by-month)** — turns the underlying data into decisions.
- **Segmentation & data quality** — the same status data sliced by membership plan and industry,
  plus a completeness report over existing contact/profile fields, narrated by a 4th AI agent.
  Added on request from a BI-data-engineer user, explicitly reusing existing columns only —
  no new tables, no seed changes.
- **Bilingual (EN/JA) UI**, including AI-generated content, since the operations staff are
  Japanese-speaking.
- **CSV export.**
- **Fuzzy "did you mean" search** and a one-click **Reset** for any active search/filter/Ask-AI
  state — small UX fixes requested after initial use, not part of the original scope.

Everything **not** in this list (accounts/auth, multi-facility support, billing integrations,
notifications, editable org charts, etc.) was deliberately left out — the brief explicitly warns
against building "a complete system."

## 3. Architecture

- **Backend**: Python, FastAPI, SQLite via the stdlib `sqlite3` module (no ORM — schema is small
  and stable, and a thin `sqlite3.Row`-based layer keeps the code readable without an ORM's
  overhead).
- **Frontend**: vanilla HTML/CSS/JS, zero build step, served directly by FastAPI as static files.
  Chosen over a React/Vite stack specifically because a hackathon demo should never depend on an
  `npm install` or a dev server succeeding on a judge's machine — `uvicorn` + open a browser is
  the entire runbook. Charts are hand-built inline SVG (no charting library) for full control over
  the visual language and zero extra dependencies.
- **AI**: Kimi K2 (`moonshotai/kimi-k2.7-code`) via an OpenAI-compatible `/chat/completions`
  endpoint, called through a small retry-with-backoff HTTP client. Every AI-backed feature has a
  **deterministic rule-based fallback** so a transient 502/503 from the AI endpoint degrades the
  experience (less prose) rather than breaking it (visible error). This mattered because the
  endpoint used during development showed real intermittent 502/503s.
- **Persistence**: SQLite file, regenerated by a deterministic seed script (no network calls
  during seeding — seeding must never depend on the AI endpoint being up).

### Directory layout

```
backend/
  main.py                 FastAPI app: mounts static frontend + routers, calls init_db() at startup
  config.py                .env-driven Settings (KIMI_API_BASE/KEY/MODEL, DEMO_MODE), require_kimi()
  db.py                    sqlite3 connection + schema (companies, activity_events)
  schemas.py               Pydantic response/request models
  risk.py                  Rule-based risk scoring shared by API responses, radar, and AI fallbacks
  formatting.py             Locale-aware date/status-label formatting for fallback text (EN/JA)
  json_utils.py             strip_json_fence() — cleans ```json fences from LLM output
  kimi_client.py            HTTP client: call_kimi(system, user_content) -> dict, retries 429/502/503/504
  seed.py                   Deterministic seed data generator (~55 companies + activity history)
  prompts.py                System prompt builders for the 4 AI agents (EN/JA aware)
  agents/
    company_brief.py        Per-company call-script + recommended action (+ fallback)
    portfolio_insights.py   Portfolio-wide headline + bullets (+ fallback)
    smart_search.py         Natural-language question -> filter dict (+ heuristic fallback)
    segment_insights.py     Narrates segmentation + data-quality findings (+ fallback)
  routers/
    companies.py            GET list (search/filter), GET suggest (fuzzy match), GET detail+timeline, PATCH status
    analytics.py             GET summary, GET renewals-by-month, GET risk-radar, GET segmentation, GET data-quality
    ai.py                    POST company-brief/{id}, POST portfolio-insights, POST smart-search, POST segment-insights
frontend/
  index.html
  static/css/style.css      Design tokens (light/dark), all component styles
  static/js/app.js           State, i18n dictionary (EN/JA), rendering, API calls, interactions
  static/js/charts.js        Hand-built SVG donut + bar chart renderer with hover tooltips
  static/img/tokyu_logo.jpg
data/tokyu.db                Generated by seed.py, gitignored
```

## 4. Data model (SQLite)

```sql
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_kana TEXT,
    industry TEXT NOT NULL,
    membership_plan TEXT NOT NULL,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    contract_status TEXT NOT NULL,          -- Active | Pending Renewal | Expired | Cancelled
    contract_start_date TEXT NOT NULL,      -- ISO date
    renewal_date TEXT NOT NULL,             -- ISO date
    payment_status TEXT NOT NULL,           -- Paid | Pending | Overdue
    last_payment_date TEXT,
    monthly_fee_jpy INTEGER NOT NULL,
    invoice_request_status TEXT NOT NULL,   -- Sent | Requested | Not Sent | Missing
    notes TEXT,
    updated_at TEXT NOT NULL
);

CREATE TABLE activity_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,   -- start | renewed | payment | invoice_sent | invoice_requested
                                  -- | reminder | overdue_notice | status_update
    event_date TEXT NOT NULL,
    description TEXT NOT NULL
);
```

**Seed data generation** (`backend/seed.py`): ~55 companies drawn from a curated name/industry
pool (deep tech, robotics, fintech, biotech, etc. — mixed Japanese/international names fitting a
Shibuya innovation-hub setting), each assigned one of 7 risk *profiles* (`healthy`,
`renewal_due`, `payment_risk`, `invoice_gap`, `critical`, `expired`, `cancelled`) in a fixed
distribution so the dashboard is meaningful on first load (some renewals due soon, some overdue
payments, a few missing invoices, a couple of lapsed contracts). All dates are computed relative
to `date.today()` at seed time — deterministic via `random.seed(42)`, but always "current" no
matter when you run it. 3-6 `activity_events` are generated per company from the same profile.

## 5. Rule-based risk engine (`backend/risk.py`)

Single function `compute_risk(company: dict) -> {score, level, reasons, days_to_renewal}`, used by
the company list endpoint, the risk radar, the renewals-by-month urgency coloring, and every AI
agent's fallback path (so risk signal survives even if the AI is down):

- Cancelled contracts → score 0, level `None` (excluded from risk entirely)
- Expired contract: +50
- Pending Renewal: +35 (≤7 days), +25 (≤14 days), +15 (≤30 days), else +0
- Payment Overdue: +40; Payment Pending: +15
- Invoice Missing: +25; Invoice Not Sent: +10
- Score capped at 100. Level: ≥70 Critical, ≥45 High, ≥20 Medium, else Low.

## 6. API surface

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/companies?search=&contract_status=&payment_status=&invoice_status=` | List + search/filter, includes computed `risk` |
| GET | `/api/companies/suggest?q=&limit=5` | Fuzzy "did you mean" name matches (registered before `/{company_id}` so it isn't swallowed as an int path param) |
| GET | `/api/companies/{id}` | Full detail + activity timeline |
| PATCH | `/api/companies/{id}/status` | Update any of contract/payment/invoice status; logs a `status_update` activity event |
| GET | `/api/analytics/summary` | KPI counts + breakdowns for charts |
| GET | `/api/analytics/renewals-by-month` | 12-month forward-looking renewal counts |
| GET | `/api/analytics/risk-radar?limit=8` | Top at-risk companies (High/Critical only) |
| GET | `/api/analytics/segmentation` | Status counts + at-risk count grouped by `industry` and by `membership_plan` |
| GET | `/api/analytics/data-quality` | Per-field completeness (`name_kana`, contact fields), notes coverage, sample of flagged companies |
| POST | `/api/ai/company-brief/{id}?lang=en\|ja` | `{summary, call_script, recommended_action, source}` |
| POST | `/api/ai/portfolio-insights?lang=en\|ja` | `{headline, bullets[], source}` |
| POST | `/api/ai/smart-search?lang=en\|ja` body `{question}` | `{answer, search, contract_status, payment_status, invoice_status, source}` — `answer` is a direct natural-language answer, the rest are optional table filters |
| POST | `/api/ai/segment-insights?lang=en\|ja` | `{headline, bullets[], source}` — narrates segmentation + data-quality |
| GET | `/api/ai/status` | `{connected, demo_mode, model, message}` — live Kimi reachability check via `kimi_client.check_connection()`, backs the header's "Model Connected / Fallback Mode / Demo Mode" badge |

`source` is always `"ai"` or `"fallback"` — the frontend shows this subtly so it's honest about
when a response came from the model vs. the rule engine.

## 7. AI agent contract (Kimi K2)

All four agents share one pattern in `backend/agents/*.py`:

```python
def generate_x(...):
    try:
        settings.require_kimi()              # raises if not configured, no-ops if DEMO_MODE
        if settings.demo_mode:
            raise KimiNotConfiguredError(...)  # force fallback path in demo mode
        result = call_kimi(system_prompt, json.dumps(payload, ensure_ascii=False))
        # validate expected keys are present, else raise
        result["source"] = "ai"
        return result
    except (KimiAPIError, KimiNotConfiguredError, Exception):
        fallback = _fallback(...)              # deterministic, template-based, EN/JA aware
        fallback["source"] = "fallback"
        return fallback
```

`call_kimi()` (`backend/kimi_client.py`) posts to `{KIMI_API_BASE}/chat/completions` with
`{model, messages: [{role: system}, {role: user}]}`, retries up to 3 times with exponential
backoff on 429/502/503/504, strips ```json fences, and parses the response as JSON. It does not
retry 401/400 (retrying won't fix a bad key or malformed request).

**System prompts** (`backend/prompts.py`) instruct the model to respond with *only* a JSON object
matching an exact key set, in the requested language (English, or natural business-polite
Japanese). Example — company brief:

```
Respond ONLY with a JSON object with exactly these keys:
{
  "summary": "...",           # one sentence, staff-facing
  "call_script": "...",       # 2-3 sentences to read ALOUD to the caller
  "recommended_action": "..."  # one concrete next step, or "no action needed"
}
```

The smart-search prompt whitelists the exact enum values the backend accepts
(`contract_status`/`payment_status`/`invoice_status`), so the model's output can be applied
directly as query filters without free-text injection risk.

## 8. Fallback text generation (no AI required)

Each agent's fallback builds natural sentences from the company data + `compute_risk()` reasons,
in both English and Japanese, using `backend/formatting.py` for locale-aware date formatting
(`July 22, 2026` vs `2026年7月22日`), `backend/risk.py::translate_reason()` for locale-aware risk
reasons, and status-label translation. `smart_search`'s fallback (`backend/agents/smart_search.py`)
tries, in order: (1) a risk-word + superlative-word co-occurrence check (`risk`/`urgent`/`危険` +
`highest`/`most`/`最も`, etc. — catches "which company is at higher risk", "most urgent company",
"一番リスクが高い" as genuine analytical questions, not just an exact-phrase list) that answers with
the actual highest-scored company; (2) a keyword matcher over English/Japanese status terms (e.g.
"overdue"/"未払い" → `payment_status=Overdue`) for count questions and plain filters; (3) for
anything else, a length check (character count for CJK text, since it has no whitespace to split
on; word count otherwise) that treats short input as a name/industry substring search and long
input as a real analytical question the rule engine can't compute — which gets an honest "this
needs the AI service, which is temporarily unavailable" answer instead of silently mismatching the
whole sentence as a company-name search. None of this requires network access — `DEMO_MODE=true`
forces every AI call through this path, useful for an offline demo.

## 9. Frontend

Single `index.html`, no framework, no build step. `app.js` holds:
- A full **EN/JA translation dictionary** (`I18N`), applied via `data-i18n` / `data-i18n-placeholder`
  attributes for static text, and `t(key)` calls for dynamically rendered content. Status enum
  values, risk levels, and activity-event types are translated client-side via fixed key maps
  (`CONTRACT_KEYS`, `PAYMENT_KEYS`, `INVOICE_KEYS`, `RISK_KEYS`, `EVENT_KEYS`) so the backend
  doesn't need per-language content beyond the AI-generated text (which the AI already generates
  in the requested language).
- **State**: current filters, cached analytics/summary/radar data, an insight cache keyed by
  language (avoids re-calling the AI every time the user toggles language back and forth).
- **Animated AI loading**: any Kimi-backed call (5-10s typical latency) shows a spinner plus a
  list of status sentences that cycle every ~2.2s (`createLoader(messagesKey)` in `app.js`) instead
  of a static "loading" label — this matters because a silent multi-second wait reads as broken in
  a live demo.
- **Fuzzy "did you mean" search**: the primary search stays a cheap SQL `LIKE` substring match on
  every keystroke. Only when that comes back empty *and* a search term is present does the
  frontend call `/api/companies/suggest` (`difflib.SequenceMatcher`-based token matching in
  `backend/routers/companies.py`, cutoff ratio 0.6) and render clickable "Did you mean: …" chips —
  a true non-match (no close names) still shows a plain "no results" message with no chips, so the
  distinction from the brief's requirement ("nothing found" only when genuinely nothing is close)
  is preserved.
- **Reset button** (`#resetBtn`): hidden by default, appears whenever any search/filter/Ask-AI
  state is active (`updateResetVisibility()`, called at the end of every `loadTable()`). One click
  clears the search box, all three status filters, the Ask AI question + explanation, closes the
  Ask AI panel, and reloads the full unfiltered company list — without a page refresh.
- **Segmentation & data quality section**: `loadSegmentation()` fetches `/api/analytics/segmentation`
  + `/api/analytics/data-quality` in parallel and renders (a) small stat cards per membership plan,
  (b) a sortable-by-risk industry table (capped at a `max-height` scroll since industry cardinality
  is high relative to 55 seed companies), (c) a completeness meter per tracked field (color banded:
  <50% critical, 50-80% warning, ≥80% good — reusing the same status color tokens as everywhere
  else in the UI) and a clickable list of flagged companies (click → opens that company's drawer).
  A 4th animated-loader AI banner (`loadSegmentInsight()`) narrates all of it, same
  try-Kimi/catch-fallback/cache-by-language pattern as the portfolio insight banner.
- **Ask AI is a permanent hero bar** (`.ask-ai-hero`, `#askAiPanel`), not a hidden toggle — early
  feedback was that a small ghost button off to the side made a headline AI feature easy to miss.
  It sits directly above the classic search/filter row, gradient-bordered with a pulsing sparkle
  badge, and the model's `answer` renders as the primary content (larger type, `text-primary`
  ink) with the `source` tag (AI/RULE-BASED) as a small trailing label — the returned filters are
  applied to the table underneath as a secondary convenience, not the main payload.
- **Model connection status badge** (`#modelStatus` in the header): calls `GET /api/ai/status`
  (which wraps `kimi_client.check_connection()` — a real minimal ping, distinct from the
  request-scoped retry logic in `call_kimi()`) on load and every 2 minutes, showing a pulsing gray
  dot while checking, green "Model Connected" once confirmed, or amber "Fallback Mode" /
  "Demo Mode" — so it's never ambiguous whether an AI answer on screen came from Kimi or the rule
  engine.

`charts.js` hand-builds SVG donut charts (contract/payment/invoice status breakdowns) and a bar
chart (renewals by month, colored by urgency band: this month = critical red, next 2-3 months =
warning amber, later = indigo), both with hover tooltips and legends, following a "data is the only
thing allowed to be loud" design discipline: 2px surface gaps between segments, 4px rounded bar
tops, recessive gridlines, text never colored by the data hue (only dots/marks carry color; text
stays in ink tokens).

## 10. Design language

- **Palette**: dark navy/indigo base (`#0a0b16` page / `#171a2e` panels) with a full light
  counterpart (`#fbf5ee` page / `#fffdfa` panels), toggled via `data-theme` on `<html>`, persisted
  to `localStorage`. Accent colors drawn from the real Tokyu Land logo (green) plus a sakura-pink
  ↔ indigo gradient used for the brand title and primary buttons, and a gold highlight for AI/insight
  moments.
- **Status semantics are fixed and reused everywhere** (badges, chart slices, risk pills): good =
  green, warning = amber, serious = orange, critical = red, neutral = gray for terminal/cancelled
  states. Every status chip pairs a color dot **with a text label** — never color alone.
- **Glassmorphism**: translucent panels (`backdrop-filter: blur(...)`) over a soft radial-gradient
  mesh background (sakura pink / indigo / green, very low opacity) — restrained, not neon.
- **Cards/panels**: 14-18px border radius, hairline borders, soft large-radius shadows.
- Typeface: system sans stack throughout (`system-ui, -apple-system, "Segoe UI", "Hiragino Kaku
  Gothic ProN", "Noto Sans JP", sans-serif`) — no display/serif faces, for both EN and JA legibility.

## 11. How to regenerate this project from scratch

1. Scaffold the FastAPI + SQLite backend per §3-§6 above; write `seed.py` first and get a database
   with realistic, currently-relevant dates before building any UI.
2. Build the risk engine (§5) before the AI agents — it's the shared fallback foundation.
3. Build the 4 AI agents with the try/fallback pattern in §7-§8 *before* wiring the frontend, and
   test each with `DEMO_MODE=true` and `DEMO_MODE=false` to confirm both paths return valid,
   complete JSON.
4. Build the frontend static files last, against a working API. Keep it framework-free unless the
   target environment guarantees Node tooling.
5. Verify against the original scenario in §1 end-to-end: search a company, see all four required
   fields instantly, open its detail view, get an AI call script.
