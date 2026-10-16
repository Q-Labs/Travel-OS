import { describe, expect, it } from 'vitest';
import { rowToInboxItem, rowToTrip, rowToTripDetail } from './rows';

describe('rowToTrip', () => {
  const base = {
    id: 'tr-lisbon', destination: 'Lisbon', region: 'Estremadura', country: 'Portugal',
    stage: 'planning', categories: ['couple'], start_date: '2026-09-12', end_date: '2026-09-20',
    date_approx: null, budget_total: 6800, budget_spent: 1200, budget_currency: 'USD',
    travelers: ['t1', 't2'], cover_hue: 30, cover_label: 'azulejo', notes: 'n', nights: 8,
  };

  it('folds the flat cover columns back into a nested object', () => {
    const trip = rowToTrip({ ...base, created_days_ago: 40, days_in_stage: 12 });
    expect(trip.cover).toEqual({ hue: 30, label: 'azulejo' });
    expect(trip.destination).toBe('Lisbon');
    expect(trip.created_days_ago).toBe(40);
    expect(trip.daysInStage).toBe(12);
  });

  it('leaves the optional age columns undefined when absent', () => {
    const trip = rowToTrip(base);
    expect(trip.created_days_ago).toBeUndefined();
    expect(trip.daysInStage).toBeUndefined();
  });
});

describe('rowToTripDetail', () => {
  it('maps the jsonb columns and normalises a null splits column', () => {
    const detail = rowToTripDetail({
      itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [], splits: null,
    });
    expect(detail.splits).toBeUndefined();
  });

  it('keeps splits when present', () => {
    const splits = [{ travelerId: 't1', paid: 10, share: 5 }];
    expect(rowToTripDetail({
      itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [], splits,
    }).splits).toEqual(splits);
  });
});

describe('rowToInboxItem', () => {
  it('renames the from_address column', () => {
    const item = rowToInboxItem({
      id: 'in-1', source: 'email', vendor: 'Airbnb', subject: 'Confirmed',
      from_address: 'automated@airbnb.com', received_ago: '12 min ago',
      status: 'parsed', parsed: null,
    });
    expect(item.from).toBe('automated@airbnb.com');
    expect(item.suggested_trip).toBeUndefined();
  });
});
