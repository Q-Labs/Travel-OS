import { describe, expect, it } from 'vitest';
import {
  FORECAST_HORIZON_DAYS,
  PACKING_LEAD_DAYS,
  STALE_STAGE_DAYS,
  generateInsights,
  packingReminderInsight,
  passportExpiryInsights,
  staleStageInsight,
  forecastRange,
  tripsNeedingForecast,
  weatherInsight,
} from './insights';
import type { DailyForecast } from './insights';
import type { Trip, TripDetail } from './types';

const TODAY = new Date('2026-04-20T00:00:00Z');

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'tr-test',
    destination: 'Lisbon',
    region: 'Estremadura',
    country: 'Portugal',
    stage: 'planning',
    categories: ['couple'],
    start_date: null,
    end_date: null,
    date_approx: null,
    budget_total: 5000,
    budget_spent: 0,
    budget_currency: 'USD',
    travelers: ['t1'],
    cover: { hue: 30, label: 'test' },
    notes: '',
    nights: 5,
    ...overrides,
  };
}

function makeDetail(overrides: Partial<TripDetail> = {}): TripDetail {
  return {
    itinerary: [],
    bookings: [],
    budget_breakdown: [],
    packing: [],
    documents: [],
    ...overrides,
  };
}

function forecast(days: Partial<DailyForecast>[]): DailyForecast[] {
  return days.map((d, i) => ({
    date: `2026-04-${String(21 + i).padStart(2, '0')}`,
    tempMaxC: 20,
    tempMinC: 12,
    precipitationProbability: 0,
    ...d,
  }));
}

describe('staleStageInsight', () => {
  it('flags a dreaming trip that has sat past the threshold', () => {
    const trip = makeTrip({ stage: 'dreaming', daysInStage: STALE_STAGE_DAYS + 10 });
    const insight = staleStageInsight(trip);
    expect(insight).not.toBeNull();
    expect(insight?.type).toBe('stage_stale');
    expect(insight?.id).toBe('stale-tr-test');
    expect(insight?.trip_id).toBe('tr-test');
    expect(insight?.severity).toBe('info');
    expect(insight?.title).toContain('Lisbon');
  });

  it('flags a planning trip too', () => {
    const trip = makeTrip({ stage: 'planning', daysInStage: STALE_STAGE_DAYS });
    expect(staleStageInsight(trip)?.type).toBe('stage_stale');
  });

  it('ignores trips that have not been sitting long enough', () => {
    const trip = makeTrip({ stage: 'dreaming', daysInStage: STALE_STAGE_DAYS - 1 });
    expect(staleStageInsight(trip)).toBeNull();
  });

  it('ignores stages past planning', () => {
    const trip = makeTrip({ stage: 'booked', daysInStage: STALE_STAGE_DAYS + 99 });
    expect(staleStageInsight(trip)).toBeNull();
  });

  it('falls back to created_days_ago when days_in_stage is absent', () => {
    const trip = makeTrip({ stage: 'dreaming', created_days_ago: STALE_STAGE_DAYS + 5 });
    expect(staleStageInsight(trip)).not.toBeNull();
  });

  it('returns null when the trip carries no age information at all', () => {
    expect(staleStageInsight(makeTrip({ stage: 'dreaming' }))).toBeNull();
  });
});

describe('passportExpiryInsights', () => {
  it('warns when a passport expires inside the six-month buffer after the trip', () => {
    const trip = makeTrip({ start_date: '2026-07-01', end_date: '2026-07-10' });
    const detail = makeDetail({
      documents: [{ type: 'passport', title: 'Maren passport', expiry: '2026-10-01' }],
    });
    const [insight] = passportExpiryInsights(trip, detail, TODAY);
    expect(insight?.type).toBe('passport_expiry');
    expect(insight?.severity).toBe('warning');
    expect(insight?.id).toBe('pass-tr-test-maren-passport');
    expect(insight?.title).toContain('Maren passport');
  });

  it('escalates to urgent when the passport expires before the trip ends', () => {
    const trip = makeTrip({ start_date: '2026-07-01', end_date: '2026-07-10' });
    const detail = makeDetail({
      documents: [{ type: 'passport', title: 'Quincy passport', expiry: '2026-07-05' }],
    });
    expect(passportExpiryInsights(trip, detail, TODAY)[0]?.severity).toBe('urgent');
  });

  it('stays quiet when the passport has plenty of validity left', () => {
    const trip = makeTrip({ start_date: '2026-07-01', end_date: '2026-07-10' });
    const detail = makeDetail({
      documents: [{ type: 'passport', title: 'Quincy passport', expiry: '2029-03-14' }],
    });
    expect(passportExpiryInsights(trip, detail, TODAY)).toHaveLength(0);
  });

  it('ignores non-passport documents and passports with no expiry', () => {
    const trip = makeTrip({ start_date: '2026-07-01', end_date: '2026-07-10' });
    const detail = makeDetail({
      documents: [
        { type: 'confirmation', title: 'TAP e-ticket.pdf' },
        { type: 'passport', title: 'Lost passport' },
        { type: 'passport', title: 'Null passport', expiry: null },
      ],
    });
    expect(passportExpiryInsights(trip, detail, TODAY)).toHaveLength(0);
  });

  it('returns nothing for a trip with no end date', () => {
    const detail = makeDetail({
      documents: [{ type: 'passport', title: 'Quincy passport', expiry: '2026-05-01' }],
    });
    expect(passportExpiryInsights(makeTrip(), detail, TODAY)).toHaveLength(0);
  });

  it('reports every expiring passport on the trip', () => {
    const trip = makeTrip({ start_date: '2026-07-01', end_date: '2026-07-10' });
    const detail = makeDetail({
      documents: [
        { type: 'passport', title: 'Quincy passport', expiry: '2026-09-01' },
        { type: 'passport', title: 'Maren passport', expiry: '2026-10-01' },
      ],
    });
    const ids = passportExpiryInsights(trip, detail, TODAY).map((i) => i.id);
    expect(ids).toEqual(['pass-tr-test-quincy-passport', 'pass-tr-test-maren-passport']);
  });
});

