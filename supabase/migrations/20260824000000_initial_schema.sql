-- Travel OS base schema.
--
-- Trip, traveler, insight and inbox ids come from shared fixtures (e.g. 'tr-lisbon'),
-- so every table is keyed on (id, user_id) rather than id alone — two users can both
-- seed the same fixture id. That composite key is also what the client's
-- `onConflict: 'id,user_id'` upserts target.

create table if not exists public.travelers (
  id            text not null,
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  relationship  text not null,
  initials      text not null,
  created_at    timestamptz not null default now(),
  primary key (id, user_id)
);

create table if not exists public.trips (
  id               text not null,
  user_id          uuid not null references auth.users (id) on delete cascade,
  destination      text not null,
  region           text not null default '',
  country          text not null default '',
  stage            text not null check (stage in ('dreaming', 'planning', 'booked', 'upcoming', 'archived')),
  categories       text[] not null default '{}',
  start_date       date,
  end_date         date,
  date_approx      text,
  budget_total     numeric not null default 0,
  budget_spent     numeric not null default 0,
  budget_currency  text not null default 'USD',
  travelers        text[] not null default '{}',
  cover_hue        integer not null default 30,
  cover_label      text not null default '',
  notes            text not null default '',
  nights           integer not null default 0,
  created_days_ago integer,
  days_in_stage    integer,
  created_at       timestamptz not null default now(),
  primary key (id, user_id)
);

create table if not exists public.trip_details (
  trip_id          text not null,
  user_id          uuid not null references auth.users (id) on delete cascade,
  itinerary        jsonb not null default '[]',
  bookings         jsonb not null default '[]',
  budget_breakdown jsonb not null default '[]',
  packing          jsonb not null default '[]',
  documents        jsonb not null default '[]',
  splits           jsonb,
  created_at       timestamptz not null default now(),
  primary key (trip_id, user_id),
  foreign key (trip_id, user_id) references public.trips (id, user_id) on delete cascade
);

create table if not exists public.insights (
  id         text not null,
  user_id    uuid not null references auth.users (id) on delete cascade,
  trip_id    text not null,
  type       text not null check (type in ('stage_stale', 'price_drop', 'passport_expiry', 'packing_reminder', 'weather')),
  severity   text not null check (severity in ('info', 'warning', 'urgent')),
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now(),
  primary key (id, user_id)
);

create table if not exists public.inbox_items (
  id                   text not null,
  user_id              uuid not null references auth.users (id) on delete cascade,
  source               text not null default 'email',
  vendor               text,
  subject              text not null,
  from_address         text not null,
  received_ago         text not null,
  status               text not null check (status in ('parsed', 'parsing', 'needs_review', 'pending_trip')),
  parsed               jsonb,
  suggested_trip       text,
  suggested_confidence numeric,
  note                 text,
  created_at           timestamptz not null default now(),
  primary key (id, user_id)
);

-- The insights cron re-runs daily and rewrites the same deterministic ids.
create index if not exists insights_user_trip_idx on public.insights (user_id, trip_id);
create index if not exists inbox_items_user_idx on public.inbox_items (user_id);

-- ── Row-level security ───────────────────────────────────────────────────────
-- Every table is per-user. The anon/authenticated client may only ever see its
-- own rows; the service-role key used by the API functions bypasses these.

alter table public.travelers    enable row level security;
alter table public.trips        enable row level security;
alter table public.trip_details enable row level security;
alter table public.insights     enable row level security;
alter table public.inbox_items  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['travelers', 'trips', 'trip_details', 'insights', 'inbox_items'] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_owner', t
    );
  end loop;
end $$;

-- The inbox subscribes to Realtime so parsed emails appear without a refresh.
alter publication supabase_realtime add table public.inbox_items;
