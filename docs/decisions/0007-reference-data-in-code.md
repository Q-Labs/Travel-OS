# 0007. Rules and airports are data in the code, each with a source and a checked date

| | |
| --- | --- |
| **Status** | Accepted. The principle is in #52; the airport list was agreed in the design review on 21 Nov 2026 |
| **Written** | 27 Nov 2026, with the architecture baseline (#114) |
| **Work** | #74, #87, #92, #99, #103 |

## Context

Border readiness and passenger rights tell a traveler what a government or a regulation requires. A wrong answer has real cost. #52 sets the principle: rules are a plain, dated, source-linked table; none is generated; unknown is never shown as OK.

Both need each airport's country and zone, which a typed three-letter code does not give.

## Decision

1. Entry rules and rights regimes are typed tables in the shared pure code. Every entry carries its official source and the date it was last checked. A test fails if either is missing.
2. Rights regimes are date-aware: an entry says when it applies from and to, so a flight is judged by the rule in force on its date.
3. Airports are a static file in the repository, loaded only when needed. Its source, licence and size are written in the README.
4. None of this is in the database, and none of it is fetched at run time.

## Runner-up

Rules in a database table, edited without a deploy. Rejected: a rule change should be a reviewed pull request with a source, and a table would need its own admin screen and policies.

## Consequences

- Changing a rule is a code change with a test, a source link and a review.
- The browser and the insights function read the same data, so they cannot disagree.
- The airport file adds weight to the app. It is loaded on demand and its size is a number in the README, not a guess.
- Rules go stale silently unless someone re-checks them. #109 is the follow-up.

## Reopen when

The rules table grows past what a household needs (many nationalities and destinations), or a licensed data source is chosen. Either is a new decision with a cost line.
