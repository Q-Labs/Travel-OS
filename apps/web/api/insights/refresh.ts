import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fetchForecast, geocode, type FetchFn } from '../../src/lib/clients/openMeteo';
import {
  FORECAST_HORIZON_DAYS,
  generateInsights,
  tripsNeedingForecast,
  type DailyForecast,
} from '../../src/lib/insights';
import { rowToTrip, rowToTripDetail } from '../../src/lib/rows';
import type { Insight, TripDetail } from '../../src/lib/types';

/**
 * Regenerates derived insights (weather, packing, passport, stale-stage) for
 * every user, or for one user when a `userId` is posted.
 *
 * Runs on a daily Vercel cron (which invokes it as a GET carrying
 * `Authorization: Bearer $CRON_SECRET`) and can also be triggered by hand with
 * the `x-ingest-secret` header the ingest endpoint already uses.
 */

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env['CRON_SECRET'];
  const bearer = req.headers.get('authorization');
  if (cronSecret && bearer === `Bearer ${cronSecret}`) return true;

  const ingestSecret = process.env['INGEST_SECRET'];
  const provided = req.headers.get('x-ingest-secret');
  return Boolean(ingestSecret) && provided === ingestSecret;
}

async function readUserId(req: Request): Promise<string | null> {
  if (req.method !== 'POST') return null;
  try {
    const body = (await req.json()) as { userId?: string };
    return body.userId ?? null;
  } catch {
    // A cron or a bodyless manual POST is a full refresh, not an error.
    return null;
  }
}

export function createInsightsHandler({
  supabase,
  fetchFn,
  now,
}: {
  supabase: SupabaseClient;
  fetchFn: FetchFn;
  now: () => Date;
}) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    if (!isAuthorized(req)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = now();
    const scopedUserId = await readUserId(req);

    let userIds: string[];
    if (scopedUserId) {
      userIds = [scopedUserId];
    } else {
      const { data, error } = await supabase.from('trips').select('user_id');
      if (error || !data) {
        return Response.json({ error: 'Failed to list users' }, { status: 500 });
      }
      userIds = [...new Set((data as { user_id: string }[]).map((r) => r.user_id))];
    }

    let written = 0;
    for (const userId of userIds) {
      const { data: tripRows, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId);
      if (tripsError || !tripRows) {
        return Response.json({ error: 'Failed to load trips' }, { status: 500 });
      }
      const trips = (tripRows as Record<string, unknown>[]).map(rowToTrip);

      const { data: detailRows } = await supabase
        .from('trip_details')
        .select('*')
        .eq('user_id', userId);
      const details: Record<string, TripDetail> = {};
      for (const row of (detailRows ?? []) as Record<string, unknown>[]) {
        details[row['trip_id'] as string] = rowToTripDetail(row);
      }

      // Only geocode trips close enough for Open-Meteo to forecast usefully.
      const forecasts: Record<string, DailyForecast[]> = {};
      for (const trip of tripsNeedingForecast(trips, today)) {
        const place = await geocode(trip.destination, fetchFn);
        if (!place) continue;
        const daily = await fetchForecast(place.lat, place.lon, FORECAST_HORIZON_DAYS, fetchFn);
        if (daily.length > 0) forecasts[trip.id] = daily;
      }

      const insights = generateInsights({ trips, details, forecasts, today });
      if (insights.length === 0) continue;

      const { error: upsertError } = await supabase
        .from('insights')
        .upsert(
          insights.map((insight: Insight) => ({ ...insight, user_id: userId })),
          { onConflict: 'id,user_id' },
        );
      if (upsertError) {
        return Response.json({ error: 'Failed to persist insights' }, { status: 500 });
      }
      written += insights.length;
    }

    return Response.json({ users: userIds.length, insights: written }, { status: 200 });
  };
}

/** Production wiring, exported so the defaults are covered by tests. */
export const defaultFetch: FetchFn = (url) => fetch(url);
export const defaultNow = (): Date => new Date();

export default createInsightsHandler({
  supabase: createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  ),
  fetchFn: defaultFetch,
  now: defaultNow,
});
