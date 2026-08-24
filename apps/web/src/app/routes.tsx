import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, redirect, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getSession, signOut } from '../lib/db';
import { BOOKING_ICONS, Icon } from '../components/Icon';
import { ArchiveDashboard } from '../components/ArchiveDashboard';
import { CalendarDashboard } from '../components/CalendarDashboard';
import { InboxDashboard } from '../components/InboxDashboard';
import { PipelineDashboard } from '../components/PipelineDashboard';
import { AddTripModal } from '../components/modals/AddTripModal';
import { IntegrationsModal } from '../components/modals/IntegrationsModal';
import { TweaksPanel } from '../components/TweaksPanel';
import { BudgetConversion } from '../components/BudgetConversion';
import { DestinationBlurb } from '../components/DestinationBlurb';
import { useApp } from './AppContext';
import { TODAY, TRAVELERS } from '../lib/data';
import { findTripById } from '../lib/trips';
import {
  CAT_MAP,
  CATEGORIES,
  coverStyle,
  daysBetween,
  fmtDate,
  fmtDateRange,
  fmtMoney,
} from '../lib/utils';
import type { Booking, BookingSource, BookingStatus, PackingCategory, Trip, TripDetail, TripDocument, TripSplit } from '../lib/types';

type OutletCtx = { trips: Trip[] };
type TripDetailTab = 'overview' | 'itinerary' | 'bookings' | 'budget' | 'packing' | 'documents' | 'notes';

const EMPTY_DETAIL: TripDetail = {
  itinerary: [],
  bookings: [],
  budget_breakdown: [],
  packing: [],
  documents: [],
};

const TAB_ORDER: { key: TripDetailTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'itinerary', label: 'Itinerary' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'budget', label: 'Budget' },
  { key: 'packing', label: 'Packing' },
  { key: 'documents', label: 'Documents' },
  { key: 'notes', label: 'Notes' },
];

const PACKING_LABELS: Record<PackingCategory, string> = {
  clothing: 'Clothing',
  documents: 'Documents',
  electronics: 'Electronics',
  toiletries: 'Toiletries',
  other: 'Other',
};

const SOURCE_LABELS: Record<BookingSource | 'unknown', string> = {
  gmail: 'Gmail',
  email: 'Email',
  manual: 'Manual',
  api: 'API',
  viator: 'Viator',
  extension: 'Extension',
  unknown: 'Unknown',
};

// No-op kept for router.tsx compatibility; AppLayout reads from AppContext instead.
export const tripsLoader = () => ({});

export async function authGuardLoader() {
  /* v8 ignore next -- e2e-only bypass; import.meta.env.DEV is replaced with false in prod builds, dead-code eliminating this branch */
  if (import.meta.env.DEV && import.meta.env['VITE_E2E_BYPASS_AUTH'] === 'true') return {};
  const session = await getSession();
  if (!session) return redirect('/login');
  return {};
}

