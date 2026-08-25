import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Trip, TripDetail, Insight, InboxItem, Traveler } from './types';

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

import { supabase } from './supabase';
import {
  getSession,
  signInWithMagicLink,
  signOut,
  subscribeAuthChange,
  hasSeededData,
  fetchTrips,
  fetchTripDetails,
  fetchInsights,
  fetchInboxItems,
  fetchTravelers,
  fetchInboxToken,
  upsertTrip,
  upsertTripDetail,
  deleteInsight,
  deleteInboxItem,
  insertInboxItem,
  subscribeInbox,
  seedFromFixtures,
} from './db';

function makeChain(result: { data: unknown; error: unknown; count?: number }) {
  const c = {
    select: vi.fn(),
    maybeSingle: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    upsert: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    is: vi.fn(),
    then: (cb: (v: { data: unknown; error: unknown; count?: number }) => void) =>
      Promise.resolve(cb(result)),
  };
  c.select.mockReturnValue(c);
  c.update.mockReturnValue(c);
  c.is.mockReturnValue(c);
  c.maybeSingle.mockResolvedValue(result);
  c.eq.mockReturnValue(c);
  c.order.mockReturnValue(c);
  c.upsert.mockReturnValue(c);
  c.insert.mockReturnValue(c);
  c.delete.mockReturnValue(c);
  return c;
}

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;
const mockAuth = supabase.auth as unknown as {
  getSession: ReturnType<typeof vi.fn>;
  signInWithOtp: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  onAuthStateChange: ReturnType<typeof vi.fn>;
};
const mockSupabase = supabase as unknown as {
  channel: ReturnType<typeof vi.fn>;
  removeChannel: ReturnType<typeof vi.fn>;
};

beforeEach(() => vi.clearAllMocks());

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('getSession', () => {
  it('returns session when one exists', async () => {
    const session = { user: { id: 'u1' } };
    mockAuth.getSession.mockResolvedValue({ data: { session } });
    expect(await getSession()).toBe(session);
  });

  it('returns null when no session', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null } });
    expect(await getSession()).toBeNull();
  });
});

describe('signInWithMagicLink', () => {
  it('returns error: null on success', async () => {
    mockAuth.signInWithOtp.mockResolvedValue({ error: null });
    expect(await signInWithMagicLink('a@b.com')).toEqual({ error: null });
  });

  it('returns error on failure', async () => {
    const err = new Error('rate limited');
    mockAuth.signInWithOtp.mockResolvedValue({ error: err });
    expect(await signInWithMagicLink('a@b.com')).toEqual({ error: err });
  });
});

describe('signOut', () => {
  it('calls supabase.auth.signOut', async () => {
    mockAuth.signOut.mockResolvedValue({});
    await signOut();
    expect(mockAuth.signOut).toHaveBeenCalledOnce();
  });
});

describe('subscribeAuthChange', () => {
  it('registers a listener and returns unsubscribe', () => {
    const unsubscribeFn = vi.fn();
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeFn } },
    });
    const callback = vi.fn();
    const sub = subscribeAuthChange(callback);
    expect(mockAuth.onAuthStateChange).toHaveBeenCalledOnce();
    sub.unsubscribe();
    expect(unsubscribeFn).toHaveBeenCalledOnce();
  });
});

// ── Seed detection ────────────────────────────────────────────────────────────

describe('hasSeededData', () => {
  it('returns true when trips exist', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null, count: 3 }));
    expect(await hasSeededData('u1')).toBe(true);
  });

  it('returns false when no trips', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null, count: 0 }));
    expect(await hasSeededData('u1')).toBe(false);
  });

  it('returns false when count is null (nullish coalescing fallback)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null, count: undefined }));
    expect(await hasSeededData('u1')).toBe(false);
  });
});

// ── Fetch ─────────────────────────────────────────────────────────────────────

describe('fetchTrips', () => {
  it('maps cover_hue/cover_label back to cover object', async () => {
    const row = {
      id: 'tr-1', destination: 'Rome', region: 'Lazio', country: 'Italy',
      stage: 'dreaming', categories: ['couple'], start_date: null, end_date: null,
      date_approx: null, budget_total: 5000, budget_spent: 0, budget_currency: 'USD',
      travelers: ['t1'], cover_hue: 30, cover_label: 'terra', notes: '', nights: 7,
      created_days_ago: 10, days_in_stage: 10,
    };
    mockFrom.mockReturnValue(makeChain({ data: [row], error: null }));
    const trips = await fetchTrips('u1');
    expect(trips[0].cover).toEqual({ hue: 30, label: 'terra' });
    expect(trips[0].destination).toBe('Rome');
  });

  it('returns empty array on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }));
    expect(await fetchTrips('u1')).toEqual([]);
  });
});

