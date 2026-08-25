import type { InboxItem, Trip, TripDetail, TripSplit } from './types';

/**
 * Postgres row → domain object mappers.
 *
 * These live apart from `db.ts` so the serverless functions under `api/` can
 * reuse them without pulling in the browser Supabase client.
 */

export function rowToTrip(row: Record<string, unknown>): Trip {
  return {
    id: row['id'] as string,
    destination: row['destination'] as string,
    region: row['region'] as string,
    country: row['country'] as string,
    stage: row['stage'] as Trip['stage'],
    categories: row['categories'] as Trip['categories'],
    start_date: row['start_date'] as string | null,
    end_date: row['end_date'] as string | null,
    date_approx: row['date_approx'] as string | null,
    budget_total: row['budget_total'] as number,
    budget_spent: row['budget_spent'] as number,
    budget_currency: row['budget_currency'] as string,
    travelers: row['travelers'] as string[],
    cover: { hue: row['cover_hue'] as number, label: row['cover_label'] as string },
    notes: row['notes'] as string,
    nights: row['nights'] as number,
    created_days_ago: row['created_days_ago'] as number | undefined,
    daysInStage: row['days_in_stage'] as number | undefined,
  };
}

export function rowToTripDetail(row: Record<string, unknown>): TripDetail {
  return {
    itinerary: row['itinerary'] as TripDetail['itinerary'],
    bookings: row['bookings'] as TripDetail['bookings'],
    budget_breakdown: row['budget_breakdown'] as TripDetail['budget_breakdown'],
    packing: row['packing'] as TripDetail['packing'],
    documents: row['documents'] as TripDetail['documents'],
    splits: (row['splits'] as TripSplit[] | null) ?? undefined,
  };
}

export function rowToInboxItem(row: Record<string, unknown>): InboxItem {
  return {
    id: row['id'] as string,
    source: row['source'] as InboxItem['source'],
    vendor: row['vendor'] as string,
    subject: row['subject'] as string,
    from: row['from_address'] as string,
    received_ago: row['received_ago'] as string,
    status: row['status'] as InboxItem['status'],
    parsed: row['parsed'] as InboxItem['parsed'],
    suggested_trip: row['suggested_trip'] as string | undefined,
    suggested_confidence: row['suggested_confidence'] as number | undefined,
    note: row['note'] as string | undefined,
  };
}
