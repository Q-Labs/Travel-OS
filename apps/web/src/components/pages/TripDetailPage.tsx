import { useParams } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { findTripById } from '../../lib/trips';
import type { TripDetail } from '../../lib/types';
import { TripDetailContent } from '../organisms/TripDetailContent';

const EMPTY_DETAIL: TripDetail = {
  itinerary: [],
  bookings: [],
  budget_breakdown: [],
  packing: [],
  documents: [],
};

/**
 * The page for one trip, found by the id in the URL. An unknown id shows "Trip
 * not found", and a trip with no detail row yet gets an empty one.
 */
export function TripDetailPage() {
  const { trips, tripDetails, updateTrip, togglePacked, toggleBookingStatus } = useApp();
  const { tripId } = useParams() as { tripId: string };
  const trip = findTripById(trips, tripId);

  if (!trip) {
    return <p className="trip-missing">Trip not found.</p>;
  }

  return (
    <TripDetailContent
      key={trip.id}
      trip={trip}
      tripId={tripId}
      detail={tripDetails[tripId] ?? EMPTY_DETAIL}
      updateTrip={updateTrip}
      togglePacked={togglePacked}
      toggleBookingStatus={toggleBookingStatus}
    />
  );
}
