-- ─────────────────────────────────────────────────────────────────────────────
-- Security fix. 0001 has been corrected so fresh environments never have this
-- problem; this migration repairs any environment where 0001 was already
-- applied in its original form.
--
-- What was wrong: Postgres views run with the permissions of their CREATOR by
-- default, which bypasses row level security on the underlying tables. Supabase
-- also grants anon and authenticated full privileges on new objects in public.
-- The combination meant anyone holding the public anon key — which ships in the
-- client bundle by design — could read every user's trigger labels and distress
-- ratings. Caught by the Supabase security advisor immediately after apply.
-- ─────────────────────────────────────────────────────────────────────────────

alter view v_habituation_curve    set (security_invoker = true);
alter view v_graduation_candidate set (security_invoker = true);
alter view v_time_reclaimed       set (security_invoker = true);

-- Nothing writes through these; they are read models.
revoke insert, update, delete, truncate, references, trigger
  on v_habituation_curve, v_graduation_candidate, v_time_reclaimed
  from anon, authenticated;

-- anon has no legitimate read either — every view is per-user data.
revoke select on v_habituation_curve, v_graduation_candidate, v_time_reclaimed
  from anon;

create or replace function set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
