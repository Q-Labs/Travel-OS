// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

import { createCalendarHandler, defaultNow } from './feed';
import type { SupabaseClient } from '@supabase/supabase-js';

const NOW = new Date('2026-04-20T09:30:00Z');
const now = () => NOW;

const TRIP_ROW = {
  id: 'tr-lisbon', user_id: 'u1', destination: 'Lisbon', region: 'Estremadura',
  country: 'Portugal', stage: 'booked', categories: ['couple'],
  start_date: '2026-09-12', end_date: '2026-09-20', date_approx: null,
  budget_total: 6800, budget_spent: 1200, budget_currency: 'USD',
  travelers: ['t1'], cover_hue: 30, cover_label: 'azulejo', notes: '', nights: 8,
};

const DETAIL_ROW = {
  trip_id: 'tr-lisbon', user_id: 'u1', itinerary: [],
  bookings: [{ category: 'flight', title: 'TAP 204', status: 'done', cost: 1, travel_date: '2026-09-12' }],
  budget_breakdown: [], packing: [], documents: [], splits: null,
};

function makeSupabase(opts: {
  tokenRow?: unknown;
  trips?: { data: unknown; error: unknown };
  details?: { data: unknown; error: unknown };
} = {}) {
  const from = vi.fn((table: string) => {
    if (table === 'user_inbox_tokens') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: 'tokenRow' in opts ? opts.tokenRow : { user_id: 'u1' },
              error: null,
            }),
          }),
        }),
      };
    }
    const result = table === 'trips'
      ? opts.trips ?? { data: [TRIP_ROW], error: null }
      : opts.details ?? { data: [DETAIL_ROW], error: null };
    const chain: Record<string, unknown> = {};
    chain['select'] = vi.fn(() => chain);
    chain['eq'] = vi.fn(() => chain);
    chain['then'] = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
      Promise.resolve(result).then(res, rej);
    return chain;
  });
  return { client: { from } as unknown as SupabaseClient, from };
}

function get(path: string) {
  return new Request(`https://x.test${path}`, { method: 'GET' });
}

beforeEach(() => vi.clearAllMocks());

describe('createCalendarHandler', () => {
  it('serves an iCal document for a known token', async () => {
    const { client } = makeSupabase();
    const res = await createCalendarHandler({ supabase: client, now })(get('/api/calendar/abc123'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/calendar; charset=utf-8');
    const body = await res.text();
    expect(body).toContain('BEGIN:VCALENDAR');
    expect(body).toContain('UID:trip-tr-lisbon@travel-os');
    expect(body).toContain('UID:booking-tr-lisbon-0@travel-os');
  });

  it('offers the feed as a named file', async () => {
    const { client } = makeSupabase();
    const res = await createCalendarHandler({ supabase: client, now })(get('/api/calendar/abc123'));
    expect(res.headers.get('content-disposition')).toContain('travel-os.ics');
  });

  it('rejects methods other than GET', async () => {
    const { client } = makeSupabase();
    const res = await createCalendarHandler({ supabase: client, now })(
      new Request('https://x.test/api/calendar/abc123', { method: 'POST' }),
    );
    expect(res.status).toBe(405);
  });

  it('404s an unknown token without leaking anything', async () => {
    const { client } = makeSupabase({ tokenRow: null });
    const res = await createCalendarHandler({ supabase: client, now })(get('/api/calendar/nope'));
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain('VCALENDAR');
  });

  it('404s when no token is present in the path', async () => {
    const { client } = makeSupabase();
    const res = await createCalendarHandler({ supabase: client, now })(get('/api/calendar'));
    expect(res.status).toBe(404);
  });

  it('accepts the token as a query parameter', async () => {
    const { client } = makeSupabase();
    const res = await createCalendarHandler({ supabase: client, now })(
      get('/api/calendar?token=abc123'),
    );
    expect(res.status).toBe(200);
  });

  it('returns 500 when the trips query fails', async () => {
    const { client } = makeSupabase({ trips: { data: null, error: { message: 'boom' } } });
    const res = await createCalendarHandler({ supabase: client, now })(get('/api/calendar/abc123'));
    expect(res.status).toBe(500);
  });

  it('still serves trips when the details query returns nothing', async () => {
    const { client } = makeSupabase({ details: { data: null, error: null } });
    const res = await createCalendarHandler({ supabase: client, now })(get('/api/calendar/abc123'));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('UID:trip-tr-lisbon@travel-os');
  });

  it('keeps the feed out of shared caches', async () => {
    const { client } = makeSupabase();
    const res = await createCalendarHandler({ supabase: client, now })(get('/api/calendar/abc123'));
    expect(res.headers.get('cache-control')).toContain('private');
  });
});

describe('production wiring', () => {
  it('defaultNow returns the current date', () => {
    expect(defaultNow()).toBeInstanceOf(Date);
  });
});
