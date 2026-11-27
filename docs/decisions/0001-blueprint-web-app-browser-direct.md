# 0001. Stay on the Web app blueprint: the browser talks to Supabase, policies decide

| | |
| --- | --- |
| **Status** | In place. Recorded so the reason is written down |
| **Written** | 27 Nov 2026, with the architecture baseline (#114) |
| **Work** | #52 |

## Context

The Engineering Handbook has two ways to reach data. In the Web app blueprint the browser uses `supabase-js` and row-level security decides what each user sees. In the Full-stack blueprint only a server touches the database. The handbook says to use the first unless a rule cannot be written safely as a policy.

Travel OS is built the first way. #52 adds seven tables. Travelers are records inside one account, not accounts of their own.

## Decision

Stay browser-direct. Every table in #52 gets the same single policy the six existing tables have: the owner may do everything, keyed on `auth.uid()`.

## Runner-up

Move to the Full-stack blueprint (server functions, Drizzle, the Data API switched off). Rejected: no rule in #52 needs more than "the owner sees their own rows", and the move would be a rewrite of the data layer and the host for no user-visible gain.

## Consequences

- No server is needed for the ledger, border readiness or disruption mode.
- The browser cannot run a transaction across tables. That shapes [0004](0004-tables-for-new-data-one-action-one-row.md).
- One mistake in one policy would expose a table. Every new table copies the existing policy, and the migrations job proves the files apply.

## Reopen when

Rows are shared between accounts. Households (#111) is the likely trigger: sharing a trip with another account needs policies that are harder to get right, and the handbook names that as a reason to go server-only.
