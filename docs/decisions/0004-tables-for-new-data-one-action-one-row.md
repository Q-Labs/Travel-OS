# 0004. New data goes in tables; one user action is one row write

| | |
| --- | --- |
| **Status** | Proposed. Needs the owner’s yes |
| **Written** | 27 Nov 2026, with the architecture baseline (#114) |
| **Work** | #76, #86, #93, #97, #101 |

## Context

A trip's details are one row holding six JSON documents. Every change sends all six. Two devices on the same account can therefore overwrite each other: a packing tick on one phone can erase a booking added on another. Travelers are records, not accounts, so one household uses one account on several phones.

#52 was sketched with expenses stored inside that row. The ledger's promise is that nothing is overwritten, and a disruption record is evidence written at an airport on a weak signal.

The browser cannot run a transaction across tables.

## Decision

1. **One user action is one write to one row.** If an action needs two tables, it goes through one database function. Nothing in #52 needs that yet.
2. Things that are added one at a time and must not be lost get a **table, one row each**: expenses, settlements, disruption records and their entries, passports, entry authorisations, Schengen stays.
3. Data that belongs to a row and is saved with it stays in a **JSON column on that row**: how an expense is split, the scheduled departure copied into a disruption record.
4. **Bookings stay in their JSON document for this release.** Each booking and segment gains a stable `id`, and a write sends the `bookings` column alone instead of all six.
5. A new row's id is made in the browser, so a retry cannot create a duplicate.

## Runner-up

Move bookings to a table now, with segments beside them. Rejected for this release: it rewrites the Bookings tab, the calendar feed, the inbox filing step and the insights job before any new feature exists, and the epic's own plan depends on bookings needing no table change. Ids and column-scoped writes remove the immediate hazards.

## Consequences

- An expense can never be lost to an edit elsewhere in the trip.
- A failed save is one failed row, which is what the network-down pattern needs.
- Seven new tables, each with a policy, a foreign key and an index.
- Old `splits` and typed "spent" totals are migrated to opening entries, and the old columns stay until a later clean-up.
- Two devices editing the same trip's bookings at once can still overwrite each other. The window is smaller, not closed.

## Reopen when

A second account can write to a trip (#111), a lost booking edit is reported, or the server needs to query bookings across trips. Any one of them moves bookings to a table.
