# 0005. Every read and write returns a result; TanStack Query holds server data

| | |
| --- | --- |
| **Status** | Proposed. Needs the owner’s yes (a new dependency; handbook decision D3 is proposed) |
| **Written** | 27 Nov 2026, with the architecture baseline (#114) |
| **Work** | #118, #73 |

## Context

Every action in `AppContext` changes the screen first and sends the write without waiting. A failure is a console warning. A failed read returns an empty list. `AppContext.tsx` is excluded from the coverage requirement.

#73 promises that nothing shows as saved before the server confirms, that a failed save keeps what was typed, and that the same button retries. Every form in #52 relies on it.

## Decision

1. Every function in the data layer returns `{ ok: true, data }` or `{ ok: false, error: { code, message } }`. This is the handbook's rule for server code, applied to the browser's data layer.
2. The Supabase calls sit behind one **data port** with two adapters: Supabase, and in-memory for tests and demo mode.
3. Server data is read and written through **TanStack Query**, which the handbook proposes for web apps. It supplies the pending, failed and retry states the design needs.
4. `AppContext` keeps interface state only. Existing trip data moves across when a story next touches it.
5. The router stays React Router 6, as the handbook says for this repository.

## Runner-up

Keep everything in `AppContext` and write the pending, error and retry handling by hand. Rejected: it rebuilds a well-tested library inside the one file the tests do not cover.

## Consequences

- One new runtime dependency. The repository's rule is no new dependency without discussion: this record is that discussion.
- `CLAUDE.md` changes: "all state lives in `AppContext`" becomes "interface state lives in `AppContext`; server data goes through the data port".
- For a while the app has two ways to hold server data. The target document says which stories move what.
- Tests no longer need to mock the Supabase client: they use the in-memory adapter.

## Reopen when

TanStack Query cannot express a state the design needs, or the owner declines the dependency. Then item 3 is replaced by a small mutation hook over the same results, and items 1, 2 and 4 stand.
