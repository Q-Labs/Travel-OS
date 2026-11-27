# Decision records

One page per architecture decision: what was chosen, what was not, and what would reopen it. A record is never rewritten after it is accepted. A change of mind is a new record that says which one it replaces.

| # | Decision | Status | Work |
| --- | --- | --- | --- |
| [0001](0001-blueprint-web-app-browser-direct.md) | Stay on the Web app blueprint: the browser talks to Supabase, policies decide | In place | #52 |
| [0002](0002-server-code-on-supabase-edge-functions.md) | Server code runs in Supabase Edge Functions; the daily job on Supabase Cron | Accepted | #120, #121, #122 |
| [0003](0003-netlify-hosting-and-demo-mode-previews.md) | Host on Netlify, built by GitHub Actions; previews run on fixtures | Accepted | #60, #119, #123, #124 |
| [0004](0004-tables-for-new-data-one-action-one-row.md) | New data goes in tables; one user action is one row write | Accepted | #76, #86, #93, #97, #101 |
| [0005](0005-write-results-and-server-data-layer.md) | Every read and write returns a result; TanStack Query holds server data | Accepted | #118, #73 |
| [0006](0006-zod-at-every-boundary.md) | Validate at every boundary with zod, from one shared set of schemas | Accepted | #117, #41 |
| [0007](0007-reference-data-in-code.md) | Rules and airports are data in the code, each with a source and a checked date | Accepted | #74, #87, #92, #99, #103 |
| [0008](0008-flight-times-as-wall-time-plus-zone.md) | A flight time is stored as the local time on the ticket, plus its zone | Accepted | #71, #76, #85 |
| [0009](0009-money-and-exchange-rates.md) | Money: numeric in the database, minor units in the maths, the rate kept with the expense | Accepted | #93, #94, #96, #97 |
| [0010](0010-no-offline-no-storage-in-this-release.md) | No offline queue, no file storage and no service worker in this release | Accepted | #108, #112 |

## Adding one

1. Copy the newest record and take the next number.
2. Keep it to one decision. Say what the runner-up was and why it lost.
3. Open it as **Proposed**, in the pull request that needs it. The owner's approval of that pull request makes it **Accepted**.
4. Add the row above, and update [`../architecture.md`](../architecture.md) when the decision is built.
