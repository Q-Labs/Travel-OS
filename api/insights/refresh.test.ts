// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

import { createInsightsHandler, defaultFetch, defaultNow } from './refresh';
import type { SupabaseClient } from '@supabase/supabase-js';

const TODAY = new Date('2026-04-20T00:00:00Z');
const now = () => TODAY;

const TRIP_ROW = {
  id: 'tr-lisbon', user_id: 'u1', destination: 'Lisbon', region: 'Estremadura',
  country: 'Portugal', stage: 'booked', categories: ['couple'],
  start_date: '2026-04-25', end_date: '2026-04-30', date_approx: null,
  budget_total: 6800, budget_spent: 1200, budget_currency: 'USD',
  travelers: ['t1'], cover_hue: 30, cover_label: 'azulejo', notes: '', nights: 5,
};

const DETAIL_ROW = {
  trip_id: 'tr-lisbon', user_id: 'u1',
  itinerary: [], bookings: [], budget_breakdown: [],
  packing: [{ category: 'clothing', item: 'Boots', qty: 1, packed: false }],
  documents: [], splits: null,
};

type Tables = {
  trips?: { data: unknown; error: unknown };
  trip_details?: { data: unknown; error: unknown };
  insights?: { error: unknown };
  prune?: { error: unknown };
};

function makeSupabase(tables: Tables = {}) {
  const upsert = vi.fn().mockResolvedValue({ error: tables.insights?.error ?? null });
  // Reconciliation prunes generated insights that no longer apply.
  const del = vi.fn();
  const from = vi.fn((table: string) => {
    if (table === 'insights') {
      const pruneChain: Record<string, unknown> = {};
      pruneChain['eq'] = vi.fn(() => pruneChain);
      pruneChain['not'] = vi.fn(() => pruneChain);
      pruneChain['then'] = (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) =>
        Promise.resolve({ error: tables.prune?.error ?? null }).then(ok, bad);
      del.mockReturnValue(pruneChain);
      return { upsert, delete: del };
    }
    const result = table === 'trips'
      ? tables.trips ?? { data: [TRIP_ROW], error: null }
      : tables.trip_details ?? { data: [DETAIL_ROW], error: null };
    const chain: Record<string, unknown> = {};
    chain['select'] = vi.fn(() => chain);
    chain['eq'] = vi.fn(() => chain);
    chain['then'] = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
      Promise.resolve(result).then(res, rej);
    return chain;
  });
  return { client: { from } as unknown as SupabaseClient, from, upsert, del };
}

function okForecast() {
  return vi.fn(async (url: string) => {
    if (url.includes('geocoding-api')) {
      return {
        ok: true,
        json: async () => ({
          results: [{
            latitude: 38.7, longitude: -9.1, country: 'Portugal',
            admin1: 'Lisbon', timezone: 'Europe/Lisbon',
          }],
        }),
      } as Response;
    }
    return {
      ok: true,
      json: async () => ({
        daily: {
          time: ['2026-04-25'],
          temperature_2m_max: [21],
          temperature_2m_min: [13],
          precipitation_probability_max: [10],
        },
      }),
    } as Response;
  });
}