describe('packingReminderInsight', () => {
  it('fires inside the lead window and counts what is left', () => {
    const trip = makeTrip({ start_date: '2026-04-25' });
    const detail = makeDetail({
      packing: [
        { category: 'clothing', item: 'Shirts', qty: 3, packed: true },
        { category: 'clothing', item: 'Boots', qty: 1, packed: false },
      ],
    });
    const insight = packingReminderInsight(trip, detail, TODAY);
    expect(insight?.type).toBe('packing_reminder');
    expect(insight?.id).toBe('pack-tr-test');
    expect(insight?.body).toContain('1');
  });

  it('stays quiet outside the lead window', () => {
    const trip = makeTrip({ start_date: '2026-06-01' });
    const detail = makeDetail({
      packing: [{ category: 'clothing', item: 'Boots', qty: 1, packed: false }],
    });
    expect(packingReminderInsight(trip, detail, TODAY)).toBeNull();
  });

  it('stays quiet once the trip has already started', () => {
    const trip = makeTrip({ start_date: '2026-04-19' });
    const detail = makeDetail({
      packing: [{ category: 'clothing', item: 'Boots', qty: 1, packed: false }],
    });
    expect(packingReminderInsight(trip, detail, TODAY)).toBeNull();
  });

  it('stays quiet when everything is already packed', () => {
    const trip = makeTrip({ start_date: '2026-04-25' });
    const detail = makeDetail({
      packing: [{ category: 'clothing', item: 'Boots', qty: 1, packed: true }],
    });
    expect(packingReminderInsight(trip, detail, TODAY)).toBeNull();
  });

  it('stays quiet when there is no packing list and no start date', () => {
    expect(packingReminderInsight(makeTrip({ start_date: '2026-04-25' }), makeDetail(), TODAY)).toBeNull();
    expect(packingReminderInsight(makeTrip(), makeDetail(), TODAY)).toBeNull();
  });

  it('fires on the last day of the lead window', () => {
    const trip = makeTrip({ start_date: '2026-04-27' });
    const detail = makeDetail({
      packing: [{ category: 'clothing', item: 'Boots', qty: 1, packed: false }],
    });
    expect(PACKING_LEAD_DAYS).toBe(7);
    expect(packingReminderInsight(trip, detail, TODAY)).not.toBeNull();
  });
});

describe('weatherInsight', () => {
  it('summarises the forecast', () => {
    const trip = makeTrip({ start_date: '2026-04-21' });
    const insight = weatherInsight(trip, forecast([{ tempMaxC: 18 }, { tempMaxC: 22 }]));
    expect(insight?.type).toBe('weather');
    expect(insight?.id).toBe('wx-tr-test');
    expect(insight?.severity).toBe('info');
    expect(insight?.title).toContain('Lisbon');
    expect(insight?.title).toContain('20');
  });

  it('warns and mentions rain when most days are wet', () => {
    const trip = makeTrip({ start_date: '2026-04-21' });
    const insight = weatherInsight(
      trip,
      forecast([{ precipitationProbability: 80 }, { precipitationProbability: 90 }]),
    );
    expect(insight?.severity).toBe('warning');
    expect(insight?.body.toLowerCase()).toContain('rain');
  });

  it('returns null with no forecast data', () => {
    expect(weatherInsight(makeTrip(), [])).toBeNull();
  });
});

describe('tripsNeedingForecast', () => {
  it('selects only dated, non-archived trips inside the horizon', () => {
    const trips = [
      makeTrip({ id: 'soon', start_date: '2026-04-25' }),
      makeTrip({ id: 'far', start_date: '2026-09-01' }),
      makeTrip({ id: 'undated' }),
      makeTrip({ id: 'past', start_date: '2026-04-01' }),
      makeTrip({ id: 'archived', start_date: '2026-04-25', stage: 'archived' }),
    ];
    expect(tripsNeedingForecast(trips, TODAY).map((t) => t.id)).toEqual(['soon']);
  });

  it('includes a trip departing exactly at the horizon edge', () => {
    const edge = new Date(TODAY);
    edge.setUTCDate(edge.getUTCDate() + FORECAST_HORIZON_DAYS);
    const iso = edge.toISOString().slice(0, 10);
    expect(tripsNeedingForecast([makeTrip({ id: 'edge', start_date: iso })], TODAY)).toHaveLength(1);
  });
});

