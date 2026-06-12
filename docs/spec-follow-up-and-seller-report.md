# Spec: Automated Visitor Follow-Up + Seller Report

**Status:** Draft — awaiting approval before implementation
**Decisions locked:** Resend for email · thank-you + 3-day nudge with per-event toggles · seller report as shareable link + PDF download · both features included in the existing $9.99/event price (no Stripe changes).

---

## 1. Overview

Two post-event features that close the loop on every open house:

1. **Automated visitor follow-up** — when an event completes, every visitor automatically receives a branded thank-you email with the property details and the agent's contact card. Three days later, visitors receive a "still interested?" nudge. Both emails are toggleable per event.
2. **Seller report** — a private, shareable, branded report page summarizing the open house (visitors, page views, visitor-type breakdown, peak traffic) that the agent sends to the home seller, with a print-optimized "Download PDF" option.

The two features share infrastructure: the post-completion automation pipeline and the Resend email integration.

---

## 2. Database changes

New migration file: `supabase/migration-followup-report.sql`

### 2.1 `events` — new columns

| Column | Type | Default | Purpose |
|---|---|---|---|
| `follow_up_enabled` | `boolean not null` | `true` | Per-event toggle for the thank-you email |
| `nudge_enabled` | `boolean not null` | `true` | Per-event toggle for the 3-day nudge |
| `completed_at` | `timestamptz` | `null` | Set when status flips to `completed`; drives nudge timing and prevents back-fill sends to old events |
| `report_token` | `uuid not null` | `gen_random_uuid()` | Capability token for the seller report URL (unique index) |

### 2.2 `visitors` — new column

| Column | Type | Default | Purpose |
|---|---|---|---|
| `email_opt_out` | `boolean not null` | `false` | Set via unsubscribe link; suppresses all future sends |

### 2.3 New table: `email_log`

Idempotency ledger — the cron runs every 15 minutes and must never double-send.

```sql
create table email_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  visitor_id uuid not null references visitors(id) on delete cascade,
  email_type text not null check (email_type in ('thank_you', 'nudge')),
  status text not null default 'sent' check (status in ('sent', 'failed')),
  attempts int not null default 1,
  resend_id text,
  created_at timestamptz not null default now(),
  unique (visitor_id, email_type)
);
```

RLS: enabled; agents can `select` rows for their own events (join through `events.agent_id`); no public access. All writes happen server-side via the admin client.

### 2.4 Existing-data guard

`completed_at` stays `null` for events completed before this ships. The email cron only processes events where `completed_at is not null`, so no emails are ever sent for historical events.

---

## 3. Feature 1: Automated visitor follow-up

### 3.1 Email provider setup

- Package: `resend` + `@react-email/components` (templates as React, rendered server-side).
- New env vars (add to `.env.local.example` and Vercel):
  - `RESEND_API_KEY`
  - `EMAIL_FROM` — e.g. `SignInSmart <noreply@signinsmart.com>` (requires verified domain in Resend)
  - `UNSUBSCRIBE_SECRET` — HMAC secret for signing unsubscribe tokens
- `Reply-To` is always set to the **agent's email**, so visitor replies go straight to the agent.
- New module: `src/lib/email/resend.ts` — thin client wrapper + `sendBatch` helper (Resend batch API, ≤100 emails/call).

### 3.2 Email templates (`src/emails/`)

Both templates use the property's first photo, address, price/beds/baths, and an agent contact card (name, brokerage, phone, email). Styling follows the existing neon design tokens but on a light background for email-client compatibility.

1. **`thank-you.tsx`** — sent when the event completes.
   - Subject: `Thanks for visiting {property_address}!`
   - Body: photo hero, property summary, "Questions? Reply to this email or call {agent}" CTA, agent card.
2. **`nudge.tsx`** — sent ~3 days after completion.
   - Subject: `Still thinking about {property_address}?`
   - Body: shorter; photo, price, "Reply to schedule a private showing" CTA, agent card.

**Compliance (CAN-SPAM):** both templates include the agent's name/brokerage and an unsubscribe link in the footer.

### 3.3 Send pipeline — new cron `/api/cron/follow-ups`

A separate route from `auto-complete` (single responsibility; `auto-complete` only gains one line: setting `completed_at = now()` when it marks events completed). Added to `vercel.json` on the same `*/15 * * * *` schedule, authenticated with the same `Bearer CRON_SECRET` pattern.

Each run, using the admin client:

1. **Thank-yous:** find events where `status = 'completed'`, `completed_at is not null`, `follow_up_enabled = true`. For each, select visitors with no `email_log` row of type `thank_you` (or a `failed` row with `attempts < 3`), `email_opt_out = false`. Dedupe by email within the event (first sign-in wins). Send via batch API; upsert `email_log` rows with the Resend id or `failed` status.
2. **Nudges:** same query shape, but `completed_at <= now() - interval '3 days'`, `nudge_enabled = true`, email type `nudge`, and only to visitors who already received a `thank_you` (skip anyone who unsubscribed in between).
3. Return `{ thankYousSent, nudgesSent, failed }` for observability in Vercel logs.

Failed sends retry automatically on subsequent runs (max 3 attempts via the `attempts` column).

### 3.4 Unsubscribe — new route `/api/email/unsubscribe`

- Link format: `/api/email/unsubscribe?v={visitor_id}&sig={hmac}` where `sig = HMAC-SHA256(visitor_id, UNSUBSCRIBE_SECRET)`. No login, no guessable URLs, no DB-stored tokens needed.
- On valid signature: set `visitors.email_opt_out = true`, render a minimal "You've been unsubscribed" confirmation page.

### 3.5 Agent-facing UI

