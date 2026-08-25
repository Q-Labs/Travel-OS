import type { Insight, Trip, TripDetail } from './types';
import { daysBetween, fmtDate } from './utils';

/** A trip sitting in an early stage this long is worth nudging. */
export const STALE_STAGE_DAYS = 120;
/** Packing reminders start this many days before departure. */
export const PACKING_LEAD_DAYS = 7;
/** Most Schengen-style rules want six months of passport validity past the trip. */
export const PASSPORT_BUFFER_DAYS = 183;
/** Open-Meteo only returns a useful forecast this far out. */
export const FORECAST_HORIZON_DAYS = 14;
/** Daily precipitation probability at or above this counts as a wet day. */
const WET_DAY_THRESHOLD = 50;

const STALE_STAGES: Trip['stage'][] = ['dreaming', 'planning'];

/** One day of Open-Meteo daily forecast, already unwrapped from the API's parallel arrays. */
export type DailyForecast = {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationProbability: number;
};

export type GenerateInsightsInput = {
  trips: Trip[];
  details: Record<string, TripDetail>;
  forecasts: Record<string, DailyForecast[]>;
  today: Date;
};

/** Stable, url-safe fragment of a document title, so insight ids survive reordering. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function staleStageInsight(trip: Trip): Insight | null {
  if (!STALE_STAGES.includes(trip.stage)) return null;
  const age = trip.daysInStage ?? trip.created_days_ago;
  if (age === undefined || age < STALE_STAGE_DAYS) return null;
  const months = Math.floor(age / 30);
  return {
    id: `stale-${trip.id}`,
    trip_id: trip.id,
    type: 'stage_stale',
    severity: 'info',
    title: `${trip.destination} has been ${trip.stage} for ${months} months`,
    body: 'Ready to pick dates and move it forward?',
  };
}

export function passportExpiryInsights(trip: Trip, detail: TripDetail, today: Date): Insight[] {
  const end = trip.end_date;
  if (!end) return [];
  // A trip that has already finished can't be blocked by a passport.
  if (daysBetween(today, end) < 0) return [];

  const insights: Insight[] = [];
  // Two documents can share a title ("Family passports"), and a duplicate id in
  // one upsert makes Postgres reject the whole statement, so repeats are
  // disambiguated with a counter rather than left to collide.
  const seen = new Map<string, number>();
  for (const doc of detail.documents) {
    if (doc.type !== 'passport' || !doc.expiry) continue;
    const slack = daysBetween(end, doc.expiry);
    if (slack >= PASSPORT_BUFFER_DAYS) continue;
    const expired = slack < 0;
    const slug = slugify(doc.title);
    const nth = (seen.get(slug) ?? 0) + 1;
    seen.set(slug, nth);
    insights.push({
      id: nth === 1 ? `pass-${trip.id}-${slug}` : `pass-${trip.id}-${slug}-${nth}`,
      trip_id: trip.id,
      type: 'passport_expiry',
      severity: expired ? 'urgent' : 'warning',
      title: expired
        ? `${doc.title} expires before ${trip.destination} ends`
        : `${doc.title} expires soon after ${trip.destination}`,
      body: `Expires ${fmtDate(doc.expiry, { month: 'short', year: 'numeric' })} — renew before the trip for a six-month buffer.`,
    });
  }
  return insights;
}

export function packingReminderInsight(trip: Trip, detail: TripDetail, today: Date): Insight | null {
  if (!trip.start_date) return null;
  const daysOut = daysBetween(today, trip.start_date);
  if (daysOut < 0 || daysOut > PACKING_LEAD_DAYS) return null;
  const remaining = detail.packing.filter((item) => !item.packed).length;
  if (remaining === 0) return null;
  return {
    id: `pack-${trip.id}`,
    trip_id: trip.id,
    type: 'packing_reminder',
    severity: 'info',
    title: `${trip.destination} packing starts in ${daysOut} days`,
    body: `${detail.packing.length} items on the list — ${remaining} still to pack.`,
  };
}

export function weatherInsight(trip: Trip, daily: DailyForecast[]): Insight | null {
  if (daily.length === 0) return null;
  const avgHigh = Math.round(daily.reduce((sum, d) => sum + d.tempMaxC, 0) / daily.length);
  const avgLow = Math.round(daily.reduce((sum, d) => sum + d.tempMinC, 0) / daily.length);
  const wetDays = daily.filter((d) => d.precipitationProbability >= WET_DAY_THRESHOLD).length;
  const mostlyWet = wetDays * 2 > daily.length;
  return {
    id: `wx-${trip.id}`,
    trip_id: trip.id,
    type: 'weather',
    severity: mostlyWet ? 'warning' : 'info',
    title: `${trip.destination} forecast: ${avgHigh}°C highs`,
    body: `Lows near ${avgLow}°C. Rain likely on ${wetDays} of ${daily.length} forecast days.`,
  };
}

/** Trips close enough to departure that Open-Meteo can actually forecast them. */
export function tripsNeedingForecast(trips: Trip[], today: Date): Trip[] {
  return trips.filter((trip) => {
    if (trip.stage === 'archived' || !trip.start_date) return false;
    // A trip already under way still wants a forecast for its remaining days,
    // so selection keys off the end date; only the start has to be near enough
    // for Open-Meteo to answer at all.
    const endsIn = daysBetween(today, trip.end_date ?? trip.start_date);
    if (endsIn < 0) return false;
    return daysBetween(today, trip.start_date) <= FORECAST_HORIZON_DAYS;
  });
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDays(from: Date, days: number): Date {
  const out = new Date(from);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

/**
 * The date window to actually ask Open-Meteo about: the part of the trip that
 * is still ahead, clamped to the forecast horizon. Asking for `forecast_days`
 * from today instead would summarise the days *before* departure.
 */
/**
 * The trips worth forecasting, each paired with the window to ask about.
 *
 * Combining selection and windowing means callers can't end up holding a trip
 * with no valid range, so there is no impossible branch to guard.
 */
export function forecastTargets(
  trips: Trip[],
  today: Date,
): { trip: Trip; range: { startDate: string; endDate: string } }[] {
  const targets: { trip: Trip; range: { startDate: string; endDate: string } }[] = [];
  for (const trip of tripsNeedingForecast(trips, today)) {
    const range = forecastRange(trip, today);
    if (range) targets.push({ trip, range });
  }
  return targets;
}

export function forecastRange(
  trip: Trip,
  today: Date,
): { startDate: string; endDate: string } | null {
  if (!trip.start_date) return null;
  const todayIso = isoDay(today);
  const startDate = trip.start_date < todayIso ? todayIso : trip.start_date;
  const horizon = isoDay(shiftDays(today, FORECAST_HORIZON_DAYS));
  const wanted = trip.end_date ?? trip.start_date;
  const endDate = wanted > horizon ? horizon : wanted;
  if (endDate < startDate) return null;
  return { startDate, endDate };
}

export function generateInsights({ trips, details, forecasts, today }: GenerateInsightsInput): Insight[] {
  const insights: Insight[] = [];
  for (const trip of trips) {
    if (trip.stage === 'archived') continue;
    const stale = staleStageInsight(trip);
    if (stale) insights.push(stale);

    const detail = details[trip.id];
    if (detail) {
      insights.push(...passportExpiryInsights(trip, detail, today));
      const packing = packingReminderInsight(trip, detail, today);
      if (packing) insights.push(packing);
    }

    const daily = forecasts[trip.id];
    if (daily) {
      const weather = weatherInsight(trip, daily);
      if (weather) insights.push(weather);
    }
  }
  return insights;
}
