import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { buildCalendar } from '../../apps/web/src/lib/ical';
import { rowToTrip, rowToTripDetail } from '../../apps/web/src/lib/rows';
import type { TripDetail } from '../../apps/web/src/lib/types';

/**
 * Read-only iCal feed, addressed by the same per-user token the forwarding
 * inbox uses. Calendar clients poll this on their own schedule and can't carry
 * a session cookie, so the unguessable token in the URL is the credential —
 * which is also why the response must never sit in a shared cache.
 */

function tokenFrom(req: Request): string | null {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get('token');
  if (fromQuery) return fromQuery;
  const last = url.pathname.split('/').filter(Boolean).pop();
  // The last segment is 'calendar' itself when no token was supplied.
  return last && last !== 'calendar' ? last : null;
}

export function createCalendarHandler({
  supabase,
  now,
}: {
  supabase: SupabaseClient;
  now: () => Date;
}) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const token = tokenFrom(req);
    if (!token) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: tokenRow } = await supabase
      .from('user_inbox_tokens')
      .select('user_id')
      .eq('token', token)
      .maybeSingle();
    const userId = (tokenRow as { user_id: string } | null)?.user_id;
    if (!userId) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: tripRows, error } = await supabase.from('trips').select('*').eq('user_id', userId);
    if (error || !tripRows) {
      return Response.json({ error: 'Failed to load trips' }, { status: 500 });
    }

    const { data: detailRows } = await supabase
      .from('trip_details')
      .select('*')
      .eq('user_id', userId);
    const details: Record<string, TripDetail> = {};
    for (const row of (detailRows ?? []) as Record<string, unknown>[]) {
      details[row['trip_id'] as string] = rowToTripDetail(row);
    }

    const ics = buildCalendar(
      (tripRows as Record<string, unknown>[]).map(rowToTrip),
      details,
      { now: now() },
    );

    return new Response(ics, {
      status: 200,
      headers: {
        'content-type': 'text/calendar; charset=utf-8',
        'content-disposition': 'inline; filename="travel-os.ics"',
        'cache-control': 'private, max-age=3600',
      },
    });
  };
}

/** Production wiring, exported so the default is covered by tests. */
export const defaultNow = (): Date => new Date();

export default createCalendarHandler({
  supabase: createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  ),
  now: defaultNow,
});
