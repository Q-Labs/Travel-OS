# 0003. Host on Netlify, built by GitHub Actions; previews run on fixtures

| | |
| --- | --- |
| **Status** | Proposed. Needs the owner’s yes (handbook decisions D1 and D21 are proposed) |
| **Written** | 27 Nov 2026, with the architecture baseline (#114) |
| **Work** | #60, #119, #123, #124 |

## Context

The handbook has one host: Netlify, uploaded prebuilt from GitHub Actions, so tests gate every deploy and a rollback is a re-run with an older tag. Travel OS is one of two repositories still on Vercel.

The handbook builds previews with the same public values as production, so a preview reads the production database. Migrations run on release. A pull request that adds a table would therefore have a preview that cannot load the feature it exists to show.

## Decision

Follow the handbook for hosting and releases. Depart from it in one place: a preview is built in **demo mode**. It runs on the bundled fixtures through an in-memory data adapter, creates no Supabase client, writes nothing, and always shows a "Demo data" label. The Playwright suite runs the same build. The release workflow refuses to ship a build with the demo flag set.

## Runner-up

A second Supabase project for previews, migrated by CI on each pull request. Rejected for now: it costs a project slot or a paid plan, and holds a second copy of the schema to keep in step.

## Consequences

- A reviewer can open any preview with no account and see every screen with data.
- A preview can never read or change real data.
- End-to-end tests run against the built app, as the handbook asks, without the dev-only sign-in bypass.
- The fixtures become something the app depends on: each data story extends them.
- Previews do not exercise the real database or policies. The migrations job and the unit tests on the Supabase adapter cover that instead.
- This is a deviation from the handbook and is listed as one in `CLAUDE.md` when #119 lands.

## Reopen when

A bug reaches production that a preview on real data would have caught. Then add the preview database.
