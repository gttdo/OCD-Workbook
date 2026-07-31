# OCD Workbook

An interactive companion for structured OCD therapy homework. Mobile-first PWA,
offline-capable, built to be used between sessions.

## Why this exists

Paper therapy workbooks fail in two specific ways. They are **write-only** — you
log an exposure at anxiety 8, and nothing ever reads it back to you, even though
watching that number fall is the entire therapeutic mechanism. And they are
**linear** — a subtype screener on page one that nothing downstream uses.

This app closes the feedback loop and routes on what the screener actually found.

## Design constraints

These are deliberate and load-bearing. Please do not "improve" them without
reading the reasoning.

**No streaks. No completion percentages. No badges. No affirmation popups.**
For this population, standard engagement mechanics are symptom-shaped: streaks
become magical thinking ("if I break the chain something bad happens"),
completion bars become perfectionism, and congratulatory feedback becomes
reassurance-seeking — the exact behaviour the therapy works to extinguish. The
app can itself become the compulsion.

**What is rewarded instead:** the habituation curve (peak anxiety per trigger,
falling over sessions), time reclaimed from compulsions, a ledger of life got
back, and graduating a fear at peak anxiety ≤2 — a terminal celebration, not a
recurring one.

**High engagement is a safety alarm, not a success metric.** `usage_event`
exists from day one to detect over-use. Success looks like sessions getting
shorter and visits getting rarer. If someone is here 40 minutes a day six months
in, something has gone wrong.

**Never put breathing or grounding tools on the exposure screen.** Anxiety
reduction during an exposure is a safety behaviour; it blocks the habituation
the exposure exists to produce.

**The habituation curve often rises before it falls.** Never present an early
rise as failure. Time-reclaimed leads the dashboard in weeks 1–2 because it
moves immediately.

## Architecture

**IndexedDB is the source of truth. Supabase is a sync target.** Not the other
way round. Exposures happen in public bathrooms, hospital corridors and parking
garages; if the app cannot record a rating because there is no signal, it has
failed at the one moment it exists for.

Consequences: all primary keys are client-generated UUIDs, every record carries
`updatedAt` / `deletedAt` / `syncedAt`, deletes are soft (tombstones must reach
the server), and derived values — session number, habituation curve, time
reclaimed — are computed, never stored, because offline writes arrive out of
order.

```
src/
  db/         Dexie schema + domain types (mirrors the SQL migration)
  lib/        Supabase client, session, anxiety/graduation logic
  data/       Static content (screener item bank)
  components/ Shared UI — AnxietyScale is the most reused control in the app
  screens/    Route-level views
supabase/
  migrations/ Postgres schema, RLS, and dashboard views
```

## Getting started

```bash
npm install
npm run dev
```

The app runs fully without Supabase credentials — it degrades to "works, but
this device only". To enable sync, copy `.env.example` to `.env.local`, fill in
your project URL and anon key, and apply the migrations in
`supabase/migrations/` in order.

## Deploying

Two things bite here, and both have already cost an afternoon:

**Environment variables are baked in at build time.** Vite inlines
`import.meta.env` values into the bundle, so `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` must exist in the host's Production environment
*before the build runs*. Setting them afterwards changes nothing until a fresh
build happens — and a "Redeploy" that reuses the build cache will happily
republish the old bundle without them. Force a clean build, then confirm the
credentials actually landed:

```bash
curl -s https://<your-domain>/ | grep -o '/assets/index-[^"]*\.js'   # find the bundle
curl -s https://<your-domain>/assets/index-XXXX.js | grep -c 'supabase.co'
```

If that count is zero, the deployed app has no backend, and the UI will
correctly say backup is not set up.

**Client-side routing needs a rewrite.** Vercel's Vite preset does not add an
SPA fallback, so `/more`, `/signin` and `/reset` return 404 on a direct request
— including the `/reset` link sent by a password email. `vercel.json` handles
this. Vercel checks the filesystem before rewrites, so a plain catch-all is
safe and the service worker, manifest and icons still serve as themselves.

**Also required in Supabase:** add the deployed origin to Authentication → URL
Configuration → Redirect URLs, and replace the built-in email sender with real
SMTP before anyone else uses this — the built-in one is rate limited to a
handful of messages per hour and will silently fail on signups and resets.

## Content rights

The source workbook (*Overcoming Your OCD*, Margaret Auguste, © 2018 Between
Sessions Resources) is licensed for personal use but **not for redistribution**.
It is gitignored and must stay local.

The operating rule for this codebase: **replicate each exercise's clinical
function 1:1, write 100% of the prose ourselves.** The techniques belong to the
field — fear ladders and SUDS ratings are standard ERP, defusion is ACT, SMART
goals are Doran 1981. The author's specific expression is hers: her explanatory
passages, her vignettes and characters, her word lists, her exact question
wordings. Never paste book prose into a screen.

## Scope

v1 covers 9 of the book's 39 exercises, forming one closed loop:
**Orient → Map → Expose → See → Graduate.**

v1 serves behavioural compulsions — contamination, checking, symmetry,
perfectionism. Purely mental rituals (rumination, mental review, silent
counting or prayer) need imaginal exposure, which is v2. The screener says this
plainly rather than letting someone discover it three screens into a fear ladder
that will not fit them.

## Not a medical device

This is an adjunct to therapy, not treatment, and not a diagnostic tool.
