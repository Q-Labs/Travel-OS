import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TRIPS, TRIP_DETAILS } from '../../lib/data';
import type { Trip } from '../../lib/types';
import { TripDetailContent } from './TripDetailContent';

// The Overview tab renders DestinationBlurb and BudgetConversion, which would
// otherwise reach out to Wikipedia and Frankfurter.
vi.mock('../../lib/clients/wikipedia', () => ({
  fetchDestinationSummary: vi.fn().mockResolvedValue(null),
}));
vi.mock('../../lib/clients/frankfurter', () => ({
  fetchRates: vi.fn().mockResolvedValue(null),
}));

// Lisbon is the fixture trip that has a detail row.
const trip: Trip = { ...(TRIPS.find((t) => t.id === 'tr-lisbon') as Trip), notes: 'Original notes' };
const detail = TRIP_DETAILS['tr-lisbon'];
const updateTrip = vi.fn();

beforeEach(() => {
  updateTrip.mockReset();
  window.localStorage.clear();
});

function renderContent() {
  render(
    <MemoryRouter>
      <TripDetailContent
        trip={trip}
        tripId={trip.id}
        detail={detail}
        updateTrip={updateTrip}
        togglePacked={vi.fn()}
        toggleBookingStatus={vi.fn()}
      />
    </MemoryRouter>,
  );
  return screen.getByLabelText('Trip notes');
}

describe('TripDetailContent notes', () => {
  it('saves notes that changed when the field loses focus', () => {
    const notes = renderContent();
    fireEvent.change(notes, { target: { value: 'Book the tram pass' } });
    fireEvent.blur(notes);
    expect(updateTrip).toHaveBeenCalledWith(trip.id, { notes: 'Book the tram pass' });
  });

  it('does not write notes that did not change', () => {
    const notes = renderContent();
    fireEvent.blur(notes);
    expect(updateTrip).not.toHaveBeenCalled();
  });
});
