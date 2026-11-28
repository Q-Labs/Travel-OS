import { supabase } from './supabase';
import { rowToInboxItem, rowToTrip, rowToTripDetail } from './rows';
import type { Trip, TripDetail, Insight, InboxItem, Traveler } from './types';

// ── Auth ──────────────────────────────────────────────────────────────────────

/** The current Supabase session, or null when nobody is signed in. */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Where every sign-in method sends the user once Supabase has authenticated them.
// Must be on the project's allowed redirect URL list (see README).
const appUrl = () => `${window.location.origin}/app/pipeline`;

/**
 * Emails a one-time sign-in link that returns the user to the pipeline. The
 * error is handed back, not thrown, so the form can show it.
 */
export async function signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: appUrl() },
  });
  return { error: error as Error | null };
}

/** Signs in with an email and password. The error is handed back, not thrown, so the form can show it. */
export async function signInWithPassword(email: string, password: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error as Error | null };
}

/**
 * Starts sign-in with an outside provider. On success the browser is redirected
 * to the provider, so the promise only matters when the flow could not start
 * (for example the provider is disabled).
 */
export async function signInWithOAuth(provider: 'google' | 'apple'): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: appUrl() },
  });
  return { error: error as Error | null };
}

/** Signs the current user out. */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

type AuthSession = Awaited<ReturnType<typeof getSession>>;

/** Calls back with the new session whenever the user signs in or out. Returns a handle to stop listening. */
export function subscribeAuthChange(
  callback: (session: AuthSession) => void,
): { unsubscribe: () => void } {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => callback(session),
  );
  return { unsubscribe: () => subscription.unsubscribe() };
}

// ── Seed detection ────────────────────────────────────────────────────────────

/** Whether the user already has any trips. First sign-in uses this to decide whether to load the fixture data. */
export async function hasSeededData(userId: string): Promise<boolean> {
  const { count } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return (count ?? 0) > 0;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

/** Loads the user's trips, oldest first. A failed load returns an empty list, not an error. */
export async function fetchTrips(userId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');
  if (error || !data) return [];
  return data.map(rowToTrip);
}

/** Loads the detail row of each of the user's trips, keyed by trip id. A failed load returns an empty object. */
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

/** Loads the user's insights, leaving out any they dismissed. A failed load returns an empty list. */
export async function fetchInsights(userId: string): Promise<Insight[]> {
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .eq('user_id', userId)
    .is('dismissed_at', null);
  if (error || !data) return [];
  return data as Insight[];
}

/** Loads the user's forwarded emails. A failed load returns an empty list. */
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

/** Loads the user's travelers. A failed load returns an empty list. */
export async function fetchTravelers(userId: string): Promise<Traveler[]> {
  const { data, error } = await supabase
    .from('travelers')
    .select('*')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data as Traveler[];
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Saves a trip, creating its row or updating it. A failed write is logged, not thrown. */
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
      ...(trip.stage_changed_at ? { stage_changed_at: trip.stage_changed_at } : {}),
    },
    { onConflict: 'id,user_id' },
  );
  if (error) console.warn('[db] upsertTrip:', error.message);
}

/**
 * Saves a trip's detail (itinerary, bookings, budget lines, packing, documents
 * and splits) as one row. A failed write is logged, not thrown.
 */
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

/**
 * Records a dismissal instead of deleting the row. The nightly cron rewrites
 * generated insights under deterministic ids, so a deleted one would simply
 * reappear the next morning; a dismissed one is skipped by `fetchInsights`
 * and left alone by the cron's upsert.
 */
export async function deleteInsight(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('insights')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) console.warn('[db] deleteInsight:', error.message);
}

/** Removes a forwarded email from the inbox. A failed delete is logged, not thrown. */
export async function deleteInboxItem(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('inbox_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) console.warn('[db] deleteInboxItem:', error.message);
}

/** Adds a forwarded email to the inbox. A failed insert is logged, not thrown. */
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

/**
 * Calls back whenever the user's inbox changes in the database, such as the
 * ingest function filing a new email, so the inbox updates without a reload.
 * Returns a handle to stop listening.
 */
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

/**
 * Waits for one seed write and logs its error, naming the table, as the other
 * writers in this file do. Says whether it worked.
 */
async function seedWrite(
  table: string,
  write: PromiseLike<{ error: { message: string } | null }>,
): Promise<boolean> {
  const { error } = await write;
  if (error) console.warn(`[db] seedFromFixtures ${table}:`, error.message);
  return !error;
}

/**
 * Loads the fixture trips, details, insights, inbox items and travelers into
 * the user's account, unless it already has trips. The trips go in first, with
 * the travelers, because a trip's details have a foreign key to it and would
 * be rejected if they arrived before it. If the trips cannot be written, nothing
 * else is, so the account stays empty and the next sign-in tries again. Every
 * failed write is logged. A failure after the trips are in still leaves the
 * account part seeded, since `hasSeededData` goes by the trips.
 */
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

  const [, tripsWritten] = await Promise.all([
    seedWrite('travelers', supabase.from('travelers').upsert(
      data.travelers.map((t) => ({ ...t, user_id: userId })),
      { onConflict: 'id,user_id' },
    )),
    seedWrite('trips', supabase.from('trips').upsert(
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
    )),
  ]);
  if (!tripsWritten) return;

  await Promise.all([
    seedWrite('trip_details', supabase.from('trip_details').upsert(
      Object.entries(data.tripDetails).map(([tripId, detail]) => ({
        trip_id: tripId, user_id: userId,
        itinerary: detail.itinerary, bookings: detail.bookings,
        budget_breakdown: detail.budget_breakdown, packing: detail.packing,
        documents: detail.documents, splits: detail.splits,
      })),
      { onConflict: 'trip_id,user_id' },
    )),
    seedWrite('insights', supabase.from('insights').upsert(
      data.insights.map((i) => ({ ...i, user_id: userId })),
      { onConflict: 'id,user_id' },
    )),
    seedWrite('inbox_items', supabase.from('inbox_items').upsert(
      data.inbox.map((item) => ({
        id: item.id, user_id: userId,
        source: item.source, vendor: item.vendor, subject: item.subject,
        from_address: item.from, received_ago: item.received_ago, status: item.status,
        parsed: item.parsed, suggested_trip: item.suggested_trip,
        suggested_confidence: item.suggested_confidence, note: item.note,
      })),
      { onConflict: 'id,user_id' },
    )),
  ]);
}