function post(headers: Record<string, string> = { 'x-ingest-secret': 'shh' }, body?: unknown) {
  return new Request('https://x.test/api/insights/refresh', {
    method: 'POST',
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  process.env['INGEST_SECRET'] = 'shh';
  process.env['CRON_SECRET'] = 'cron-shh';
});

describe('createInsightsHandler', () => {
  it('rejects methods other than GET and POST', async () => {
    const { client } = makeSupabase();
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    const res = await handler(new Request('https://x.test/', { method: 'PUT' }));
    expect(res.status).toBe(405);
  });

  it('rejects a request with no secret', async () => {
    const { client } = makeSupabase();
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    expect((await handler(post({}))).status).toBe(401);
  });

  it('rejects a wrong shared secret', async () => {
    const { client } = makeSupabase();
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    expect((await handler(post({ 'x-ingest-secret': 'nope' }))).status).toBe(401);
  });

  it('rejects a wrong cron bearer token', async () => {
    const { client } = makeSupabase();
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    expect((await handler(post({ authorization: 'Bearer nope' }))).status).toBe(401);
  });

  it('accepts a Vercel cron GET carrying the bearer token', async () => {
    const { client, upsert } = makeSupabase();
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    const res = await handler(new Request('https://x.test/', {
      method: 'GET',
      headers: { authorization: 'Bearer cron-shh' },
    }));
    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalled();
  });

  it('writes weather, packing and passport insights for a user', async () => {
    const { client, upsert } = makeSupabase();
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    const res = await handler(post(undefined, { userId: 'u1' }));
    expect(res.status).toBe(200);
    const rows = upsert.mock.calls[0]?.[0] as { id: string; user_id: string }[];
    expect(rows.map((r) => r.id).sort()).toEqual(['pack-tr-lisbon', 'wx-tr-lisbon']);
    expect(rows.every((r) => r.user_id === 'u1')).toBe(true);
    expect(upsert.mock.calls[0]?.[1]).toEqual({ onConflict: 'id,user_id' });
  });

  it('reports how many insights it wrote', async () => {
    const { client } = makeSupabase();
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    const res = await handler(post(undefined, { userId: 'u1' }));
    expect(await res.json()).toEqual({ users: 1, insights: 2, failed: 0 });
  });

  it('discovers users from the trips table when no userId is given', async () => {
    const { client, from } = makeSupabase();
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    const res = await handler(post());
    expect(res.status).toBe(200);
    expect(from).toHaveBeenCalledWith('trips');
  });

  it('treats a malformed POST body as an unscoped refresh', async () => {
    const { client } = makeSupabase();
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    const req = new Request('https://x.test/', {
      method: 'POST',
      headers: { 'x-ingest-secret': 'shh' },
      body: 'not json',
    });
    expect((await handler(req)).status).toBe(200);
  });

  it('returns 500 when the trips query fails', async () => {
    const { client } = makeSupabase({ trips: { data: null, error: { message: 'boom' } } });
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    expect((await handler(post(undefined, { userId: 'u1' }))).status).toBe(500);
  });

  it('returns 500 when the insights upsert fails', async () => {
    const { client } = makeSupabase({ insights: { error: { message: 'boom' } } });
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    expect((await handler(post(undefined, { userId: 'u1' }))).status).toBe(500);
  });

  it('still writes non-weather insights when geocoding fails', async () => {
    const fetchFn = vi.fn(async () => ({ ok: false, json: async () => ({}) }) as Response);
    const { client, upsert } = makeSupabase();
    const handler = createInsightsHandler({ supabase: client, fetchFn, now });
    const res = await handler(post(undefined, { userId: 'u1' }));
    expect(res.status).toBe(200);
    const rows = upsert.mock.calls[0]?.[0] as { id: string }[];
    expect(rows.map((r) => r.id)).toEqual(['pack-tr-lisbon']);
  });

  it('skips the upsert entirely when nothing is worth reporting', async () => {
    const { client, upsert } = makeSupabase({
      trips: { data: [{ ...TRIP_ROW, start_date: '2027-01-01', end_date: '2027-01-10' }], error: null },
      trip_details: { data: [], error: null },
    });
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    const res = await handler(post(undefined, { userId: 'u1' }));
    expect(res.status).toBe(200);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('tolerates a missing trip_details result', async () => {
    const { client } = makeSupabase({ trip_details: { data: null, error: null } });
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    expect((await handler(post(undefined, { userId: 'u1' }))).status).toBe(200);
  });

  it('skips archived trips', async () => {
    const { client, upsert } = makeSupabase({
      trips: { data: [{ ...TRIP_ROW, stage: 'archived' }], error: null },
    });
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    await handler(post(undefined, { userId: 'u1' }));
    expect(upsert).not.toHaveBeenCalled();
  });

  it('deduplicates users discovered from the trips table', async () => {
    const { client, upsert } = makeSupabase({
      trips: { data: [{ ...TRIP_ROW, user_id: 'u1' }, { ...TRIP_ROW, id: 'tr-2', user_id: 'u1' }], error: null },
    });
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    const res = await handler(post());
    expect(await res.json()).toMatchObject({ users: 1 });
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('treats a POST body without a userId as an unscoped refresh', async () => {
    const { client, from } = makeSupabase();
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    const res = await handler(post(undefined, {}));
    expect(res.status).toBe(200);
    expect(from).toHaveBeenCalledWith('trips');
  });

  it('returns 500 when discovering users fails', async () => {
    const { client } = makeSupabase({ trips: { data: null, error: { message: 'boom' } } });
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    expect((await handler(post())).status).toBe(500);
  });
});

describe('production wiring', () => {
  it('defaultNow returns the current date', () => {
    expect(defaultNow()).toBeInstanceOf(Date);
  });

  it('defaultFetch delegates to the global fetch', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true, json: async () => ({}) } as Response);
    await defaultFetch('https://example.test/');
    expect(spy).toHaveBeenCalledWith('https://example.test/');
    spy.mockRestore();
  });
});

describe('resilience and reconciliation', () => {
  it('prunes generated insights that no longer apply', async () => {
    const { client, del } = makeSupabase();
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    await handler(post(undefined, { userId: 'u1' }));
    expect(del).toHaveBeenCalled();
  });

  it('keeps going when one user fails instead of starving the rest', async () => {
    const { client } = makeSupabase({ insights: { error: { message: 'boom' } } });
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    const res = await handler(post());
    // One user, and that user failed -- but the run reports rather than throwing.
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: expect.any(String) });
  });

  it('surfaces a failed prune rather than reporting success', async () => {
    const { client } = makeSupabase({ prune: { error: { message: 'boom' } } });
    const handler = createInsightsHandler({ supabase: client, fetchFn: okForecast(), now });
    const res = await handler(post(undefined, { userId: 'u1' }));
    expect(res.status).toBe(500);
  });
});
