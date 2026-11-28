import { INBOX, TRIPS, TRIP_DETAILS } from '../lib/data';
import type { InboxItem, Trip, TripDetail } from '../lib/types';

/** The fixture trip with this id. It throws when there is none, so a story fails loudly if a fixture is renamed. */
export function fixtureTrip(id: string): Trip {
  const trip = TRIPS.find((t) => t.id === id);
  if (!trip) throw new Error(`No fixture trip "${id}"`);
  return trip;
}

/** The fixture detail for a trip id. It throws when there is none. */
export function fixtureDetail(id: string): TripDetail {
  const detail = TRIP_DETAILS[id];
  if (!detail) throw new Error(`No fixture detail for "${id}"`);
  return detail;
}

/** The fixture inbox item with this id. It throws when there is none. */
export function fixtureInboxItem(id: string): InboxItem {
  const item = INBOX.find((i) => i.id === id);
  if (!item) throw new Error(`No fixture inbox item "${id}"`);
  return item;
}
