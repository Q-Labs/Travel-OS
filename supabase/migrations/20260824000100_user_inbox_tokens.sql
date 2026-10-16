-- Routing tokens for the forwarding inbox.
--
-- An inbound-email webhook knows only the address the mail was sent to, never a
-- Supabase user id. Each user gets an unguessable token used as a plus-tag —
-- mail to `anything+<token>@yourdomain` is attributed to that user.
--
-- The same token addresses the read-only calendar feed, so it must stay secret:
-- it is never exposed to the anon client except for the owner's own row.

create table if not exists public.user_inbox_tokens (
  token      text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.user_inbox_tokens enable row level security;

drop policy if exists user_inbox_tokens_owner on public.user_inbox_tokens;
create policy user_inbox_tokens_owner on public.user_inbox_tokens
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Token generator.
--
-- Deliberately uses gen_random_uuid(), which is core Postgres (13+), rather than
-- pgcrypto's gen_random_bytes(). pgcrypto lives in the `extensions` schema on
-- Supabase, so a security-definer function pinned to `search_path = public`
-- cannot see it -- and because this runs in an AFTER INSERT trigger on
-- auth.users, that failure would abort every signup.
create or replace function public.new_inbox_token()
returns text
language sql
volatile  -- MUST NOT be immutable: it wraps gen_random_uuid(), and marking it
          -- immutable lets the planner fold one value into the backfill,
          -- handing every user the same token.
as $$
  select replace(gen_random_uuid()::text, '-', '');
$$;

-- Hand out a token the first time a user signs in.
create or replace function public.ensure_inbox_token()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_inbox_tokens (token, user_id)
  values (public.new_inbox_token(), new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_inbox_token on auth.users;
create trigger on_auth_user_created_inbox_token
  after insert on auth.users
  for each row execute function public.ensure_inbox_token();

-- Backfill: the trigger only fires for new signups, so without this every
-- account that existed before this migration would have no token, leaving the
-- calendar feed and forwarding inbox permanently unreachable for them.
insert into public.user_inbox_tokens (token, user_id)
select public.new_inbox_token(), u.id
from auth.users u
on conflict (user_id) do nothing;
