# 0002. Server code runs in Supabase Edge Functions; the daily job on Supabase Cron

| | |
| --- | --- |
| **Status** | Proposed. Needs the owner’s yes (handbook decisions O3 and O5 are open) |
| **Written** | 27 Nov 2026, with the architecture baseline (#114) |
| **Work** | #120, #121, #122 |

## Context

Three pieces of server code exist: the inbox ingest, the insights refresh and the calendar feed. They are Vercel Functions under `api/`, with a Vercel Cron entry. The handbook's Functions blueprint names this as the pattern to move away from, and gives the steps.

#52 changes all three: the parser reads flight segments (#83), the feed sends timed events (#85), the insights job gains five types (#91). Production has not been deployed since April 2026, so nothing live depends on the current addresses.

## Decision

Move each function to a Supabase Edge Function before its story changes it. The calendar feed goes first, as the tracer that settles how shared code is imported and how functions deploy. The daily job is scheduled with Supabase Cron, in a migration. The feed keeps an address on the site's own domain through a Netlify proxy rule.

## Runner-up

Keep Vercel until #52 ships, then move. Rejected: every function would be changed twice, and the stale production deploy would have to be repaired first to ship anything.

## Consequences

- One runtime for server code, next to the data, with secrets in one place.
- Handlers run under Vitest in Node; only the thin `index.ts` files are excluded from coverage.
- The functions no longer depend on the web host. Moving the site does not move the backend.
- Three stories in #52 wait for a function to move. The ledger does not.

## Reopen when

The proxy rule cannot keep the feed private and uncached, or a hibernating free-tier project cannot serve a calendar app reliably. Then the feed becomes a Netlify Function, which the handbook allows for an address people subscribe to.
