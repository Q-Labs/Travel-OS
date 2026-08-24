import { supabase } from './supabase';
import { rowToInboxItem, rowToTrip, rowToTripDetail } from './rows';
import type { Trip, TripDetail, Insight, InboxItem, Traveler } from './types';

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithOtp({ email });
  return { error: error as Error | null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

type AuthSession = Awaited<ReturnType<typeof getSession>>;

export function subscribeAuthChange(
  callback: (session: AuthSession) => void,
): { unsubscribe: () => void } {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => callback(session),
  );
  return { unsubscribe: () => subscription.unsubscribe() };
}

// ── Seed detection ────────────────────────────────────────────────────────────

export async function hasSeededData(userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return (count ?? 0) > 0;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchTrips(userId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');
  if (error || !data) return [];
  return data.map(rowToTrip);
}

export async function fetchTripDetails(userId: string): Promise<Record<string, TripDetail>> {
  const { data, error } = await supabase
    .from('trip_details')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return {};
  return Object.fromEntries(
    data.map((row) => [row.trip_id as string, rowToTripDetail(row)]),
  );
}

export async function fetchInsights(userId: string): Promise<Insight[]> {
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data as Insight[];
}

export async function fetchInboxItems(userId: string): Promise<InboxItem[]> {
  const { data, error } = await supabase
    .from('inbox_items')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data.map(rowToInboxItem);
}

/**
 * The user's routing token — it addresses both the forwarding inbox and the
 * read-only calendar feed, so the UI needs it to show either one.
 */
export async function fetchInboxToken(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_inbox_tokens')
    .select('token')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { token: string }).token;
}

export async function fetchTravelers(userId: string): Promise<Traveler[]> {
  const { data, error } = await supabase
    .from('travelers')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data as Traveler[];
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function upsertTrip(userId: string, trip: Trip): Promise<void> {
  const { error } = await supabase.from('trips').upsert(
    {
      id: trip.id, user_id: userId,
      destination: trip.destination, region: trip.region, country: trip.country,
      stage: trip.stage, categories: trip.categories,
      start_date: trip.start_date, end_date: trip.end_date, date_approx: trip.date_approx,
      budget_total: trip.budget_total, budget_spent: trip.budget_spent,
      budget_currency: trip.budget_currency, travelers: trip.travelers,
      cover_hue: trip.cover.hue, cover_label: trip.cover.label,
      notes: trip.notes, nights: trip.nights,
    },
    { onConflict: 'id,user_id' },
  );
  if (error) console.warn('[db] upsertTrip:', error.message);
}

export async function upsertTripDetail(
  userId: string,
  tripId: string,
  detail: TripDetail,
): Promise<void> {
  const { error } = await supabase.from('trip_details').upsert(
    {
      trip_id: tripId, user_id: userId,
      itinerary: detail.itinerary, bookings: detail.bookings,
      budget_breakdown: detail.budget_breakdown, packing: detail.packing,
      documents: detail.documents, splits: detail.splits,
    },
    { onConflict: 'trip_id,user_id' },
  );
  if (error) console.warn('[db] upsertTripDetail:', error.message);
}

export async function deleteInsight(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('insights')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) console.warn('[db] deleteInsight:', error.message);
}

export async function deleteInboxItem(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('inbox_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) console.warn('[db] deleteInboxItem:', error.message);
}

export async function insertInboxItem(userId: string, item: InboxItem): Promise<void> {
  const { error } = await supabase.from('inbox_items').insert({
    id: item.id,
    user_id: userId,
    source: item.source,
    vendor: item.vendor,
    subject: item.subject,
    from_address: item.from,
    received_ago: item.received_ago,
    status: item.status,
    parsed: item.parsed,
    suggested_trip: item.suggested_trip,
    suggested_confidence: item.suggested_confidence,
    note: item.note,
  });
  if (error) console.warn('[db] insertInboxItem:', error.message);
}

type InboxChange =
  | { eventType: 'INSERT' | 'UPDATE'; item: InboxItem }
  | { eventType: 'DELETE'; id: string };

export function subscribeInbox(
  userId: string,
  onChange: (change: InboxChange) => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel('inbox_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inbox_items', filter: `user_id=eq.${userId}` },
      (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
        if (payload.eventType === 'DELETE') {
          onChange({ eventType: 'DELETE', id: payload.old['id'] as string });
        } else {
          onChange({ eventType: payload.eventType as 'INSERT' | 'UPDATE', item: rowToInboxItem(payload.new) });
        }
      },
    )
    .subscribe();
  return { unsubscribe: () => supabase.removeChannel(channel) };
}

// ── Seed ──────────────────────────────────────────────────────────────────────

export async function seedFromFixtures(
  userId: string,
  data: {
    trips: Trip[];
    tripDetails: Record<string, TripDetail>;
    insights: Insight[];
    inbox: InboxItem[];
    travelers: Traveler[];
  },
): Promise<void> {
  if (await hasSeededData(userId)) return;

  await Promise.all([
    supabase.from('travelers').upsert(
      data.travelers.map((t) => ({ ...t, user_id: userId })),
      { onConflict: 'id,user_id' },
    ),
    supabase.from('trips').upsert(
      data.trips.map((t) => ({
        id: t.id, user_id: userId,
        destination: t.destination, region: t.region, country: t.country,
        stage: t.stage, categories: t.categories,
        start_date: t.start_date, end_date: t.end_date, date_approx: t.date_approx,
        budget_total: t.budget_total, budget_spent: t.budget_spent,
        budget_currency: t.budget_currency, travelers: t.travelers,
        cover_hue: t.cover.hue, cover_label: t.cover.label,
        notes: t.notes, nights: t.nights,
      })),
      { onConflict: 'id,user_id' },
    ),
    supabase.from('trip_details').upsert(
      Object.entries(data.tripDetails).map(([tripId, detail]) => ({
        trip_id: tripId, user_id: userId,
        itinerary: detail.itinerary, bookings: detail.bookings,
        budget_breakdown: detail.budget_breakdown, packing: detail.packing,
        documents: detail.documents, splits: detail.splits,
      })),
      { onConflict: 'trip_id,user_id' },
    ),
    supabase.from('insights').upsert(
      data.insights.map((i) => ({ ...i, user_id: userId })),
      { onConflict: 'id,user_id' },
    ),
    supabase.from('inbox_items').upsert(
      data.inbox.map((item) => ({
        id: item.id, user_id: userId,
        source: item.source, vendor: item.vendor, subject: item.subject,
        from_address: item.from, received_ago: item.received_ago, status: item.status,
        parsed: item.parsed, suggested_trip: item.suggested_trip,
        suggested_confidence: item.suggested_confidence, note: item.note,
      })),
      { onConflict: 'id,user_id' },
    ),
  ]);
}

