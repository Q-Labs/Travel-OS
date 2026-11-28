# 0008. A flight time is stored as the local time on the ticket, plus its zone

| | |
| --- | --- |
| **Status** | Accepted by #127 |
| **Written** | 27 Nov 2026, with the architecture baseline (#114) |
| **Work** | #71, #76, #85 |

## Context

A flight departs at a local time at an airport. The traveler reads that time off the ticket and off the departure board. Converting it to a single instant and back risks showing a different time than the ticket whenever zone rules change or a device is in another zone.

The handbook says to store times as `timestamptz`. That is right for a moment that happened. A scheduled departure is a different kind of fact.

## Decision

1. A scheduled time is stored as `{ local: "2027-03-14T18:35", zone: "Europe/Lisbon" }`: the wall time and the IANA zone of the airport. The zone comes from the airport list.
2. A time that is not known is stored as empty, never guessed.
3. The instant is computed when it is needed: for ordering, for the delay timer, for the calendar feed.
4. Things that happened (a note was added, a record started) are `timestamptz`.
5. Display follows the device's 12 or 24-hour setting through one helper (#71).

## Runner-up

Store an instant with an offset and derive the local time. Rejected: an unknown zone has no honest representation, and the stored value stops matching the ticket if the zone's rules change before the flight.

## Consequences

- What is stored is what the ticket says.
- An airport the list does not know has no zone, so ordering and the timer for that segment read "unknown" and say why.
- Every comparison of two times goes through one conversion function, tested across a daylight-saving change.

## Reopen when

Never for scheduled times. Live flight status (out of scope in #52) would add actual times, which are instants.
