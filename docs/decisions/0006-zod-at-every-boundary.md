# 0006. Validate at every boundary with zod, from one shared set of schemas

| | |
| --- | --- |
| **Status** | Accepted by #127, including the new dependency. The handbook rule is adopted |
| **Written** | 27 Nov 2026, with the architecture baseline (#114) |
| **Work** | #117, #41 |

## Context

Rows from Supabase are cast to hand-written types. So is the model's reply in the inbox parser. A malformed JSON document reaches the screen unchecked.

#52 stores flight segments, traveler lists and ids inside JSON documents, and border readiness, the ledger and passenger rights all compute from them. The handbook's rule is zod at every boundary: form input, function input, webhook payloads and model output.

## Decision

Add zod. Keep one schema per row shape and per stored JSON document, in a folder both the browser and the Edge Functions import. Parse on every read and before every write. A row that does not parse becomes a typed failure for that item: the rest of the trip still loads.

## Runner-up

Hand-written type guards, as `api/inbox/ingest.ts` has today. Rejected: they drift from the types, and the handbook already chose zod.

## Consequences

- The types are inferred from the schemas, so `lib/types.ts` shrinks instead of being kept in step by hand.
- Old stored documents must still parse. Each new field is optional with a default, and a test loads a document saved before the change.
- A small cost on every read. Not measured.

## Reopen when

Never for the rule. The library could be swapped if its size in the bundle becomes a problem; measure before deciding.
