-- ─────────────────────────────────────────────────────────────────────────────
-- Give every synced table the timestamp columns the sync engine assumes.
--
-- `trigger_status_event` and `usage_event` were written as append-only logs
-- with only occurred_at, but the sync engine pulls with
-- `.gt('updated_at', cursor)` and pushes the local model's created_at /
-- updated_at. Against those two tables that is a query on a column that does
-- not exist, so the pull failed outright and the push would have failed as soon
-- as anything wrote a usage event.
--
-- This is the second instance of the same class of bug — hand-written schema
-- drifting from what the sync layer assumes — so the fix is uniformity rather
-- than another special case. Every synced table now looks the same to sync.
-- ─────────────────────────────────────────────────────────────────────────────

alter table trigger_status_event
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

alter table usage_event
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create trigger trigger_status_event_set_updated_at
  before update on trigger_status_event
  for each row execute function set_updated_at();

create trigger usage_event_set_updated_at
  before update on usage_event
  for each row execute function set_updated_at();

-- Pull filters on updated_at, so it needs to be indexed alongside the owner.
create index if not exists trigger_status_event_user_updated
  on trigger_status_event (user_id, updated_at);
create index if not exists usage_event_user_updated
  on usage_event (user_id, updated_at);
