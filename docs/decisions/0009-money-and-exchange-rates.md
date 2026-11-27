# 0009. Money: numeric in the database, minor units in the maths, the rate kept with the expense

| | |
| --- | --- |
| **Status** | Accepted by #127 |
| **Written** | 27 Nov 2026, with the architecture baseline (#114) |
| **Work** | #93, #94, #96, #97 |

## Context

The ledger must let a traveler check a balance by hand, and must not drift by a cent when amounts are split or converted. Expenses can be in any currency; the home currency equivalent uses Frankfurter's reference rates, which change daily.

#52 is clear that the app never moves or holds money. Settle-up is a record.

## Decision

1. Amounts are `numeric` in the database, as the handbook requires, with a three-letter currency code beside each.
2. The ledger maths works in whole minor units (cents, or whole yen), so a split always sums back to the total. The remainder of an uneven split is assigned by a fixed, tested rule.
3. Each expense stores its original amount and currency, its home-currency amount, the rate and the rate's date. A balance never changes because today's rate did.
4. When no rate is available, the expense is saved without a home amount and says so. It is not converted with a guess.
5. A settlement is its own row: who paid whom, how much, when.

## Runner-up

Store only the original amount and convert on display with the latest rate. Rejected: balances would change from day to day and could not be checked against a receipt.

## Consequences

- Balances are reproducible from the rows alone.
- A rate is fetched once per foreign-currency expense, from the browser.
- An expense without a rate counts toward totals in its own currency only, and the screen says a rate is missing.

## Reopen when

The app is asked to hold or move money. That is out of scope in #52 for regulatory reasons and would be a different product decision, not an architecture one.