describe('fetchTripDetails', () => {
  it('returns a Record keyed by trip_id', async () => {
    const row = {
      trip_id: 'tr-1', itinerary: [], bookings: [],
      budget_breakdown: [], packing: [], documents: [], splits: null,
    };
    mockFrom.mockReturnValue(makeChain({ data: [row], error: null }));
    const details = await fetchTripDetails('u1');
    expect(details['tr-1']).toBeDefined();
    expect(details['tr-1'].bookings).toEqual([]);
  });

  it('includes splits when present in DB row', async () => {
    const splits = [{ travelerId: 't1', paid: 1000, share: 500 }];
    const row = {
      trip_id: 'tr-1', itinerary: [], bookings: [],
      budget_breakdown: [], packing: [], documents: [], splits,
    };
    mockFrom.mockReturnValue(makeChain({ data: [row], error: null }));
    const details = await fetchTripDetails('u1');
    expect(details['tr-1'].splits).toEqual(splits);
  });

  it('returns undefined splits when DB row has null splits', async () => {
    const row = {
      trip_id: 'tr-1', itinerary: [], bookings: [],
      budget_breakdown: [], packing: [], documents: [], splits: null,
    };
    mockFrom.mockReturnValue(makeChain({ data: [row], error: null }));
    const details = await fetchTripDetails('u1');
    expect(details['tr-1'].splits).toBeUndefined();
  });

  it('returns empty object on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }));
    expect(await fetchTripDetails('u1')).toEqual({});
  });
});

describe('fetchInsights', () => {
  it('returns insights array', async () => {
    const row: Insight = {
      id: 'i1', trip_id: 'tr-1', type: 'weather',
      severity: 'info', title: 'Rain likely', body: 'Pack a jacket',
    };
    const chain = makeChain({ data: [row], error: null });
    mockFrom.mockReturnValue(chain);
    const insights = await fetchInsights('u1');
    expect(insights[0].id).toBe('i1');
    expect(chain.is).toHaveBeenCalledWith('dismissed_at', null);
  });

  it('returns empty array on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }));
    expect(await fetchInsights('u1')).toEqual([]);
  });
});

describe('fetchInboxItems', () => {
  it('maps from_address to from field', async () => {
    const row = {
      id: 'ib1', source: 'email', vendor: 'AA', subject: 'Your flight',
      from_address: 'aa@aa.com', received_ago: '2h ago', status: 'parsed',
      parsed: null, suggested_trip: null, suggested_confidence: null, note: null,
    };
    mockFrom.mockReturnValue(makeChain({ data: [row], error: null }));
    const items = await fetchInboxItems('u1');
    expect(items[0].from).toBe('aa@aa.com');
    expect(items[0].id).toBe('ib1');
  });

  it('returns empty array on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }));
    expect(await fetchInboxItems('u1')).toEqual([]);
  });
});

describe('fetchTravelers', () => {
  it('returns travelers array', async () => {
    const row: Traveler = { id: 't1', name: 'Quincy', relationship: 'self', initials: 'Q' };
    mockFrom.mockReturnValue(makeChain({ data: [row], error: null }));
    const travelers = await fetchTravelers('u1');
    expect(travelers[0].name).toBe('Quincy');
  });

  it('returns empty array on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('db error') }));
    expect(await fetchTravelers('u1')).toEqual([]);
  });
});

// ── Mutations ─────────────────────────────────────────────────────────────────

describe('upsertTrip', () => {
  it('flattens cover into cover_hue and cover_label', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    const trip = {
      id: 'tr-1', destination: 'Rome', region: '', country: 'Italy',
      stage: 'dreaming' as const, categories: [] as import('./types').TripCategory[], start_date: null,
      end_date: null, date_approx: null, budget_total: 0, budget_spent: 0,
      budget_currency: 'USD', travelers: [], cover: { hue: 42, label: 'terracotta' },
      notes: '', nights: 0,
    };
    await upsertTrip('u1', trip);
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ cover_hue: 42, cover_label: 'terracotta' }),
      expect.any(Object),
    );
  });

  it('swallows errors silently', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('fail') }));
    const trip: Trip = {
      id: 'tr-1', destination: 'X', region: '', country: '', stage: 'dreaming',
      categories: [], start_date: null, end_date: null, date_approx: null,
      budget_total: 0, budget_spent: 0, budget_currency: 'USD', travelers: [],
      cover: { hue: 0, label: '' }, notes: '', nights: 0,
    };
    await expect(upsertTrip('u1', trip)).resolves.toBeUndefined();
  });
});

