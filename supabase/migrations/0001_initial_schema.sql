-- ─────────────────────────────────────────────────────────────────────────────
-- OCD Workbook — v1 schema
--
-- Design notes
--   * All PKs are client-generated UUIDs. The app is a PWA and exposure logging
--     MUST work offline (people run exposures in bathrooms, kitchens, stores).
--     Client-side IDs mean an offline write never collides on sync.
--   * updated_at + deleted_at everywhere: last-write-wins sync, soft deletes.
--   * `trigger` is the spine. The avoidance inventory creates one, the fear
--     ladder ranks it, exposure sessions reference it, compulsion events
--     attribute reclaimed time to it, and graduation retires it.
--   * Derived numbers (session number, habituation curve, time reclaimed) are
--     VIEWS, never stored columns — offline writes arrive out of order.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ─── enums ───────────────────────────────────────────────────────────────────

create type ocd_subtype as enum (
  'contamination', 'checking', 'symmetry', 'harm', 'perfection', 'magical_thinking'
);

-- The routing decision that actually matters for v1: v1's engine handles
-- behavioral compulsions. Mental-only compulsions (rumination, mental review,
-- silent prayer/counting) need imaginal exposure, which is v2.
create type compulsion_form as enum ('behavioral', 'mental');

create type trigger_category as enum (
  'place', 'person_or_animal', 'object', 'situation', 'thought_or_image'
);

create type trigger_status as enum (
  'identified',   -- surfaced by the avoidance inventory
  'laddered',     -- ranked on the fear ladder
  'in_progress',  -- actively being exposed to
  'graduated',    -- peak anxiety held at <= 2; retired
  'paused',
  'relapsed'      -- lapses are normal and expected; graduation is not permanent
);

create type exposure_kind as enum ('in_vivo', 'uncertainty_starter', 'imaginal');

-- ─── helpers ─────────────────────────────────────────────────────────────────

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── profile ─────────────────────────────────────────────────────────────────

