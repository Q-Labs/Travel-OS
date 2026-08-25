import { describe, expect, it } from 'vitest';
import { buildCalendar } from './ical';
import type { Trip, TripDetail } from './types';

const NOW = new Date('2026-04-20T09:30:00Z');

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'tr-lisbon', destination: 'Lisbon', region: 'Estremadura', country: 'Portugal',
    stage: 'booked', categories: ['couple'],
    start_date: '2026-09-12', end_date: '2026-09-20', date_approx: null,
    budget_total: 6800, budget_spent: 1200, budget_currency: 'USD',
    travelers: ['t1'], cover: { hue: 30, label: 'azulejo' }, notes: '', nights: 8,
    ...overrides,
  };
}

function makeDetail(overrides: Partial<TripDetail> = {}): TripDetail {
  return { itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [], ...overrides };
}

function lines(ics: string): string[] {
  return ics.split('\r\n');
}

describe('buildCalendar', () => {
  it('emits a valid calendar envelope', () => {
    const ics = buildCalendar([], {}, { now: NOW });
    const l = lines(ics);
    expect(l[0]).toBe('BEGIN:VCALENDAR');
    expect(l).toContain('VERSION:2.0');
    expect(l).toContain('CALSCALE:GREGORIAN');
    expect(l).toContain('METHOD:PUBLISH');
    // The document ends with a CRLF, so the final split element is empty.
    expect(l[l.length - 1]).toBe('');
    expect(l[l.length - 2]).toBe('END:VCALENDAR');
  });

  it('uses CRLF line endings throughout', () => {
    const ics = buildCalendar([makeTrip()], {}, { now: NOW });
    expect(ics.split('\n').every((line) => line === '' || line.endsWith('\r'))).toBe(true);
  });

  it('writes an all-day event spanning the trip, with an exclusive DTEND', () => {
    const ics = buildCalendar([makeTrip()], {}, { now: NOW });
    const l = lines(ics);
    expect(l).toContain('UID:trip-tr-lisbon@travel-os');
    expect(l).toContain('DTSTART;VALUE=DATE:20260912');
    // DTEND is exclusive in RFC 5545, so a trip ending the 20th ends on the 21st.
    expect(l).toContain('DTEND;VALUE=DATE:20260921');
    expect(l).toContain('SUMMARY:Lisbon');
    expect(l).toContain('DTSTAMP:20260420T093000Z');
  });

  it('rolls the exclusive DTEND over a month boundary', () => {
    const ics = buildCalendar(
      [makeTrip({ start_date: '2026-09-28', end_date: '2026-09-30' })], {}, { now: NOW },
    );
    expect(lines(ics)).toContain('DTEND;VALUE=DATE:20261001');
  });

  it('skips trips with no dates', () => {
    const ics = buildCalendar(
      [makeTrip({ start_date: null, end_date: null, date_approx: 'Spring 2027' })], {}, { now: NOW },
    );
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  it('skips trips missing just an end date', () => {
    const ics = buildCalendar([makeTrip({ end_date: null })], {}, { now: NOW });
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  it('skips archived trips', () => {
    const ics = buildCalendar([makeTrip({ stage: 'archived' })], {}, { now: NOW });
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  it('writes an event per dated booking', () => {
    const details = {
      'tr-lisbon': makeDetail({
        bookings: [
          { category: 'flight', title: 'TAP 204 EWR→LIS', vendor: 'TAP', status: 'done', cost: 1240, travel_date: '2026-09-12' },
          { category: 'lodging', title: 'No dates yet', status: 'todo', cost: 0 },
        ],
      }),
    };
    const l = lines(buildCalendar([makeTrip()], details, { now: NOW }));
    expect(l).toContain('UID:booking-tr-lisbon-0@travel-os');
    expect(l).toContain('DTSTART;VALUE=DATE:20260912');
    expect(l.some((x) => x.startsWith('SUMMARY:TAP 204'))).toBe(true);
    expect(l.some((x) => x.includes('booking-tr-lisbon-1'))).toBe(false);
  });

  it('keeps booking UIDs stable across rebuilds', () => {
    const details = {
      'tr-lisbon': makeDetail({
        bookings: [{ category: 'flight', title: 'A', status: 'done', cost: 1, travel_date: '2026-09-12' }],
      }),
    };
    const first = buildCalendar([makeTrip()], details, { now: NOW });
    const second = buildCalendar([makeTrip()], details, { now: new Date('2026-05-01T00:00:00Z') });
    const uids = (ics: string) => lines(ics).filter((x) => x.startsWith('UID:'));
    expect(uids(first)).toEqual(uids(second));
  });

  it('escapes special characters in text fields', () => {
    const ics = buildCalendar(
      [makeTrip({ destination: 'Lisbon; Porto, Faro\\Sintra', notes: 'line one\nline two' })],
      {}, { now: NOW },
    );
    expect(ics).toContain('SUMMARY:Lisbon\\; Porto\\, Faro\\\\Sintra');
    expect(ics).toContain('DESCRIPTION:line one\\nline two');
  });

  it('omits DESCRIPTION when there are no notes', () => {
    const ics = buildCalendar([makeTrip({ notes: '' })], {}, { now: NOW });
    expect(ics).not.toContain('DESCRIPTION:');
  });

  it('includes the vendor in a booking description', () => {
    const details = {
      'tr-lisbon': makeDetail({
        bookings: [{ category: 'flight', title: 'TAP 204', vendor: 'TAP', status: 'done', cost: 1, travel_date: '2026-09-12', confirmation: 'XY7Z' }],
      }),
    };
    const ics = buildCalendar([makeTrip()], details, { now: NOW });
    expect(ics).toContain('TAP');
    expect(ics).toContain('XY7Z');
  });

  it('omits a booking description when there is nothing to say', () => {
    const details = {
      'tr-lisbon': makeDetail({
        bookings: [{ category: 'flight', title: 'Bare', status: 'done', cost: 0, travel_date: '2026-09-12' }],
      }),
    };
    const ics = buildCalendar([makeTrip({ notes: '' })], details, { now: NOW });
    expect(ics).not.toContain('DESCRIPTION:');
  });

  it('folds lines longer than 75 octets with a leading space', () => {
    const ics = buildCalendar([makeTrip({ destination: 'A'.repeat(200) })], {}, { now: NOW });
    const encoder = new TextEncoder();
    for (const line of lines(ics)) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(lines(ics).some((line) => line.startsWith(' '))).toBe(true);
  });

  it('folds without splitting a multi-byte character', () => {
    const ics = buildCalendar([makeTrip({ destination: '京'.repeat(80) })], {}, { now: NOW });
    expect(ics).toContain('京');
    const encoder = new TextEncoder();
    for (const line of lines(ics)) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('handles a trip whose detail row is missing', () => {
    const ics = buildCalendar([makeTrip()], {}, { now: NOW });
    expect(ics).toContain('UID:trip-tr-lisbon@travel-os');
  });
});
