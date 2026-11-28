import { useState } from 'react';
import { fmtMoneyIn } from '../../lib/currency';
import { fmtDate } from '../../lib/utils';
import type { Booking, BookingSource, BookingStatus, TripDetail } from '../../lib/types';
import { BOOKING_ICONS, Icon } from '../atoms/Icon';

const SOURCE_LABELS: Record<BookingSource | 'unknown', string> = {
  gmail: 'Gmail',
  email: 'Email',
  manual: 'Manual',
  api: 'API',
  viator: 'Viator',
  extension: 'Extension',
  unknown: 'Unknown',
};

function nextBookingStatus(status: BookingStatus): BookingStatus {
  if (status === 'todo') return 'pending';
  if (status === 'pending') return 'done';
  return 'todo';
}

/**
 * A trip's bookings, filterable by category and by source. Each booking has a
 * control that steps its status from to-do to pending to done and back round
 * again. Costs show in the trip's currency.
 */
export function BookingsPanel({
  detail,
  tripId,
  currency,
  onToggleStatus,
}: {
  detail: TripDetail;
  tripId: string;
  currency: string;
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
              <div className="booking-cost">{booking.cost != null ? fmtMoneyIn(booking.cost, currency) : '—'}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
