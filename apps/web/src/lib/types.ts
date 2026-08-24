export type TripStage = 'dreaming' | 'planning' | 'booked' | 'upcoming' | 'archived';
export type TripCategory = 'family' | 'couple' | 'solo' | 'race' | 'friends' | 'work';
export type TravelerRelationship = 'self' | 'spouse' | 'child' | 'friend';
export type BookingCategory = 'flight' | 'lodging' | 'transport' | 'activity' | 'dining' | 'other';
export type BookingStatus = 'done' | 'pending' | 'todo' | 'parsing' | 'needs_review';
export type BookingSource = 'gmail' | 'email' | 'manual' | 'api' | 'viator' | 'extension';
export type InsightType = 'stage_stale' | 'price_drop' | 'passport_expiry' | 'packing_reminder' | 'weather';
export type InsightSeverity = 'info' | 'warning' | 'urgent';
export type InboxStatus = 'parsed' | 'parsing' | 'needs_review' | 'pending_trip';
export type IntegrationStatus = 'active' | 'email-only' | 'available';
export type DocumentType = 'passport' | 'visa' | 'confirmation';
export type PackingCategory = 'clothing' | 'documents' | 'electronics' | 'toiletries' | 'other';

export type Traveler = {
  id: string;
  name: string;
  relationship: TravelerRelationship;
  initials: string;
};

export type Trip = {
  id: string;
  destination: string;
  region: string;
  country: string;
  stage: TripStage;
  categories: TripCategory[];
  start_date: string | null;
  end_date: string | null;
  date_approx: string | null;
  budget_total: number;
  budget_spent: number;
  budget_currency: string;
  travelers: string[];
  cover: { hue: number; label: string };
  notes: string;
  nights: number;
  created_days_ago?: number;
  daysInStage?: number;
};

export type Activity = {
  time?: string;
  title: string;
  location?: string;
  cost?: number;
  duration?: number;
};

export type ItineraryDay = {
  day: number;
  date: string;
  summary: string;
  activities: Activity[];
};

export type Booking = {
  category: BookingCategory;
  title: string;
  vendor?: string;
  status: BookingStatus;
  cost: number;
  confirmation?: string;
  travel_date?: string;
  source?: BookingSource;
  notes?: string;
};

export type BudgetLine = {
  category: string;
  total: number;
  spent: number;
};

export type PackingItem = {
  category: PackingCategory;
  item: string;
  qty: number;
  packed: boolean;
};

export type TripDocument = {
  type: DocumentType;
  title: string;
  expiry?: string | null;
};

export type TripSplit = {
  travelerId: string;
  paid: number;
  share: number;
};

export type TripDetail = {
  itinerary: ItineraryDay[];
  bookings: Booking[];
  budget_breakdown: BudgetLine[];
  packing: PackingItem[];
  documents: TripDocument[];
  splits?: TripSplit[];
};

export type Insight = {
  id: string;
  trip_id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  body: string;
};

export type ParsedInbox = {
  type: BookingCategory;
  title: string;
  dates: string;
  cost: number;
  confirmation: string | null;
  note?: string;
};

export type InboxItem = {
  id: string;
  source: BookingSource | 'extension';
  vendor: string;
  subject: string;
  from: string;
  received_ago: string;
  status: InboxStatus;
  parsed: ParsedInbox | null;
  suggested_trip?: string;
  suggested_confidence?: number;
  note?: string;
};

export type Integration = {
  key: string;
  name: string;
  desc: string;
  status: IntegrationStatus;
  meta: string | null;
};
