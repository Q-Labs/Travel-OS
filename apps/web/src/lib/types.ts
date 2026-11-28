/** Where a trip sits on the pipeline board, from a loose idea to done. Every stage but `archived` is a board column; archived trips are on the Archive page. */
export type TripStage = 'dreaming' | 'planning' | 'booked' | 'upcoming' | 'archived';
/** What kind of trip it is. A trip can have several, and the sidebar filters the pipeline by them. */
export type TripCategory = 'family' | 'couple' | 'solo' | 'race' | 'friends' | 'work';
/** How a traveler relates to the person whose account it is. */
export type TravelerRelationship = 'self' | 'spouse' | 'child' | 'friend';
/** The kind of thing booked. It decides a booking's icon, and it is what the parser reads out of a forwarded email. */
export type BookingCategory = 'flight' | 'lodging' | 'transport' | 'activity' | 'dining' | 'other';
/** How far along a booking is. The trip page lets the user move a booking between statuses. */
export type BookingStatus = 'done' | 'pending' | 'todo' | 'parsing' | 'needs_review';
/** Where a booking or inbox item came from. `gmail`, `extension` and `viator` name integrations that are not built (#138, #140, #141). */
export type BookingSource = 'gmail' | 'email' | 'manual' | 'api' | 'viator' | 'extension';
/** The kinds of nudge the app can show. The insights job generates all but `price_drop`, which nothing produces and which #137 removes from what the app shows. */
export type InsightType = 'stage_stale' | 'price_drop' | 'passport_expiry' | 'packing_reminder' | 'weather';
/** How loudly an insight is shown. */
export type InsightSeverity = 'info' | 'warning' | 'urgent';
/** Where a forwarded email is in the inbox: being read, read, needing a person to check it, or waiting to be filed under a trip. */
export type InboxStatus = 'parsed' | 'parsing' | 'needs_review' | 'pending_trip';
/** How an integration connects: `active` works now, `email-only` works by forwarding the confirmation to the inbox, `available` is listed but not set up. */
export type IntegrationStatus = 'active' | 'email-only' | 'available';
/** The kinds of travel document a trip can hold. Passport expiry is what the insights job watches. */
export type DocumentType = 'passport' | 'visa' | 'confirmation';
/** The groups a packing list is sorted into. */
export type PackingCategory = 'clothing' | 'documents' | 'electronics' | 'toiletries' | 'other';

/** A person who can go on a trip. A trip lists its travelers by `id`. */
export type Traveler = {
  id: string;
  name: string;
  relationship: TravelerRelationship;
  initials: string;
};

/** A trip on the pipeline. Dates are `YYYY-MM-DD` strings, and `date_approx` is a free-text stand-in (such as "Later") for a trip with no dates yet. `cover` gives the card its colour. */
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
  /**
   * When the trip last changed stage. Persisted, unlike the two fixture-only
   * counters below, which exist so the seeded data reads realistically.
   */
  stage_changed_at?: string;
  created_days_ago?: number;
  daysInStage?: number;
};

/** One thing planned for part of an itinerary day. Everything but the title is optional. */
export type Activity = {
  time?: string;
  title: string;
  location?: string;
  cost?: number;
  duration?: number;
};

/** One day of a trip's itinerary: its number and date, a one-line summary and the activities planned. */
export type ItineraryDay = {
  day: number;
  date: string;
  summary: string;
  activities: Activity[];
};

/** Something booked for a trip, such as a flight, a stay or a table. `confirmation` is the vendor's reference and `source` says how the booking got here. */
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

/** One category in a trip's budget: what is planned (`total`) against what has been spent. */
export type BudgetLine = {
  category: string;
  total: number;
  spent: number;
};

/** One line on a trip's packing list: what it is, how many to take and whether it is packed yet. */
export type PackingItem = {
  category: PackingCategory;
  item: string;
  qty: number;
  packed: boolean;
};

/** A travel document held against a trip. `expiry` is what the passport warning reads. */
export type TripDocument = {
  type: DocumentType;
  title: string;
  expiry?: string | null;
};

/** How one traveler stands in a trip's shared costs: what they paid against their share. The settle-up figures are worked out from the difference. */
export type TripSplit = {
  travelerId: string;
  paid: number;
  share: number;
};

/** Everything about a trip beyond its card: itinerary, bookings, budget lines, packing, documents and, optionally, how costs split. It is loaded and saved apart from `Trip`. */
export type TripDetail = {
  itinerary: ItineraryDay[];
  bookings: Booking[];
  budget_breakdown: BudgetLine[];
  packing: PackingItem[];
  documents: TripDocument[];
  splits?: TripSplit[];
};

/** A nudge about a trip, such as a passport about to expire. The insights job generates them and the user can dismiss one. */
export type Insight = {
  id: string;
  trip_id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  body: string;
};

/** What Claude read out of a forwarded email: what was booked, when, for how much and the confirmation code, if the email has one. */
export type ParsedInbox = {
  type: BookingCategory;
  title: string;
  dates: string;
  cost: number;
  confirmation: string | null;
  note?: string;
};

/** A forwarded email in the inbox, with what was parsed from it. `suggested_trip` and `suggested_confidence` (0 to 1) are the parser's guess at which trip it belongs to. */
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

/** A service listed on the Integrations screen: its name, what it does for the user and how it connects. `meta` is optional extra detail, such as the calendar feed's path. */
export type Integration = {
  key: string;
  name: string;
  desc: string;
  status: IntegrationStatus;
  meta: string | null;
};
