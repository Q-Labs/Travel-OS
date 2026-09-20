-- Upgrade path for the insights reconciliation columns.
--
-- The initial schema file creates `public.insights` with `create table if not
-- exists`, which means an installation that ran it before these columns were
-- added skips the whole definition and never gains them. The client filters on
-- `dismissed_at` and the cron writes `generated`, so on such a database both
-- would fail: insights would silently read back empty, and the nightly refresh
-- would error for every user.
--
-- Adding them here as idempotent ALTERs covers the upgrade, and is a no-op on a
-- fresh install where the initial schema already declared them.

alter table public.insights
  add column if not exists generated boolean not null default false;

alter table public.insights
  add column if not exists dismissed_at timestamptz;

-- Same reasoning for the stale-stage timestamp: `created_days_ago` and
-- `days_in_stage` are fixture-only conveniences that nothing ever persists, so
-- stale-trip insights could never fire for a stored trip.
alter table public.trips
  add column if not exists stage_changed_at timestamptz not null default now();
