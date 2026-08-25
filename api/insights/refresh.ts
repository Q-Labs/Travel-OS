import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fetchForecast, geocode, type FetchFn } from '../../apps/web/src/lib/clients/openMeteo';
import {
  forecastTargets,
  generateInsights,
  type DailyForecast,
} from '../../apps/web/src/lib/insights';
import { rowToTrip, rowToTripDetail } from '../../apps/web/src/lib/rows';
import type { Insight, TripDetail } from '../../apps/web/src/lib/types';

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

    // daysBetween rounds, so a mid-afternoon manual trigger would otherwise
    // land a day off. Every rule reasons in whole days from midnight.
    const raw = now();
    const today = new Date(Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate()));
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
    let failed = 0;
    for (const userId of userIds) {
      try {
      const { data: tripRows, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId);
      if (tripsError || !tripRows) {
        throw new Error('Failed to load trips');
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

      // Only geocode trips close enough for Open-Meteo to forecast usefully,
      // and ask about the trip's own dates rather than the next N days.
      const forecasts: Record<string, DailyForecast[]> = {};
      for (const { trip, range } of forecastTargets(trips, today)) {
        const place = await geocode(trip.destination, fetchFn);
        if (!place) continue;
        const daily = await fetchForecast(place.lat, place.lon, range, fetchFn);
        if (daily.length > 0) forecasts[trip.id] = daily;
      }

      const insights = generateInsights({ trips, details, forecasts, today });

      if (insights.length > 0) {
        // `dismissed_at` is deliberately absent from the payload: on conflict
        // only the listed columns are updated, so a dismissal survives the
        // nightly rewrite instead of being resurrected.
        const { error: upsertError } = await supabase
          .from('insights')
          .upsert(
            insights.map((insight: Insight) => ({ ...insight, user_id: userId, generated: true })),
            { onConflict: 'id,user_id' },
          );
        if (upsertError) throw new Error('Failed to persist insights');
        written += insights.length;
      }

      // Reconcile: drop generated insights whose condition no longer holds
      // (packing finished, trip departed). Scoped to `generated` so seeded and
      // hand-authored rows are never touched.
      const live = insights.map((i) => i.id);
      let stale = supabase.from('insights').delete().eq('user_id', userId).eq('generated', true);
      if (live.length > 0) stale = stale.not('id', 'in', `(${live.join(',')})`);
      const { error: pruneError } = await stale;
      if (pruneError) throw new Error('Failed to prune insights');
      } catch {
        // One user's bad data must not starve everyone queued behind them.
        failed += 1;
      }
    }

    if (failed > 0 && failed === userIds.length) {
      return Response.json({ error: 'Every user failed to refresh' }, { status: 500 });
    }
    return Response.json(
      { users: userIds.length, insights: written, failed },
      { status: 200 },
    );
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
