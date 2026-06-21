# Travel OS — Claude Code Guide

## Project layout

```
apps/web/
  src/
    app/         — AppContext (all global state + useApp), router, routes, Login, main
    components/  — PipelineDashboard, InboxDashboard, CalendarDashboard, ArchiveDashboard,
                   TripCard, TweaksPanel, modals/ (AddTripModal, IntegrationsModal), …
    lib/         — types.ts, data.ts (fixtures), db.ts (Supabase CRUD + Realtime),
                   trips.ts (pure trip selectors), supabase.ts (client), utils.ts
  api/inbox/ingest.ts — POST /api/inbox/ingest, Vercel function; Claude Haiku email parsing
```

All state lives in `AppContext`; mutations flow `useApp()` action → `lib/db.ts` → Supabase.
Components read via `useApp()` and never hold trip data locally. Root `vite.config.ts`
configures both the build and the Vitest runner. Requires Node ≥ 24 (see `package.json`).

## Commands

```bash
npm test                       # vitest run --coverage (must stay at 100%, see Coverage)
npm run test:watch             # vitest in watch mode
npm test -- trips              # run a single file/suite by name filter
npm test -- -t "archives a trip"  # run tests matching a title
npm run test:e2e               # Playwright (Chromium) integration + visual specs
npm run test:e2e:ui            # Playwright interactive UI mode
npm run dev                    # vite dev server (http://localhost:5173)
npm run build                  # tsc -b + vite build
npm run lint                   # eslint apps/web/src
```

A husky **pre-commit hook runs `npm run lint && npm test && npm run build`** — commits
fail if any of the three fail, so expect lint/coverage/typecheck to gate every commit.

### End-to-end tests

Playwright lives in `e2e/` (integration + visual snapshots). Install the browser once with
`npx playwright install chromium`. The Playwright `webServer` injects `VITE_E2E_BYPASS_AUTH=true`
so specs reach routes without Supabase creds; it is gated by `import.meta.env.DEV` and
dead-code-eliminated from production builds. After an intentional UI change, regenerate
baselines with `npx playwright test --update-snapshots e2e/visual/` and commit the PNGs.

## TDD — red → green → refactor

**Every feature or bug fix must follow this cycle, no exceptions.**

1. **Red** — write a failing test that describes the new behaviour. Run `npm test` and confirm it fails for the right reason before writing any implementation code.
2. **Green** — write the minimal code that makes the test pass. Do not add anything beyond what the test requires.
3. **Refactor** — clean up duplication, naming, and structure while keeping all tests green.

Never ship implementation code that isn't covered by a test written in the red phase first.

## Coverage

The project enforces **100% of all four metrics** (statements, branches, functions, lines) via Vitest v8. A push that drops any metric below 100% will fail CI. If a branch is genuinely untestable (defensive guard, environment-specific path), annotate it with `/* v8 ignore next */` and add a comment explaining why.

Coverage is measured only over `app/`, `components/`, `lib/`, and `api/`, but `vite.config.ts` **excludes** several files from the requirement: `lib/types.ts`, `lib/data.ts`, `lib/utils.ts`, `lib/supabase.ts`, and `app/AppContext.tsx`. New behaviour added to those files is not counted — but everything else (including `lib/trips.ts`, `lib/db.ts`, and `api/inbox/ingest.ts`) must be fully covered. Before adding to the exclude list, prefer testing the code.

## Issues and PRs

Every piece of work must be tracked:

1. **Open an issue first** — if no issue exists for the task, create one before writing any code. The issue is the canonical description of the work.
2. **Reference the issue in every commit** — use `type(#N): description` format (e.g. `feat(#7): add AddTripModal wizard`).
3. **Close the issue on merge** — add `Closes #N` to the PR description body so GitHub automatically closes the issue when the PR merges. Never leave an implemented issue open.

## Responding to PR review comments

When addressing feedback on a pull request:

1. **Reply to the comment** — briefly explain what was changed and why.
2. **React with an emoji** — 👍 if the feedback was correct/helpful, 👎 if it was incorrect or not applicable (with a short explanation).
3. **Resolve the conversation** — mark the thread as resolved once the fix is pushed.

## Conventions

- TypeScript strict mode — no `any`, no non-null assertions without a comment
- React functional components only; all state via `useApp()` from `AppContext`
- CSS via `styles.css` using the existing CSS-variable design tokens (`--accent`, `--ink`, `--surface`, …)
- No new dependencies without discussion
- Commit messages: `type(#issue): short description` (e.g. `feat(#7): add AddTripModal wizard`)

## README

Keep `README.md` current. When a plan includes any of the following, update the README as part of the same PR:

- New user-facing features or removed features
- Changes to setup steps, environment variables, or scripts
- Changes to the architecture or project layout
- New dependencies added after discussion
