# 0010. No offline queue, no file storage and no service worker in this release

| | |
| --- | --- |
| **Status** | Accepted. Decided by the owner in the design review, November 2026 |
| **Written** | 27 Nov 2026, with the architecture baseline (#114) |
| **Work** | #108, #112 |

## Context

Disruption mode is used at an airport, often on a weak signal. Two things would help there: saving notes while offline, and attaching photos of receipts. The owner decided against both for the first release, to keep running cost and scope down. Supabase Storage is not used anywhere in the app.

## Decision

1. Every action needs a connection. When there is none, the app says so and keeps what was typed (#73).
2. No photos. A receipt is a typed cost entry with an amount.
3. No service worker and no install prompt. The app is a responsive web page.
4. New rows carry ids made in the browser. That is needed for safe retries today, and it is the first thing an offline queue would need later.

## Runner-up

Ship offline capture for disruption mode only. Deferred, not rejected: it is #108.

## Consequences

- No storage bill and no cached private data on a shared phone.
- A traveler with no signal cannot add to a record until it returns. The screen says this before they start typing.
- Adding offline later means a local queue, conflict rules and a service worker. Adding photos means Storage, its policies, a privacy note and a cost line. Neither is a small change.

## Reopen when

The owner schedules #108 or #112. Each starts with its own decision record and a cost estimate.