- **Event form** (`src/components/forms/event-form.tsx` + `src/lib/validators/event.ts`): a "Follow-up emails" section with two toggles — *Send thank-you email after the event* and *Send a follow-up nudge 3 days later* (nudge toggle disabled when thank-you is off). Defaults on.
- **Event detail page** (`/events/[id]`): after completion, a small "Follow-up" status card showing sent/failed counts from `email_log` (e.g. "12 thank-you emails sent · nudge scheduled for Jun 15").

---

## 4. Feature 2: Seller report

### 4.1 Report page — `/report/[token]` (public route group)

- Server component; looks up the event by `report_token` using the admin client (the unguessable token *is* the access control — same model as the existing public `/oh/[slug]` page, but unlisted). Unknown token → 404.
- Available once the event has at least one visitor or page view; shows a "report will populate after your open house" empty state for upcoming events.

**Content (aggregate data only — no visitor names, emails, or phone numbers; the seller must never see lead PII):**

1. **Header:** agent branding (name, brokerage, phone, email), property hero photo + address, event date/time, "Open House Report" title.
2. **Headline stats:** total sign-ins, total page views, online-to-door conversion hint, buyers vs. neighbors vs. investors counts.
3. **Charts:** visitor-type donut/bar + peak-hours chart (reuse/extract logic from `src/components/dashboard/peak-hours-chart.tsx` into a shared component).
4. **Engagement timeline:** page views in the days before the event (from `event_analytics.created_at`), showing the seller the marketing reach.
5. **Footer:** "Prepared by {agent} with SignInSmart" — subtle product branding (viral loop), generation date.

### 4.2 PDF download

**v1 approach: print stylesheet + `window.print()`** (a "Download PDF" button that triggers the browser's print-to-PDF). Rationale: zero server infrastructure, perfect fidelity with the web report, works on Vercel without puppeteer/chromium bundles. The page gets dedicated `@media print` styles (light background, page-break rules, hidden button).

*Deferred alternative (not v1): server-rendered PDF via `@react-pdf/renderer` if agents ask for auto-emailing PDFs to sellers.*

### 4.3 Agent-facing UI

On the event detail page (`/events/[id]`), a **"Seller Report" card** (shown for active + completed events):

- **Copy link** button (copies `https://{host}/report/{token}`)
- **Preview** button (opens the report in a new tab)
- **Reset link** button (regenerates `report_token` via a server action, invalidating the old URL — with confirmation dialog)

New component: `src/components/dashboard/seller-report-card.tsx`; server action in `src/lib/actions/events.ts`.

---

## 5. File inventory

| File | Change |
|---|---|
| `supabase/migration-followup-report.sql` | **New** — all §2 schema changes (apply via Supabase MCP, fall back to CLI/manual per project convention) |
| `src/lib/types.ts` | Update `events`/`visitors` types, add `email_log` |
| `src/lib/email/resend.ts` | **New** — Resend client + batch helper |
| `src/emails/thank-you.tsx`, `src/emails/nudge.tsx` | **New** — React Email templates |
| `src/app/api/cron/follow-ups/route.ts` | **New** — send pipeline (§3.3) |
| `src/app/api/cron/auto-complete/route.ts` | Set `completed_at` when completing events |
| `src/app/api/email/unsubscribe/route.ts` | **New** — signed unsubscribe (§3.4) |
| `src/app/(public)/report/[token]/page.tsx` | **New** — seller report page |
| `src/components/report/*` | **New** — report stat cards, charts (shared chart logic extracted from peak-hours) |
| `src/components/dashboard/seller-report-card.tsx` | **New** — copy/preview/reset link card |
| `src/components/forms/event-form.tsx` + `src/lib/validators/event.ts` | Follow-up toggles |
| `src/lib/actions/events.ts` | `resetReportToken` server action |
| `vercel.json` | Add `/api/cron/follow-ups` cron |
| `.env.local.example` | Add `RESEND_API_KEY`, `EMAIL_FROM`, `UNSUBSCRIBE_SECRET` |
| `package.json` | Add `resend`, `@react-email/components` |

---

## 6. Edge cases & constraints

- **No back-fill:** events completed before deploy have `completed_at = null` → never emailed.
- **Duplicate visitor emails** within one event → dedupe before sending (one email per address).
- **Resend free tier** is 100 emails/day and 2 req/s — fine for launch; batch API keeps request count low. Verify the sending domain before go-live; upgrade tier as volume grows.
- **Unsubscribe is global per visitor row** (per-event in practice, since visitor rows are per-event). A visitor who unsubscribes after the thank-you never gets the nudge.
- **Event deletion** cascades `email_log`; already-sent emails are simply history.
- **Report privacy:** aggregate stats only; token is a 122-bit UUID; agent can rotate it. Report URLs include `noindex` robots meta.
- **Timezones:** nudge timing keys off `completed_at` (UTC) — a few hours of drift is acceptable for a "3 days later" email.

---

## 7. Implementation phases

1. **Foundation:** migration + types + Resend setup + env vars
2. **Thank-you flow:** template, cron route, `completed_at` in auto-complete, unsubscribe route, vercel.json
3. **Nudge flow:** template + cron extension
4. **Seller report page:** route, components, print styles
5. **Agent UI:** event-form toggles, follow-up status card, seller report card
6. **Verification:** apply migration to Supabase, seed a test event, force-complete it, confirm emails in Resend dashboard, check report rendering + print output

---

## 8. Out of scope (v1)

- Custom email copy per agent (templates are fixed; agent identity is injected)
- SMS follow-ups
- Auto-emailing the report to the seller / server-side PDF generation
- Follow-up analytics (open/click tracking)
