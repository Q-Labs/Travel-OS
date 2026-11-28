# Travel OS — Copilot Instructions

## Stack

React 18 + TypeScript, Vite, React Router v6, Vitest + Testing Library, v8 coverage.

## TDD — red → green → refactor

**Follow this cycle for every change, no exceptions.**

1. **Red** — write a failing test first. Run `npm test` and confirm the failure before touching implementation code.
2. **Green** — write the smallest implementation that makes the test pass.
3. **Refactor** — remove duplication and improve clarity while all tests stay green.

Never suggest implementation code without a corresponding test written beforehand.

## Coverage requirement

100% branch coverage is enforced. `npm run test:coverage` will fail if any metric drops below 100%. Annotate genuinely untestable branches with `/* v8 ignore next */` and explain why in a comment.

## Issues and PRs

- **Open an issue for every task** — if no GitHub issue exists, create one before writing code.
- **Reference the issue in every commit** — format: `type(#N): description`.
- **Close the issue on merge** — include `Closes #N` in the PR description body so GitHub closes the issue automatically when the PR merges.

## Responding to PR review comments

When addressing feedback on a pull request:

1. **Reply to the comment** — briefly explain what was changed and why.
2. **React with an emoji** — 👍 if the feedback was correct/helpful, 👎 if it was incorrect or not applicable (with a short explanation).
3. **Resolve the conversation** — mark the thread as resolved once the fix is pushed.

## Project conventions

- All global state via `useApp()` — do not introduce local state for data that belongs in `AppContext`
- Styles via CSS variables in `styles.css` — no inline colours or hardcoded pixel values outside the design token set
- Commit format: `type(#issue): description` (e.g. `fix(#5): correct booking status toggle`)
- No new `npm` packages without discussion

## README

Keep `README.md` current. When a suggestion or change involves any of the following, include a README update in the same PR:

- New or removed user-facing features
- Changes to setup, environment variables, or npm scripts
- Architectural changes or project layout shifts
- New packages added after discussion
