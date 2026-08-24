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

create policy user_inbox_tokens_owner on public.user_inbox_tokens
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Hand out a token the first time a user signs in.
create or replace function public.ensure_inbox_token()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_inbox_tokens (token, user_id)
  values (encode(gen_random_bytes(9), 'hex'), new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_inbox_token on auth.users;
create trigger on_auth_user_created_inbox_token
  after insert on auth.users
  for each row execute function public.ensure_inbox_token();