describe('upsertTripDetail', () => {
  it('calls upsert with jsonb fields', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    const detail: TripDetail = { itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [] };
    await upsertTripDetail('u1', 'tr-1', detail);
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ trip_id: 'tr-1', user_id: 'u1' }),
      expect.any(Object),
    );
  });

  it('includes splits in upsert payload when present', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    const splits = [{ travelerId: 't1', paid: 500, share: 500 }];
    const detail: TripDetail = { itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [], splits };
    await upsertTripDetail('u1', 'tr-1', detail);
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ splits }),
      expect.any(Object),
    );
  });

  it('swallows errors silently', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('fail') }));
    const detail: TripDetail = { itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [] };
    await expect(upsertTripDetail('u1', 'tr-1', detail)).resolves.toBeUndefined();
  });
});

describe('deleteInsight', () => {
  it('records a dismissal instead of deleting, so the cron cannot resurrect it', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await deleteInsight('u1', 'i1');
    expect(chain.delete).not.toHaveBeenCalled();
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ dismissed_at: expect.any(String) }),
    );
    expect(chain.eq).toHaveBeenCalledWith('id', 'i1');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('swallows errors silently', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('fail') }));
    await expect(deleteInsight('u1', 'i1')).resolves.toBeUndefined();
  });
});

describe('deleteInboxItem', () => {
  it('calls delete with matching id and user_id', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    await deleteInboxItem('u1', 'ib1');
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('id', 'ib1');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('swallows errors silently', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('fail') }));
    await expect(deleteInboxItem('u1', 'ib1')).resolves.toBeUndefined();
  });
});

describe('insertInboxItem', () => {
  it('inserts a row mapping from → from_address', async () => {
    const chain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);
    const item: InboxItem = {
      id: 'ib-new', source: 'email', vendor: 'AA', subject: 'Your flight',
      from: 'aa@aa.com', received_ago: '1h ago', status: 'parsing', parsed: null,
    };
    await insertInboxItem('u1', item);
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ib-new', user_id: 'u1', from_address: 'aa@aa.com', status: 'parsing' }),
    );
  });

  it('logs a warning on error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: new Error('fail') }));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const item: InboxItem = {
      id: 'ib-x', source: 'email', vendor: 'X', subject: 'X',
      from: 'x@x.com', received_ago: '1h', status: 'parsing', parsed: null,
    };
    await insertInboxItem('u1', item);
    expect(warnSpy).toHaveBeenCalledWith('[db] insertInboxItem:', 'fail');
    warnSpy.mockRestore();
  });
});

describe('subscribeInbox', () => {
  function makeChannelObj() {
    let capturedCb: ((payload: unknown) => void) | undefined;
    const subscribe = vi.fn();
    const on = vi.fn().mockImplementation((_event: string, _filter: unknown, cb: (payload: unknown) => void) => {
      capturedCb = cb;
      return channelObj;
    });
    const channelObj = { on, subscribe };
    subscribe.mockReturnValue(channelObj);
    return { channelObj, getCapturedCb: () => capturedCb };
  }

  it('subscribes with correct table, event, and filter', () => {
    const { channelObj } = makeChannelObj();
    mockSupabase.channel.mockReturnValue(channelObj);
    subscribeInbox('u1', vi.fn());
    expect(mockSupabase.channel).toHaveBeenCalledWith(expect.any(String));
    expect(channelObj.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ event: '*', schema: 'public', table: 'inbox_items', filter: 'user_id=eq.u1' }),
      expect.any(Function),
    );
  });

  it('unsubscribe calls removeChannel with the channel object', () => {
    const { channelObj } = makeChannelObj();
    mockSupabase.channel.mockReturnValue(channelObj);
    const sub = subscribeInbox('u1', vi.fn());
    sub.unsubscribe();
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(channelObj);
  });

  it('maps INSERT payload row to InboxItem and calls onChange', () => {
    const { channelObj, getCapturedCb } = makeChannelObj();
    mockSupabase.channel.mockReturnValue(channelObj);
    const handler = vi.fn();
    subscribeInbox('u1', handler);
    const row = {
      id: 'ib1', source: 'email', vendor: 'AA', subject: 'Flight',
      from_address: 'aa@aa.com', received_ago: '1h', status: 'parsed',
      parsed: null, suggested_trip: 'tr-1', suggested_confidence: 0.9, note: 'auto',
    };
    getCapturedCb()!({ eventType: 'INSERT', new: row, old: {} });
    expect(handler).toHaveBeenCalledWith({
      eventType: 'INSERT',
      item: expect.objectContaining({ id: 'ib1', from: 'aa@aa.com', vendor: 'AA', status: 'parsed' }),
    });
  });

  it('maps UPDATE payload row to InboxItem and calls onChange', () => {
    const { channelObj, getCapturedCb } = makeChannelObj();
    mockSupabase.channel.mockReturnValue(channelObj);
    const handler = vi.fn();
    subscribeInbox('u1', handler);
    const row = {
      id: 'ib2', source: 'gmail', vendor: 'UA', subject: 'Updated',
      from_address: 'ua@ua.com', received_ago: '2h', status: 'needs_review',
      parsed: null, suggested_trip: undefined, suggested_confidence: undefined, note: undefined,
    };
    getCapturedCb()!({ eventType: 'UPDATE', new: row, old: {} });
    expect(handler).toHaveBeenCalledWith({
      eventType: 'UPDATE',
      item: expect.objectContaining({ id: 'ib2', from: 'ua@ua.com', status: 'needs_review' }),
    });
  });

  it('maps DELETE payload to id-only change and calls onChange', () => {
    const { channelObj, getCapturedCb } = makeChannelObj();
    mockSupabase.channel.mockReturnValue(channelObj);
    const handler = vi.fn();
    subscribeInbox('u1', handler);
    getCapturedCb()!({ eventType: 'DELETE', new: {}, old: { id: 'ib3' } });
    expect(handler).toHaveBeenCalledWith({ eventType: 'DELETE', id: 'ib3' });
  });
});

