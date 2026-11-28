export type { TripStage, Trip } from './types';
export { TRIPS as tripsFixture, TRAVELERS, TRIP_DETAILS } from './data';

/** The trips that are not archived, which are the ones that belong on the pipeline. */
export const activeTrips = (trips: import('./types').Trip[]) =>
  trips.filter((t) => t.stage !== 'archived');

/** The trip with the given id, or undefined when there is none. */
export const findTripById = (trips: import('./types').Trip[], id: string) =>
  trips.find((t) => t.id === id);
