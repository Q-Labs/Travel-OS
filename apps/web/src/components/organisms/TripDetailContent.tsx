import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtMoneyIn } from '../../lib/currency';
import { TODAY, TRAVELERS } from '../../lib/data';
import { CAT_MAP, coverStyle, daysBetween, fmtDate, fmtDateRange } from '../../lib/utils';
import type { PackingCategory, Trip, TripDetail } from '../../lib/types';
import type { useApp } from '../../app/AppContext';
import { CatPip } from '../atoms/CatPip';
import { Icon } from '../atoms/Icon';
import { DestinationBlurb } from '../molecules/DestinationBlurb';
import { BudgetConversion } from '../molecules/BudgetConversion';
import { DocumentCard } from '../molecules/DocumentCard';
import { ProgressRow } from '../molecules/ProgressRow';
import { TripStat } from '../molecules/TripStat';
import { BookingsPanel } from './BookingsPanel';
import { SplitBudget } from './SplitBudget';
import { Button, ProgressMini } from '@q-labs/cobalt';

type TripDetailTab = 'overview' | 'itinerary' | 'bookings' | 'budget' | 'packing' | 'documents' | 'notes';

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

function getStoredTripTab(tripId: string): TripDetailTab {
  /* v8 ignore next -- browser-only localStorage guard */
  if (typeof window === 'undefined') return 'overview';
  const saved = window.localStorage.getItem(`travelos:tab:${tripId}`) as TripDetailTab | null;
  return saved && TAB_ORDER.some((item) => item.key === saved) ? saved : 'overview';
}

/**
 * The body of a trip's page: a hero with the trip's facts, then tabs for the
 * overview, itinerary, bookings, budget, packing, documents and notes. Notes
 * save when their field loses focus, and only if they changed. The browser
 * remembers the selected tab for each trip.
 */
export function TripDetailContent({
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
              value={`${fmtMoneyIn(trip.budget_spent, trip.budget_currency)} / ${fmtMoneyIn(trip.budget_total, trip.budget_currency)}`}
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
                    <CatPip color={CAT_MAP[category].color} />
                    {CAT_MAP[category].label}
                  </span>
                ))}
              </div>

              <div className="section-heading section-heading-compact">
                <h3>Quick actions</h3>
              </div>
              <div className="trip-quick-actions">
                <Button variant="ghost"  onClick={() => setTab('bookings')}>
                  <Icon.Plus /> Review bookings
                </Button>
                <Button variant="ghost"  onClick={() => setTab('packing')}>
                  <Icon.Check /> Update packing
                </Button>
                <Button variant="ghost"  onClick={() => setTab('documents')}>
                  <Icon.Notes /> Check documents
                </Button>
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
                            <div className="activity-cost">{activity.cost != null ? fmtMoneyIn(activity.cost, trip.budget_currency) : '—'}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="trip-empty-inline">
                        <p>No activities planned yet.</p>
                        <Button variant="ghost" >Add activity</Button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'bookings' && <BookingsPanel detail={detail} tripId={trip.id} currency={trip.budget_currency} onToggleStatus={toggleBookingStatus} />}

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
                  <strong>{fmtMoneyIn(trip.budget_spent, trip.budget_currency)}</strong>
                  <span>of {fmtMoneyIn(trip.budget_total, trip.budget_currency)}</span>
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
                          <strong>{fmtMoneyIn(row.spent, trip.budget_currency)} / {fmtMoneyIn(row.total, trip.budget_currency)}</strong>
                        </div>
                        <ProgressMini value={rowPct} />
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
                <ProgressMini value={packingPct} />
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

function groupPacking(detail: TripDetail) {
  return detail.packing.reduce<Record<string, Array<TripDetail['packing'][number] & { index: number }>>>((acc, item, index) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push({ ...item, index });
    return acc;
  }, {});
}
