<!--
  Fill in every section. Delete one only by writing "N/A - <reason>" in its place.
  Reviewers look for the linked issue and for evidence the change works at runtime.
-->

## Summary

<!-- What does this PR do, and why? 1-3 sentences. -->

## Related issues

- Closes #
- Part of #

- [ ] This PR fully resolves the issue(s) under **Closes** (they auto-close on merge)
- [ ] OR it is partial work and the tracking issue stays open (**Part of**)

## Changes

<!-- Bullet the notable changes: modules, behaviour, migrations, removals. Flag anything that needs a close look. -->

-

## Screenshots / recordings *(required for user-facing changes)*

<!--
  Show it working, not just building. For a UI change, before/after screenshots or a recording.
  Pure logic with no UI surface: write "No UI surface - <why>" and link the evidence instead.
-->

## Verification

<!-- How you confirmed it works at RUNTIME, not just that CI is green. What did you drive in the running app, and what did you see? -->

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test:coverage` (100% floor on every metric)
- [ ] `npm run build`
- [ ] Drove the change in the running app and saw the expected behaviour (describe above)

## Checklist

- [ ] Tests were written first (red -> green -> refactor)
- [ ] Linked the issue(s) above with `Closes` / `Part of`
- [ ] Version bumped (`npm version <patch|minor|major> --no-git-tag-version`) if this is a user-facing change to a deployed app
- [ ] Schema change? The migration is in this PR, only adds things, and every new table has row-level security on
- [ ] UI change? Reviewed against the Front-End Checklist; Critical and High findings fixed (say what was reviewed under Verification)
- [ ] No secret, token or private URL is in the diff
- [ ] Out-of-scope discoveries were filed as issues, not implemented here
- [ ] `README.md` / `docs/architecture.md` updated where behaviour, structure or setup changed
- [ ] PR title follows conventional commits (for example `feat(scope): ...`)
