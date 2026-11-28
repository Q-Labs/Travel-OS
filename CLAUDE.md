# Travel OS — Claude Code Guide

## Project layout

```
apps/web/
  src/
    app/         — AppContext (all global state + useApp), router, routes (loaders), main
    components/  — atomic design; a level may import from its own level or below, never above
                   (enforced by components/layers.test.ts).
                   Anything Cobalt (@q-labs/cobalt) already provides is imported, not rebuilt.
                   atoms/       Icon, CatPip, SourceChip, StageDot, VendorMark
                   molecules/   Avatars, BudgetConversion, CategoryPips, DestinationBlurb, DocumentCard,
                                EmptyState, ParsedCard, ProgressRow, TripStat
                   organisms/   TripCard, KanbanBoard, YearRibbon, MetricsStrip, InsightsStrip, Sidebar,
                                Topbar, InboxRow, BookingsPanel, SplitBudget, TripDetailContent,
                                AddTripModal, IntegrationsModal, TweaksPanel
                   templates/   AuthLayout (signed-out frame); the signed-in frame is Cobalt's DashboardLayout
                   pages/       one per route: Pipeline, Inbox, Calendar, Archive, TripDetail,
                                Login, plus AppLayout
    lib/         — types.ts, data.ts (fixtures), db.ts (Supabase CRUD + Realtime),
                   trips.ts (pure trip selectors), supabase.ts (client), utils.ts,
                   flags.ts (feature flags: VITE_FLAG_*, off unless "true")
api/             — Vercel serverless functions. These must live at the repo root:
                   that is where Vercel discovers them, so they cannot move
                   under apps/web/ even though they import from it.
  inbox/ingest.ts    — POST /api/inbox/ingest; Claude Haiku email parsing
  insights/refresh.ts — daily cron; regenerates insights
  calendar/feed.ts   — read-only iCal feed
docs/
  architecture.md    — the system as built; updated in the same PR as the code it describes
  architecture/      — one target document per epic that changes data, server code or hosting
  decisions/         — one short record per architecture decision
```

All state lives in `AppContext`; mutations flow `useApp()` action → `lib/db.ts` → Supabase.
Components read via `useApp()` and never hold trip data locally. Only organisms and pages
call `useApp()`; atoms, molecules and templates take everything as props. New UI goes in the
lowest level that fits. Root `vite.config.ts`
configures both the build and the Vitest runner. Requires Node ≥ 24 (see `package.json`).

## Commands

```bash
npm test                       # vitest run: the fast loop, no coverage
npm run test:coverage          # vitest run --coverage: the gate, must stay at 100% (see Coverage)
npm run typecheck              # tsc --noEmit over tsconfig.app.json
npm run test:watch             # vitest in watch mode
npm test -- trips              # run a single file/suite by name filter
npm test -- -t "non-archived"  # run tests matching a title
npm run test:e2e               # Playwright (Chromium) integration + visual specs
npm run test:e2e:ui            # Playwright interactive UI mode
npm run dev                    # vite dev server (http://localhost:5173)
npm run build                  # tsc -b + vite build
npm run lint                   # eslint apps/web/src: zero warnings, JSDoc on every export
```

Two husky hooks gate the work. **`.husky/pre-commit` runs `lint-staged`**, which lints and fixes
the staged files under `apps/web/src`. **`.husky/pre-push` runs `npm run typecheck && npm run test:coverage`**
— the push is rejected if either fails. Push-time gates (not commit-time) let the red commit of a
red → green → refactor cycle be committed locally. CI also runs lint and build on every push.

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

Vitest 5 counts more than Vitest 2 did: the implicit `else` of an `if` with no `else`, and a callback nobody calls, are each uncovered. Test them (an unchanged value, an empty result, a callback the test invokes) before reaching for a hint. When a hint is right, put it on its own line before the statement (`/* v8 ignore next */`, `/* v8 ignore if */` or `/* v8 ignore else */`); a hint placed inside an expression, such as in the middle of a ternary, is ignored.

Coverage is measured only over `app/`, `components/`, `lib/`, and `api/`, but `vite.config.ts` **excludes** several files from the requirement: `lib/types.ts`, `lib/data.ts`, `lib/utils.ts`, `lib/supabase.ts`, and `app/AppContext.tsx`. New behaviour added to those files is not counted — but everything else (including `lib/trips.ts`, `lib/db.ts`, and `api/inbox/ingest.ts`) must be fully covered. Before adding to the exclude list, prefer testing the code.

## Issues and PRs

Every piece of work must be tracked:

1. **Open an issue first** — if no issue exists for the task, create one before writing any code. The issue is the canonical description of the work. Use the Feature, Bug or Task form in `.github/ISSUE_TEMPLATE/`.
2. **Reference the issue in every commit** — use `type(#N): description` format (e.g. `feat(#7): add AddTripModal wizard`).
3. **Close the issue on merge** — add `Closes #N` to the PR description body so GitHub automatically closes the issue when the PR merges. Never leave an implemented issue open. The PR description follows `.github/pull_request_template.md`.
4. **Verify at runtime** — before opening the PR, run the change as `.claude/skills/verify/SKILL.md` describes and say what you saw under Verification.

## Responding to PR review comments

When addressing feedback on a pull request:

1. **Reply to the comment** — briefly explain what was changed and why.
2. **React with an emoji** — 👍 if the feedback was correct/helpful, 👎 if it was incorrect or not applicable (with a short explanation).
3. **Resolve the conversation** — mark the thread as resolved once the fix is pushed.

## Conventions

- TypeScript strict mode — no `any`, no non-null assertions without a comment
- React functional components only; all state via `useApp()` from `AppContext`
- UI is built on the **Cobalt design system** (`@q-labs/cobalt`): use its components before writing your own (`components/cobalt-usage.test.ts` guards this) and its tokens for colour, type, radius and shadow. `styles.css` holds only app-specific layout; its legacy names (`--accent`, `--ink`, `--surface`, …) alias Cobalt tokens, so never add a new palette
- Code outside the MVP is behind a feature flag or removed. A flag is an exported `FLAG_*` constant in `lib/flags.ts`, read from `VITE_FLAG_<NAME>` and off unless it is exactly `true`; components import it and never read `VITE_FLAG_*` themselves. Keep each flag's comparison inline in its own constant (no helper, no object), or the bundler cannot drop the code behind an off flag. Name the owning issue in a comment, and delete the flag when its feature ships or is cut
- Every export under `apps/web/src` has a JSDoc comment saying what it does and, when it is not obvious, why. No types in it: TypeScript owns them. `npm run lint` fails on a missing one (`eslint-plugin-jsdoc`, handbook D27). Tests and stories are exempt. `@param` and `@returns` tags are not required, because for a component with destructured props they only repeat the type, but a tag you do write needs a description
- No new dependencies without discussion (`@q-labs/cobalt` is the agreed design-system dependency; installing it needs a `read:packages` token, see README)
- Commit messages: `type(#issue): short description` (e.g. `feat(#7): add AddTripModal wizard`)

## README

Keep `README.md` current. When a plan includes any of the following, update the README as part of the same PR:

- New user-facing features or removed features
- Changes to setup steps, environment variables, or scripts
- Changes to the architecture or project layout
- New dependencies added after discussion