// ── Seed ──────────────────────────────────────────────────────────────────────

describe('seedFromFixtures', () => {
  const sampleTrip: Trip = {
    id: 'tr-1', destination: 'Rome', region: 'Lazio', country: 'Italy',
    stage: 'dreaming', categories: ['couple'], start_date: null, end_date: null,
    date_approx: null, budget_total: 5000, budget_spent: 0, budget_currency: 'USD',
    travelers: ['t1'], cover: { hue: 30, label: 'terra' }, notes: '', nights: 7,
  };
  const sampleDetail: TripDetail = {
    itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [],
  };
  const sampleInsight: Insight = {
    id: 'i1', trip_id: 'tr-1', type: 'weather', severity: 'info', title: 'Rain', body: 'Pack coat',
  };
  const sampleInboxItem: InboxItem = {
    id: 'ib1', source: 'email', vendor: 'AA', subject: 'Flight', from: 'aa@aa.com',
    received_ago: '1h', status: 'parsed', parsed: null,
    suggested_trip: 'tr-1', suggested_confidence: 0.9, note: 'auto-parsed',
  };
  const sampleTraveler: Traveler = { id: 't1', name: 'Quincy', relationship: 'self', initials: 'Q' };

  const seedData = {
    trips: [sampleTrip],
    tripDetails: { 'tr-1': sampleDetail },
    insights: [sampleInsight],
    inbox: [sampleInboxItem],
    travelers: [sampleTraveler],
  };

  it('upserts all tables when no seed data exists', async () => {
    // hasSeededData returns false (count=0), then upserts succeed
    const chain = makeChain({ data: null, error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    await seedFromFixtures('u1', seedData);
    // from() called multiple times: once for hasSeededData check + once per table
    expect(mockFrom).toHaveBeenCalled();
    expect(chain.upsert).toHaveBeenCalled();
  });

  it('skips upserts when data already seeded', async () => {
    // hasSeededData returns true (count=3)
    const chain = makeChain({ data: null, error: null, count: 3 });
    mockFrom.mockReturnValue(chain);
    await seedFromFixtures('u1', seedData);
    // from() only called once (the hasSeededData check) — no upserts
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('seeds splits when present in tripDetails', async () => {
    const chain = makeChain({ data: null, error: null, count: 0 });
    mockFrom.mockReturnValue(chain);
    const splits = [{ travelerId: 't1', paid: 1200, share: 710 }];
    const detailWithSplits: TripDetail = { itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [], splits };
    await seedFromFixtures('u1', { ...seedData, tripDetails: { 'tr-1': detailWithSplits } });
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ splits })]),
      expect.any(Object),
    );
  });
});

describe('fetchInboxToken', () => {
  it('returns the token for a user', async () => {
    mockFrom.mockReturnValue(makeChain({ data: { token: 'a1b2c3' }, error: null }));
    expect(await fetchInboxToken('u1')).toBe('a1b2c3');
    expect(mockFrom).toHaveBeenCalledWith('user_inbox_tokens');
  });

  it('returns null when the user has no token yet', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    expect(await fetchInboxToken('u1')).toBeNull();
  });

  it('returns null when the query errors', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'boom' } }));
    expect(await fetchInboxToken('u1')).toBeNull();
  });
});