create table profile (
  id                     uuid primary key references auth.users(id) on delete cascade,
  -- "Name Your OCD" (externalisation). Nullable — the exercise is optional.
  ocd_name               text,
  ocd_metaphor           text,
  -- Set from the screener; drives whether we can serve this person in v1.
  primary_compulsion_form compulsion_form,
  onboarded_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ─── screening ───────────────────────────────────────────────────────────────
-- Retaken over time, so this is a log, not a singleton. Re-screening is itself
-- an outcome measure.

create table screening (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  taken_at      timestamptz not null default now(),
  -- item-level answers kept raw so we can re-score without losing history
  responses     jsonb not null default '{}'::jsonb,
  subtype_scores jsonb not null default '{}'::jsonb,
  compulsion_form compulsion_form,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- ─── values & commitments ────────────────────────────────────────────────────

create table value (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  why_it_matters text,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table commitment (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  statement  text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ─── trigger: the spine ──────────────────────────────────────────────────────

create table trigger (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  label            text not null,
  category         trigger_category,
  subtype          ocd_subtype,
  -- 1–10 rating captured when the trigger was first surfaced (avoidance chart)
  baseline_anxiety smallint check (baseline_anxiety between 1 and 10),
  -- position on the fear ladder; null until laddered
  ladder_rank      smallint,
  status           trigger_status not null default 'identified',
  -- "overcome fear of X *so that I can* Y" — the motivation shown at bail-out
  goal_statement   text,
  graduated_at     timestamptz,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index on trigger (user_id, status);
-- Deliberately NOT unique. Reordering a ladder swaps ranks between rows, which
-- transiently duplicates a value; a partial unique index cannot be deferred in
-- Postgres, so the sync upsert would fail mid-reorder. Ordering is enforced in
-- application code, with created_at breaking any tie.
create index on trigger (user_id, ladder_rank) where ladder_rank is not null;

-- Status history. A graduated fear can come back; we keep the arc rather than
-- overwriting it, because the relapse-prevention work depends on seeing it.
create table trigger_status_event (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  trigger_id  uuid not null references trigger(id) on delete cascade,
  from_status trigger_status,
  to_status   trigger_status not null,
  occurred_at timestamptz not null default now(),
  note        text
);

-- ─── obsessions & compulsions ────────────────────────────────────────────────

create table obsession (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  trigger_id uuid references trigger(id) on delete set null,
  -- SENSITIVE: intrusive thought content. See privacy note in README.
  content    text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table compulsion (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  trigger_id  uuid references trigger(id) on delete set null,
  label       text not null,
  form        compulsion_form not null default 'behavioral',
  -- baselines captured before intervention; the denominator for "time reclaimed"
  baseline_duration_seconds  integer check (baseline_duration_seconds >= 0),
  baseline_frequency_per_day numeric(6,2) check (baseline_frequency_per_day >= 0),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ─── cycle log ───────────────────────────────────────────────────────────────
-- The onboarding diary. Teaches the trigger/obsession/compulsion vocabulary the
-- rest of the app assumes. Text columns exist alongside FKs because early
-- entries are freeform — people don't have a trigger library yet on day one.

create table cycle_log (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  occurred_at    timestamptz not null default now(),
  trigger_id     uuid references trigger(id) on delete set null,
  trigger_text   text,
  obsession_text text,
  compulsion_id  uuid references compulsion(id) on delete set null,
  compulsion_text text,
  emotions       text[] not null default '{}',
  sensations     text[] not null default '{}',
  anxiety        smallint check (anxiety between 1 and 10),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create index on cycle_log (user_id, occurred_at desc);

-- ─── exposure ────────────────────────────────────────────────────────────────

-- Global seed catalogue of starter/uncertainty exposures. No user_id: this is
-- content, readable by all authenticated users, writable by nobody.
create table exposure_prompt (
  id           uuid primary key default gen_random_uuid(),
  text         text not null,
  category     text,
  difficulty   smallint check (difficulty between 1 and 10),
  subtype_tags ocd_subtype[] not null default '{}',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table exposure_session (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  trigger_id   uuid references trigger(id) on delete cascade,
  prompt_id    uuid references exposure_prompt(id) on delete set null,
  kind         exposure_kind not null default 'in_vivo',

  planned_for  timestamptz,
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,

  -- Expectancy violation. Modern ERP holds that the active ingredient is not
  -- anxiety decaying but a prediction being disconfirmed: you expect something
  -- specific, it does not happen, and the belief updates. Captured BEFORE the
  -- exposure so it cannot be revised afterwards into something less wrong.
  predicted_anxiety smallint check (predicted_anxiety between 1 and 10),
  predicted_outcome text,
  actual_outcome    text,

  anxiety_before smallint check (anxiety_before between 1 and 10),
  anxiety_peak   smallint check (anxiety_peak   between 1 and 10),
  anxiety_after  smallint check (anxiety_after  between 1 and 10),

  -- the response-prevention half of ERP
  compulsion_id      uuid references compulsion(id) on delete set null,
  response_prevented boolean,

  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint exposure_session_needs_a_target
    check (trigger_id is not null or prompt_id is not null)
);

create index on exposure_session (user_id, trigger_id, started_at);

-- ─── compulsion events ───────────────────────────────────────────────────────
-- One table unifies the book's three separate exercises: slowing a compulsion
-- down, delaying it, and shortening it. Each is an optional dimension here.

create table compulsion_event (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  compulsion_id uuid not null references compulsion(id) on delete cascade,
  trigger_id    uuid references trigger(id) on delete set null,
  occurred_at   timestamptz not null default now(),

  urge_intensity smallint check (urge_intensity between 1 and 10),

  -- delay ("reschedule your reassurance compulsions")
  delay_target_seconds   integer check (delay_target_seconds   >= 0),
  delay_achieved_seconds integer check (delay_achieved_seconds >= 0),

  -- shorten ("curb your compulsions")
  duration_seconds integer check (duration_seconds >= 0),
  -- snapshot of the baseline at the time, so historical savings stay correct
  -- even if the compulsion's baseline is later re-measured
  baseline_duration_seconds integer check (baseline_duration_seconds >= 0),

  -- slow down ("put the brakes on")
  mindful_slowdown boolean not null default false,

  -- resisted entirely
  resisted   boolean not null default false,

  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index on compulsion_event (user_id, occurred_at desc);

-- ─── reclaimed actions (the values ledger) ───────────────────────────────────
-- Not "tasks completed" — life got back. This is a primary reward surface.

create table reclaimed_action (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  occurred_at         timestamptz not null default now(),
  description         text not null,
  trigger_id          uuid references trigger(id) on delete set null,
  exposure_session_id uuid references exposure_session(id) on delete set null,
  -- An array rather than a join table: it matches the local IndexedDB shape
  -- exactly, so sync stays a straight row copy with no special cases.
  value_ids           uuid[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

create index on reclaimed_action using gin (value_ids);

-- ─── usage signals ───────────────────────────────────────────────────────────
-- Deliberately here from day one. For this product high engagement is a SAFETY
-- ALARM, not a success metric: repeated re-opening/re-editing of the same entry
-- is a reassurance-seeking pattern and should trigger a soft interrupt.

create table usage_event (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  event_type  text not null,          -- 'view' | 'edit' | 'session_start' | ...
  entity_type text,
  entity_id   uuid,
  metadata    jsonb not null default '{}'::jsonb
);

create index on usage_event (user_id, occurred_at desc);
create index on usage_event (user_id, entity_type, entity_id, occurred_at desc);

-- ─── updated_at triggers ─────────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'profile','screening','value','commitment','trigger','obsession','compulsion',
    'cycle_log','exposure_session','compulsion_event','reclaimed_action'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on %I
       for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- ─── views: the dashboard ────────────────────────────────────────────────────

-- The hero visual. Session number is derived, never stored, because offline
-- sessions sync out of order.
create view v_habituation_curve as
select
  es.user_id,
  es.trigger_id,
  t.label as trigger_label,
  es.id as exposure_session_id,
  es.started_at,
  row_number() over (
    partition by es.trigger_id order by es.started_at
  ) as session_number,
  es.anxiety_before,
  es.anxiety_peak,
  es.anxiety_after,
  es.response_prevented
from exposure_session es
join trigger t on t.id = es.trigger_id
where es.deleted_at is null
  and t.deleted_at is null
  and es.anxiety_peak is not null;

-- Graduation rule: three consecutive sessions with peak anxiety <= 2.
-- "Boredom is the opposite of anxiety and is therefore your friend."
create view v_graduation_candidate as
with ranked as (
  select
    user_id, trigger_id, trigger_label, session_number, anxiety_peak,
    max(session_number) over (partition by trigger_id) as total_sessions
  from v_habituation_curve
)
select user_id, trigger_id, trigger_label, total_sessions
from ranked
where session_number > total_sessions - 3
group by user_id, trigger_id, trigger_label, total_sessions
having count(*) = 3 and max(anxiety_peak) <= 2;

-- Time reclaimed. Moves immediately, unlike the habituation curve — which is
-- why this leads the dashboard in weeks 1–2, when anxiety often rises first.
create view v_time_reclaimed as
select
  user_id,
  date_trunc('week', occurred_at) as week,
  sum(
    greatest(
      coalesce(baseline_duration_seconds, 0)
        - case when resisted then 0 else coalesce(duration_seconds, 0) end,
      0
    )
  ) as seconds_reclaimed,
  count(*) filter (where resisted) as compulsions_resisted,
  count(*) as events
from compulsion_event
where deleted_at is null
group by user_id, date_trunc('week', occurred_at);

-- ─── row level security ──────────────────────────────────────────────────────

alter table profile              enable row level security;
alter table screening            enable row level security;
alter table value                enable row level security;
alter table commitment           enable row level security;
alter table trigger              enable row level security;
alter table trigger_status_event enable row level security;
alter table obsession            enable row level security;
alter table compulsion           enable row level security;
alter table cycle_log            enable row level security;
alter table exposure_session     enable row level security;
alter table compulsion_event     enable row level security;
alter table reclaimed_action     enable row level security;
alter table usage_event          enable row level security;
alter table exposure_prompt      enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'profile','screening','value','commitment','trigger','trigger_status_event',
    'obsession','compulsion','cycle_log','exposure_session','compulsion_event',
    'reclaimed_action','usage_event'
  ] loop
    execute format(
      'create policy %I_owner on %I for all
         using (%s = (select auth.uid()))
         with check (%s = (select auth.uid()))',
      t, t,
      case when t = 'profile' then 'id' else 'user_id' end,
      case when t = 'profile' then 'id' else 'user_id' end
    );
  end loop;
end $$;

-- content catalogue: readable by any signed-in user, written only by service role
create policy exposure_prompt_read on exposure_prompt for select
  to authenticated using (is_active);