export function localDateLabel(utcDate: Date): string {
  return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function greeting(h = new Date().getHours()) {
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function AppLayout() {
  const {
    trips, inbox, search, setSearch,
    categoryFilter, toggleCategoryFilter,
    showModal, showIntegrations, tweaksOpen, setShowModal, setShowIntegrations, setTweaksOpen,
  } = useApp();

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const segment = pathname.split('/')[2];

  const pipelineCount = trips.filter((t) => t.stage !== 'archived').length;
  const archiveCount = trips.filter((t) => t.stage === 'archived').length;

  const soonCount = trips.filter((t) => {
    if (!t.start_date) return false;
    const d = daysBetween(TODAY, t.start_date);
    return d >= 0 && d <= 30;
  }).length;

  const todayLabel = localDateLabel(TODAY);

  const soonLabel = /* v8 ignore next */ soonCount === 1 ? `${soonCount} trip within 30 days` : `${soonCount} trips within 30 days`;

  const topbarContent: Record<string, { title: string; subtitle: string }> = {
    pipeline: { title: `${greeting()}, Quincy.`, subtitle: `${todayLabel} · ${soonLabel}` },
    inbox: { title: 'Inbox.', subtitle: `Forwarded confirmations · ${inbox.length} items` },
    calendar: { title: 'Calendar.', subtitle: 'Everything in motion on one page' },
    archive: { title: 'Archive.', subtitle: "Every trip you've completed" },
  };
  const topbar = topbarContent[segment];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">T</div>
          <div className="brand-name">Travel OS</div>
        </div>

        <div className="nav-section">Views</div>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="pipeline">
          <Icon.Pipeline /> Pipeline <span className="count">{pipelineCount}</span>
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="inbox">
          <Icon.Notes /> Inbox <span className="count">{inbox.length}</span>
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="calendar">
          <Icon.Calendar /> Calendar
        </NavLink>
        <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="archive">
          <Icon.Archive /> Archive <span className="count">{archiveCount}</span>
        </NavLink>

        <div className="nav-section">Categories</div>
        {CATEGORIES.map((c) => {
          const n = trips.filter((t) => t.categories.includes(c.key) && t.stage !== 'archived').length;
          if (n === 0) return null;
          const active = categoryFilter.includes(c.key);
          return (
            <button
              key={c.key}
              className="nav-item"
              onClick={() => toggleCategoryFilter(c.key)}
              style={active ? { background: 'var(--divider)' } : undefined}
            >
              <span className="cat-pip" style={{ background: c.color, width: 10, height: 10 }} />
              {c.label} <span className="count">{n}</span>
            </button>
          );
        })}

        <div className="nav-section">Tools</div>
        <button className="nav-item" onClick={() => setShowIntegrations(true)}>
          <Icon.Sparkle /> Integrations
        </button>
        <button className="nav-item" onClick={() => setTweaksOpen(!tweaksOpen)}>
          <Icon.Sliders /> Tweaks
        </button>
        <button className="nav-item">
          <Icon.Settings /> Settings
        </button>

        <div className="sidebar-footer">
          <div className="avatar">Q</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: 12.5 }}>Quincy</div>
            <div style={{ fontSize: 11 }}>Cherry Hill, NJ</div>
          </div>
          <button
            className="icon-btn"
            title="Sign out"
            aria-label="Sign out"
            onClick={() => { void signOut().then(() => navigate('/login')); }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5.5 2H2.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3M9.5 10l3-3-3-3M12.5 7h-7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </aside>

      <main className="main">
        {topbar && (
          <div className="topbar">
            <div>
              <h1>{topbar.title}</h1>
              <div className="subtitle">{topbar.subtitle}</div>
            </div>
            <div className="spacer" />
            <div className="search">
              <Icon.Search />
              <input
                placeholder="Search destinations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn primary" onClick={() => setShowModal(true)}>
              <Icon.Plus /> New trip
            </button>
          </div>
        )}
        <Outlet context={{ trips } satisfies OutletCtx} />
      </main>

      {showModal && <AddTripModal />}
      {showIntegrations && <IntegrationsModal />}
      {tweaksOpen && <TweaksPanel />}
    </div>
  );
}

export function PipelinePage() {
  return <PipelineDashboard />;
}

export function InboxPage() {
  return <InboxDashboard />;
}

export function CalendarPage() {
  return <CalendarDashboard />;
}

export function ArchivePage() {
  return <ArchiveDashboard />;
}

export function TripDetailPage() {
  const { trips, tripDetails, updateTrip, togglePacked, toggleBookingStatus } = useApp();
  const { tripId } = useParams() as { tripId: string };
  const trip = findTripById(trips, tripId);

  if (!trip) {
    return <p className="trip-missing">Trip not found.</p>;
  }

  return (
    <TripDetailContent
      key={trip.id}
      trip={trip}
      tripId={tripId}
      detail={tripDetails[tripId] ?? EMPTY_DETAIL}
      updateTrip={updateTrip}
      togglePacked={togglePacked}
      toggleBookingStatus={toggleBookingStatus}
    />
  );
}

function getStoredTripTab(tripId: string): TripDetailTab {
  /* v8 ignore next -- browser-only localStorage guard */
  if (typeof window === 'undefined') return 'overview';
  const saved = window.localStorage.getItem(`travelos:tab:${tripId}`) as TripDetailTab | null;
  return saved && TAB_ORDER.some((item) => item.key === saved) ? saved : 'overview';
}