describe('generateInsights', () => {
  it('collects every kind of insight across trips', () => {
    const trips = [
      makeTrip({ id: 'tr-stale', stage: 'dreaming', daysInStage: STALE_STAGE_DAYS + 1 }),
      makeTrip({ id: 'tr-soon', start_date: '2026-04-25', end_date: '2026-04-30' }),
      makeTrip({ id: 'tr-archived', stage: 'archived', daysInStage: STALE_STAGE_DAYS + 1 }),
    ];
    const details: Record<string, TripDetail> = {
      'tr-soon': makeDetail({
        packing: [{ category: 'clothing', item: 'Boots', qty: 1, packed: false }],
        documents: [{ type: 'passport', title: 'Quincy passport', expiry: '2026-06-01' }],
      }),
    };
    const insights = generateInsights({
      trips,
      details,
      forecasts: { 'tr-soon': forecast([{ tempMaxC: 19 }]) },
      today: TODAY,
    });
    const types = insights.map((i) => i.type).sort();
    expect(types).toEqual(['packing_reminder', 'passport_expiry', 'stage_stale', 'weather']);
    expect(insights.every((i) => i.trip_id !== 'tr-archived')).toBe(true);
  });

  it('is idempotent — identical input yields identical ids', () => {
    const input = {
      trips: [makeTrip({ id: 'tr-stale', stage: 'dreaming', daysInStage: 400 })],
      details: {},
      forecasts: {},
      today: TODAY,
    };
    expect(generateInsights(input).map((i) => i.id)).toEqual(generateInsights(input).map((i) => i.id));
  });

  it('handles trips with no detail row and no forecast', () => {
    const trips = [makeTrip({ id: 'tr-bare', start_date: '2026-04-25' })];
    expect(generateInsights({ trips, details: {}, forecasts: {}, today: TODAY })).toEqual([]);
  });
});

describe('passportExpiryInsights — finished trips', () => {
  it('stays quiet once the trip is already over', () => {
    const trip = makeTrip({ start_date: '2026-01-01', end_date: '2026-01-10' });
    const detail = makeDetail({
      documents: [{ type: 'passport', title: 'Quincy passport', expiry: '2026-02-01' }],
    });
    expect(passportExpiryInsights(trip, detail, TODAY)).toHaveLength(0);
  });
});

describe('review findings', () => {
  it('gives every passport on a trip a distinct id even when titles match', () => {
    const trip = makeTrip({ start_date: '2026-07-01', end_date: '2026-07-10' });
    const detail = makeDetail({
      documents: [
        { type: 'passport', title: 'Family passports', expiry: '2026-09-01' },
        { type: 'passport', title: 'Family passports', expiry: '2026-09-15' },
      ],
    });
    const ids = passportExpiryInsights(trip, detail, TODAY).map((i) => i.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('still forecasts a trip that has already started', () => {
    const started = makeTrip({ id: 'now', start_date: '2026-04-18', end_date: '2026-04-24' });
    expect(tripsNeedingForecast([started], TODAY).map((t) => t.id)).toEqual(['now']);
  });

  it('excludes a trip that has already finished', () => {
    const done = makeTrip({ id: 'done', start_date: '2026-04-01', end_date: '2026-04-05' });
    expect(tripsNeedingForecast([done], TODAY)).toHaveLength(0);
  });

  it('reports the date window a trip actually needs forecasting for', () => {
    const trip = makeTrip({ start_date: '2026-04-25', end_date: '2026-04-28' });
    expect(forecastRange(trip, TODAY)).toEqual({ startDate: '2026-04-25', endDate: '2026-04-28' });
  });

  it('clamps the window to what Open-Meteo can actually answer', () => {
    const trip = makeTrip({ start_date: '2026-04-25', end_date: '2026-12-31' });
    const range = forecastRange(trip, TODAY);
    expect(range?.endDate).toBe('2026-05-04');
  });

  it('starts an in-progress trip window at today, not in the past', () => {
    const trip = makeTrip({ start_date: '2026-04-18', end_date: '2026-04-24' });
    expect(forecastRange(trip, TODAY)?.startDate).toBe('2026-04-20');
  });

  it('has no window for an undated trip', () => {
    expect(forecastRange(makeTrip(), TODAY)).toBeNull();
  });

  it('uses the start date alone for a single-day trip with no end date', () => {
    const trip = makeTrip({ start_date: '2026-04-25' });
    expect(forecastRange(trip, TODAY)).toEqual({ startDate: '2026-04-25', endDate: '2026-04-25' });
  });

  it('has no window once the whole trip is beyond the horizon', () => {
    const trip = makeTrip({ start_date: '2026-09-01', end_date: '2026-09-10' });
    expect(forecastRange(trip, TODAY)).toBeNull();
  });
});
