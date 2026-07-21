# Sakura Deeptech Shibuya — Member Status Console

A dashboard built for the **Tokyo Land / Tokyu Fudosan Enterprise Challenge** hackathon, now
hardened for production use. Lets Sakura Deeptech Shibuya operations staff answer *"what's the
status of member company X?"* in seconds — plus AI-assisted call scripts, a risk radar, and
portfolio analytics.

See [`CHALLENGE_BRIEF.md`](CHALLENGE_BRIEF.md) for the original brief and
[`PROJECT_SPEC.md`](PROJECT_SPEC.md) for a full technical spec (handy if you want to hand this to
another AI assistant to regenerate or extend the project).

## Features

**Required MVP**
- Company name, contract status, renewal date, payment status, invoice request status
- Instant search across company name / industry / contact

**Business rules**
- Invoice request is binary: **Sent** / **Not Sent**, with an `invoice_sent_date` set automatically
  when it's marked Sent.
- Payment is **Paid** / **Not Paid**, with **Late Payment** computed automatically (never stored
  directly) whenever a company is Not Paid and today is past its renewal date. All date comparisons
  use today's date at request time, so status is always current.
- A company can never be marked **Paid** without its invoice having been **Sent** — enforced on
  every write path (create, modify, quick status edit).
- `last_payment_date` is only ever populated when Paid, and only shown in the company detail drawer
  (not the list) — same for contact email, which appears only once a record is clicked.

**Beyond the brief**
- **Full CRUD** — Add Record / Modify record / Delete record, in addition to the quick inline
  status editor, each logged to the company's activity timeline
- **Pagination** — configurable rows-per-page (10/25/50) with Prev/Next controls, so the table
  stays scannable regardless of how many companies are loaded
- **AI Risk Radar** — rule-scored list of companies needing attention first (renewal soon, late
  payment, invoice not sent), so staff see priorities before they even search
- **AI call-script generator** — per company, a ready-to-read phone script + recommended next
  action, generated live by Gemini on Vertex AI, with a rule-based fallback if the AI service is
  unavailable so the console never breaks
- **AI portfolio insight banner** — a daily headline + action bullets over the whole member base
- **Ask AI** — a prominent, always-visible schema-aware Q&A bar (not a hidden toggle). It's given
  the full company + risk dataset as context, so it directly answers analytical questions in
  either language ("which company is at higher risk?", "how many companies have a late payment?",
  "which industry has the most cancellations?"), not just simple filter lookups — and still fills
  the table filters when the answer centers on specific companies. The rule-based fallback handles
  common patterns (riskiest company, status counts, name search) and is honest when a question
  needs real AI reasoning it can't do instead of guessing
- **Model connection status** — a live badge in the header ("Model Connected" / "Fallback Mode" /
  "Demo Mode") so it's always visible whether AI answers are coming from Gemini or the rule engine,
  rechecked automatically every 2 minutes
- **Fuzzy "did you mean" search** — a typo'd company name (e.g. "Qauntum") falls back to
  close-match suggestions instead of a bare "no results"; a true non-match still shows "no results"
  with no suggestions
- **Animated AI progress states** — every AI call shows a spinner with rotating status sentences
  instead of a static "loading" label
- **Portfolio analytics** — contract/payment/invoice breakdown donuts + upcoming-renewals-by-month
  bar chart
- **Segmentation** — risk breakdown by membership plan and by industry, narrated by a 4th AI agent
- **CSV export** of the current filtered view
- **Full English / Japanese UI toggle**, including AI-generated content
- **Light / dark theme toggle**

## Tech stack

- **Backend**: FastAPI + SQLite (stdlib `sqlite3`, no ORM)
- **AI**: Gemini on Vertex AI (`gemini-2.5-flash` by default), called directly through the
  `google-genai` SDK (`backend/gemini_client.py`) — no third-party proxy in front of it
- **Persistence**: `tokyu.db` lives in a Google Cloud Storage bucket as the source of truth
  (`backend/gcs_store.py`) — downloaded to local SQLite on startup, re-uploaded after every write
- **Frontend**: vanilla HTML/CSS/JS, no build step, hand-built SVG charts — served directly by
  FastAPI as static files

## Setup

```bash
# from the project root
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# create the local SQLite database with ~55 seeded member companies
python -m backend.seed

# authenticate to Vertex AI once (skip if DEMO_MODE=true)
gcloud auth application-default login

# run the app
uvicorn backend.main:app --reload --port 8000
```

Open **http://localhost:8000**.

## Configuration

Copy `.env.example` to `.env` (already done in this checkout) and set:

```
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=asia-northeast1
GEMINI_MODEL=gemini-2.5-flash
DEMO_MODE=false

GCS_BUCKET_NAME=tokyu
GCS_DB_OBJECT_NAME=tokyu.db
```

For local development, run `gcloud auth application-default login` once so the `google-genai` and
`google-cloud-storage` SDKs can find Application Default Credentials. In production (Cloud Run),
the service's attached service account is used instead — it needs both the **Vertex AI User** and
**Storage Object Admin** (or equivalent read/write) IAM roles granted once:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gsutil iam ch \
  serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com:roles/storage.objectAdmin \
  gs://tokyu
```

Set `DEMO_MODE=true` to skip the network entirely and always use the rule-based fallback text —
useful for an offline demo or if the Vertex AI endpoint is unreachable. Every AI feature keeps
working either way; only the source label ("AI" vs "RULE-BASED", shown subtly in the UI) changes.

## Data source: Google Cloud Storage

`tokyu.db` in the `tokyu` GCS bucket is the durable source of truth. On startup, the app downloads
it to a local SQLite file; after every Add/Modify/Delete/status-update, the updated file is pushed
back to GCS so edits survive a redeploy or instance restart (see `backend/gcs_store.py`). If GCS
isn't configured or reachable (e.g. local dev without the bucket permissions), the app falls back
to the local seed data automatically — the same "AI down → fallback" philosophy used everywhere
else in this app. Leave `GCS_BUCKET_NAME` empty to disable GCS entirely and always use seed data.

## Resetting the demo data

`python -m backend.seed` is idempotent — it wipes and regenerates all companies/activity with a
fixed random seed, with dates computed relative to today (so renewals/late payments always look
current). Only run this against the local fallback path; if `GCS_BUCKET_NAME` is set, re-seeding
overwrites the local copy but the next write will push it back up to `tokyu.db` in GCS, so avoid
this in production once the bucket holds real member data.

## Deploying

`Dockerfile` + `cloudbuild.yaml` in the repo root build and deploy this app to Cloud Run. From a
GCP project with Cloud Build and Cloud Run enabled:

```bash
gcloud builds submit --config cloudbuild.yaml
```

`$PROJECT_ID` in `cloudbuild.yaml` is filled in automatically by Cloud Build from whichever project
you run the command in — no project ID needs to be hardcoded or typed in beforehand. Grant the
Cloud Run service account the Vertex AI User role (see above) before the AI features will work in
production.

**Note on persistence**: `tokyu.db` in GCS is the durable source of truth (see above), but each
Cloud Run instance keeps its own local SQLite copy in between requests and pushes it back to GCS
after every write. With more than one instance running, two instances editing at the same time
could overwrite each other's changes in GCS (last write wins) — `cloudbuild.yaml` pins
`--max-instances 1` to avoid that until a proper multi-writer store (e.g. Cloud SQL) replaces this
download/upload pattern.

## Project layout

```
backend/     FastAPI app, SQLite access, risk engine, Gemini agents, seed data
frontend/    index.html + static/{css,js,img} — no build step
data/        tokyu.db (generated, gitignored)
```