function TripDetailContent({
  trip,
  tripId,
  detail,
  updateTrip,
  togglePacked,
  toggleBookingStatus,
}: {
  trip: Trip;
  tripId: string;
  detail: TripDetail;
  updateTrip: ReturnType<typeof useApp>['updateTrip'];
  togglePacked: ReturnType<typeof useApp>['togglePacked'];
  toggleBookingStatus: ReturnType<typeof useApp>['toggleBookingStatus'];
}) {
  const [tab, setTab] = useState<TripDetailTab>(() => getStoredTripTab(tripId));
  const [overviewNotes, setOverviewNotes] = useState(trip.notes);
  const [fullNotes, setFullNotes] = useState(trip.notes);

  useEffect(() => {
    /* v8 ignore next -- browser-only localStorage guard */
    if (!tripId || typeof window === 'undefined') return;
    window.localStorage.setItem(`travelos:tab:${tripId}`, tab);
  }, [tab, tripId]);

  const travelers = trip.travelers
    .map((travelerId) => TRAVELERS.find((traveler) => traveler.id === travelerId))
    .filter((traveler): traveler is (typeof TRAVELERS)[number] => Boolean(traveler));
  const countdown = trip.start_date ? daysBetween(TODAY, trip.start_date) : null;
  const bookingDone = detail.bookings.filter((booking) => booking.status === 'done').length;
  const bookingPct = detail.bookings.length ? Math.round((bookingDone / detail.bookings.length) * 100) : 0;
  const packedCount = detail.packing.filter((item) => item.packed).length;
  const packingPct = detail.packing.length ? Math.round((packedCount / detail.packing.length) * 100) : 0;
  const itineraryPlanned = detail.itinerary.filter((day) => day.activities.length > 0).length;
  const budgetPct = trip.budget_total ? Math.min(100, Math.round((trip.budget_spent / trip.budget_total) * 100)) : 0;

  const saveNotes = (value: string) => {
    setOverviewNotes(value);
    setFullNotes(value);
    if (value !== trip.notes) updateTrip(trip.id, { notes: value });
  };

  return (
    <section className="trip-detail">
      <div className="trip-hero">
        <div className="trip-hero-bg" style={coverStyle(trip.cover)} />
        <div className="trip-hero-content">
          <Link className="trip-back" to="/app/pipeline">
            <Icon.ChevronLeft /> All trips
          </Link>
          <div className="trip-hero-row">
            <div>
              <p className="trip-kicker">{trip.region}</p>
              <h2>{trip.destination}</h2>
              <p className="trip-subtitle">
                <span>{trip.country}</span>
                <span>•</span>
                <span>{trip.date_approx ?? fmtDateRange(trip.start_date, trip.end_date) ?? 'Dates TBD'}</span>
              </p>
            </div>
            <div className="trip-countdown">
              {countdown === null && <><strong>Someday</strong><span>{trip.date_approx ?? 'Choose dates'}</span></>}
              {countdown !== null && countdown < 0 && <><strong>Completed</strong><span>{fmtDate(trip.end_date, { month: 'short', year: 'numeric' })}</span></>}
              {countdown !== null && countdown >= 0 && <><strong>{countdown}</strong><span>{countdown === 1 ? 'day to go' : 'days to go'}</span></>}
            </div>
          </div>
          <div className="trip-stats">
            <TripStat label="Nights" value={String(trip.nights)} />
            <TripStat label="Travelers" value={String(travelers.length)} subvalue={travelers.map((traveler) => traveler.name).join(', ')} />
            <TripStat
              label="Budget"
              value={`${fmtMoney(trip.budget_spent)} / ${fmtMoney(trip.budget_total)}`}
              progress={budgetPct}
            />
            <TripStat label="Bookings" value={`${bookingPct}% complete`} subvalue={`${bookingDone} of ${detail.bookings.length} done`} />
          </div>
        </div>
      </div>

      <div className="trip-tabs" role="tablist" aria-label="Trip detail tabs">
        {TAB_ORDER.map((item) => (
          <button
            key={item.key}
            className={`trip-tab${tab === item.key ? ' active' : ''}`}
            onClick={() => setTab(item.key)}
            role="tab"
            aria-selected={tab === item.key}
          >
            {item.label}
            {item.key === 'itinerary' && <span className="trip-tab-count">{detail.itinerary.length}</span>}
            {item.key === 'bookings' && <span className="trip-tab-count">{detail.bookings.length}</span>}
            {item.key === 'packing' && <span className="trip-tab-count">{packedCount}/{detail.packing.length}</span>}
            {item.key === 'documents' && <span className="trip-tab-count">{detail.documents.length}</span>}
          </button>
        ))}
      </div>

      <div className="trip-panel">
        {tab === 'overview' && (
          <div className="trip-overview-grid">
            <section className="trip-card">
              <div className="section-heading">
                <h3>Overview</h3>
                <p>Trip notes and overall progress.</p>
              </div>
              <DestinationBlurb destination={trip.destination} />
              <label className="field-label" htmlFor="trip-overview-notes">Trip notes</label>
              <textarea
                id="trip-overview-notes"
                className="trip-textarea"
                value={overviewNotes}
                onChange={(e) => setOverviewNotes(e.target.value)}
                onBlur={(e) => saveNotes(e.target.value)}
              />
              <div className="progress-list">
                <ProgressRow label="Bookings" value={`${bookingDone}/${detail.bookings.length} confirmed`} progress={bookingPct} />
                <ProgressRow label="Packing" value={`${packedCount}/${detail.packing.length} packed`} progress={packingPct} />
                <ProgressRow label="Itinerary" value={`${itineraryPlanned}/${detail.itinerary.length} days planned`} progress={detail.itinerary.length ? Math.round((itineraryPlanned / detail.itinerary.length) * 100) : 0} />
              </div>
            </section>

            <aside className="trip-card trip-sidebar-card">
              <div className="section-heading">
                <h3>Categories</h3>
                <p>How this trip is tagged.</p>
              </div>
              <div className="trip-category-list">
                {trip.categories.map((category) => (
                  <span key={category} className="trip-category-chip">
                    <span className="cat-pip" style={{ background: CAT_MAP[category].color }} />
                    {CAT_MAP[category].label}
                  </span>
                ))}
              </div>

              <div className="section-heading section-heading-compact">
                <h3>Quick actions</h3>
              </div>
              <div className="trip-quick-actions">
                <button className="btn ghost" onClick={() => setTab('bookings')}>
                  <Icon.Plus /> Review bookings
                </button>
                <button className="btn ghost" onClick={() => setTab('packing')}>
                  <Icon.Check /> Update packing
                </button>
                <button className="btn ghost" onClick={() => setTab('documents')}>
                  <Icon.Notes /> Check documents
                </button>
              </div>
            </aside>
          </div>
        )}

        {tab === 'itinerary' && (
          <section className="trip-card">
            <div className="section-heading">
              <h3>Itinerary</h3>
              <p>Day-by-day plan for the trip.</p>
            </div>
            <div className="day-list">
              {detail.itinerary.map((day) => (
                <article key={day.day} className="day-card">
                  <div className="day-meta">
                    <div className="day-num">Day {day.day}</div>
                    <div className="day-date">{fmtDate(day.date, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  </div>
                  <div className="day-body">
                    <h4>{day.summary}</h4>
                    {day.activities.length > 0 ? (
                      <div className="activity-list">
                        {day.activities.map((activity, index) => (
                          <div key={`${day.day}-${index}`} className="activity-row">
                            <div className="activity-time">{activity.time ?? 'Open'}</div>
                            <div className="activity-copy">
                              <div className="activity-title">{activity.title}</div>
                              <div className="activity-subtitle">
                                {activity.location ?? 'Location TBD'}
                                {activity.duration ? ` • ${Math.round(activity.duration / 60)}h` : ''}
                              </div>
                            </div>
                            <div className="activity-cost">{activity.cost != null ? fmtMoney(activity.cost) : '—'}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="trip-empty-inline">
                        <p>No activities planned yet.</p>
                        <button className="btn ghost">Add activity</button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'bookings' && <BookingsPanel detail={detail} tripId={trip.id} onToggleStatus={toggleBookingStatus} />}

        {tab === 'budget' && (
          <>
            <section className="trip-budget-grid">
              <div className="trip-card budget-summary-card">
                <div className="section-heading">
                  <h3>Budget</h3>
                  <p>Total spend versus planned budget.</p>
                </div>
                <div className="budget-ring" style={{ ['--budget-pct' as string]: `${budgetPct}%` }}>
                  <div>
                    <strong>{budgetPct}%</strong>
                    <span>spent</span>
                  </div>
                </div>
                <div className="budget-summary">
                  <strong>{fmtMoney(trip.budget_spent)}</strong>
                  <span>of {fmtMoney(trip.budget_total)}</span>
                </div>
                <BudgetConversion trip={trip} />
              </div>
              <div className="trip-card">
                <div className="section-heading">
                  <h3>By category</h3>
                  <p>How spend is distributed.</p>
                </div>
                <div className="budget-lines">
                  {detail.budget_breakdown.map((row) => {
                    const rowPct = row.total ? Math.min(100, Math.round((row.spent / row.total) * 100)) : 0;
                    return (
                      <div key={row.category} className="budget-line">
                        <div className="budget-line-head">
                          <span>{row.category}</span>
                          <strong>{fmtMoney(row.spent)} / {fmtMoney(row.total)}</strong>
                        </div>
                        <div className="mini-progress">
                          <div style={{ width: `${rowPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
            <SplitBudget splits={detail.splits} trip={trip} />
          </>
        )}

        {tab === 'packing' && (
          <section className="trip-card">
            <div className="packing-header">
              <div className="section-heading">
                <h3>Packing</h3>
                <p>{packedCount} of {detail.packing.length} items packed.</p>
              </div>
              <div className="packing-progress">
                <div className="mini-progress">
                  <div style={{ width: `${packingPct}%` }} />
                </div>
              </div>
            </div>
            <div className="packing-grid">
              {Object.entries(groupPacking(detail)).map(([category, items]) => (
                <div key={category} className="packing-card">
                  <h4>{PACKING_LABELS[category as PackingCategory]}</h4>
                  {items.map((item) => (
                    <button
                      key={`${category}-${item.index}`}
                      className={`packing-item${item.packed ? ' done' : ''}`}
                      onClick={() => togglePacked(trip.id, item.index)}
                    >
                      <span className="packing-box">{item.packed && <Icon.Check />}</span>
                      <span>{item.item}</span>
                      <span className="packing-qty">×{item.qty}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'documents' && (
          <section className="trip-card">
            <div className="section-heading">
              <h3>Documents</h3>
              <p>Passports, visas, and confirmations for this trip.</p>
            </div>
            <div className="document-grid">
              {detail.documents.map((document) => (
                <DocumentCard key={`${document.type}-${document.title}`} document={document} />
              ))}
            </div>
          </section>
        )}

        {tab === 'notes' && (
          <section className="trip-card">
            <div className="section-heading">
              <h3>Notes</h3>
              <p>Long-form notes saved back to the trip record.</p>
            </div>
            <textarea
              className="trip-textarea trip-textarea-large"
              aria-label="Full trip notes"
              value={fullNotes}
              onChange={(e) => setFullNotes(e.target.value)}
              onBlur={(e) => saveNotes(e.target.value)}
            />
          </section>
        )}
      </div>
    </section>
  );
}

function TripStat({
  label,
  value,
  subvalue,
  progress,
}: {
  label: string;
  value: string;
  subvalue?: string;
  progress?: number;
}) {
  return (
    <div className="trip-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {subvalue && <small>{subvalue}</small>}
      {progress !== undefined && (
        <div className="mini-progress">
          <div style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function ProgressRow({ label, value, progress }: { label: string; value: string; progress: number }) {
  return (
    <div className="progress-row">
      <div>
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
      <div className="mini-progress">
        <div style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function BookingsPanel({
  detail,
  tripId,
  onToggleStatus,
}: {
  detail: TripDetail;
  tripId: string;
  onToggleStatus: (tripId: string, idx: number, status: string) => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | Booking['category']>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | BookingSource>('all');
  const bookings = detail.bookings.map((booking, index) => ({ ...booking, index }));

  const visibleBookings = bookings.filter((booking) => {
    if (categoryFilter !== 'all' && booking.category !== categoryFilter) return false;
    if (sourceFilter !== 'all' && booking.source !== sourceFilter) return false;
    return true;
  });

  const categories = Array.from(new Set(bookings.map((booking) => booking.category)));
  const sources = Array.from(new Set(bookings.map((booking) => booking.source).filter(Boolean))) as BookingSource[];

  return (
    <section className="trip-card">
      <div className="section-heading">
        <h3>Bookings</h3>
        <p>Toggle booking progress and filter by category or source.</p>
      </div>
      <div className="filter-row">
        <div className="chip-row">
          <button className={`filter-chip${categoryFilter === 'all' ? ' active' : ''}`} onClick={() => setCategoryFilter('all')}>All categories</button>
          {categories.map((category) => (
            <button
              key={category}
              className={`filter-chip${categoryFilter === category ? ' active' : ''}`}
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="chip-row">
          <button className={`filter-chip${sourceFilter === 'all' ? ' active' : ''}`} onClick={() => setSourceFilter('all')}>All sources</button>
          {sources.map((source) => (
            <button
              key={source}
              className={`filter-chip${sourceFilter === source ? ' active' : ''}`}
              onClick={() => setSourceFilter(source)}
            >
              {SOURCE_LABELS[source]}
            </button>
          ))}
        </div>
      </div>
      <div className="booking-table">
        <div className="booking-table-head">
          <span>Status</span>
          <span>Booking</span>
          <span>Vendor</span>
          <span>Confirmation</span>
          <span>Cost</span>
        </div>
        {visibleBookings.map((booking) => {
          const BookingIcon = BOOKING_ICONS[booking.category];
          const next = nextBookingStatus(booking.status);
          return (
            <div className="booking-row" key={`${booking.title}-${booking.index}`}>
              <button
                className={`booking-status booking-status-${booking.status}`}
                onClick={() => onToggleStatus(tripId, booking.index, next)}
                aria-label={`Set ${booking.title} to ${next}`}
              >
                {booking.status === 'done' ? <Icon.Check /> : booking.status === 'pending' ? <Icon.Clock /> : null}
              </button>
              <div className="booking-primary">
                <div className="booking-title"><BookingIcon /> {booking.title}</div>
                <div className="booking-subtitle">
                  {booking.travel_date ? fmtDate(booking.travel_date, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
                </div>
              </div>
              <div className="booking-secondary">
                <span>{booking.vendor ?? 'Unassigned'}</span>
                <span className="source-chip">{SOURCE_LABELS[booking.source ?? 'unknown']}</span>
              </div>
              <code className="booking-code">{booking.confirmation ?? '—'}</code>
              <div className="booking-cost">{booking.cost != null ? fmtMoney(booking.cost) : '—'}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DocumentCard({ document }: { document: TripDocument }) {
  const expiryDays = document.expiry ? daysBetween(TODAY, document.expiry) : null;
  const warn = expiryDays !== null && expiryDays < 183;

  return (
    <article className={`document-card${warn ? ' warning' : ''}`}>
      <span className="document-type">{document.type}</span>
      <strong>{document.title}</strong>
      <span>{document.expiry ? `Expires ${fmtDate(document.expiry, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No expiry date'}</span>
      {warn && <em>Renew soon: under 6 months remaining.</em>}
    </article>
  );
}

function groupPacking(detail: TripDetail) {
  return detail.packing.reduce<Record<string, Array<TripDetail['packing'][number] & { index: number }>>>((acc, item, index) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push({ ...item, index });
    return acc;
  }, {});
}

function nextBookingStatus(status: BookingStatus): BookingStatus {
  if (status === 'todo') return 'pending';
  if (status === 'pending') return 'done';
  return 'todo';
}

type SettleRow = { fromId: string; toId: string; amount: number };

function computeSettle(splits: TripSplit[]): SettleRow[] {
  const net = splits.map((s) => ({ id: s.travelerId, bal: s.paid - s.share }));
  const cred = net.filter((s) => s.bal > 0.01).map((s) => ({ ...s, rem: s.bal }));
  const debt = net.filter((s) => s.bal < -0.01).map((s) => ({ ...s, rem: Math.abs(s.bal) }));
  const rows: SettleRow[] = [];
  let ci = 0; let di = 0;
  while (ci < cred.length && di < debt.length) {
    const amt = Math.min(cred[ci].rem, debt[di].rem);
    if (amt > 0.01) rows.push({ fromId: debt[di].id, toId: cred[ci].id, amount: amt });
    cred[ci].rem -= amt;
    debt[di].rem -= amt;
    if (cred[ci].rem < 0.01) ci++;
    if (debt[di].rem < 0.01) di++;
  }
  return rows;
}

function SplitBudget({ splits, trip }: { splits: TripSplit[] | undefined; trip: Trip }) {
  const travelers = trip.travelers
    .map((id) => TRAVELERS.find((t) => t.id === id))
    .filter((t): t is (typeof TRAVELERS)[number] => Boolean(t));
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!splits || splits.length === 0) {
    if (trip.travelers.length <= 1) return null;
    return (
      <div className="split-empty">
        <p className="split-empty-title">{trip.travelers.length} travelers · <em>no split set up yet</em></p>
        <p className="split-empty-hint">
          Default: equal split — {fmtMoney(trip.budget_total / trip.travelers.length)} per person
        </p>
        <button className="btn primary">
          <Icon.Plus /> Set up split
        </button>
      </div>
    );
  }

  const settle = computeSettle(splits).filter((r) => !dismissed.has(`${r.fromId}-${r.toId}`));
  /* v8 ignore next 2 -- defensive fallback: traveler IDs in fixture data always exist in TRAVELERS */
  const getName = (id: string) => travelers.find((t) => t.id === id)?.name ?? id;
  const getInitials = (id: string) => travelers.find((t) => t.id === id)?.initials ?? id[0].toUpperCase();

  return (
    <div className="split-section">
      <h3 className="split-heading">
        Split · <em>who owes what</em>
      </h3>
      <div className="split-grid">
        {splits.map((s) => {
          const traveler = travelers.find((t) => t.id === s.travelerId);
          const balance = s.paid - s.share;
          const isOwed = balance > 0.01;
          const isOwes = balance < -0.01;
          const barColor = isOwed ? 'oklch(58% 0.11 150)' : isOwes ? 'oklch(60% 0.15 25)' : 'var(--accent)';
          const balColor = isOwed ? 'oklch(45% 0.11 150)' : isOwes ? 'oklch(50% 0.15 25)' : 'var(--ink-3)';
          /* v8 ignore next -- guard against zero share (paid/0 → Infinity) */
          const maxBar = s.share * 1.5 || 1;
          const paidPct = Math.min(100, (s.paid / maxBar) * 100);
          const sharePct = Math.min(100, (s.share / maxBar) * 100);
          /* v8 ignore next 2 -- fallback display values; travelerId always maps to a known traveler */
          const displayInitials = traveler?.initials ?? '?';
          const displayName = traveler?.name ?? s.travelerId;
          return (
            <div key={s.travelerId} className="split-card">
              <div className="split-avatar">{displayInitials}</div>
              <div className="split-info">
                <div className="split-name">{displayName}</div>
                <div className="split-amounts">Paid {fmtMoney(s.paid)} · share {fmtMoney(s.share)}</div>
                <div className="split-bar-wrap">
                  <div className="split-bar-track">
                    <div className="split-bar-fill" style={{ width: `${paidPct}%`, background: barColor }} />
                    <div className="split-bar-marker" style={{ left: `${sharePct}%` }} />
                  </div>
                </div>
              </div>
              <div className="split-balance" style={{ color: balColor }}>
                <div className="split-balance-amount">
                  {isOwed ? '+' : isOwes ? '-' : '±'}{fmtMoney(Math.abs(balance))}
                </div>
                <div className="split-balance-label">
                  {isOwed ? 'gets back' : isOwes ? 'owes' : 'even'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {settle.length > 0 && (
        <div className="settle-up">
          <div className="settle-up-label">Settle up</div>
          {settle.map((row) => (
            <div key={`${row.fromId}-${row.toId}`} className="settle-row">
              <div className="settle-avatars">
                <span className="settle-av settle-av-from">{getInitials(row.fromId)}</span>
                <span className="settle-connector">owes</span>
                <span className="settle-av settle-av-to">{getInitials(row.toId)}</span>
                <span className="settle-names">{getName(row.fromId)} → {getName(row.toId)}</span>
              </div>
              <div className="settle-amount">{fmtMoney(row.amount)}</div>
              <button
                className="btn"
                onClick={() => setDismissed((prev) => new Set([...prev, `${row.fromId}-${row.toId}`]))}
              >
                Mark paid
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
