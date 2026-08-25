import { TODAY } from '../lib/data';
import { CAT_MAP, coverStyle, daysBetween, fmtDateRange } from '../lib/utils';
import { fmtMoneyIn } from '../lib/currency';
import type { Trip } from '../lib/types';
import { Avatars } from './Avatars';

type Props = {
  trip: Trip;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent, trip: Trip) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
};

export function TripCard({ trip, onClick, onDragStart, onDragEnd, isDragging }: Props) {
  let countdown: string | null = null;
  let range: string | null = null;

  if (trip.start_date) {
    const days = daysBetween(TODAY, trip.start_date);
    if (days > 0 && days <= 60) countdown = `in ${days}d`;
    else if (days > 60) countdown = `in ${Math.floor(days / 7)}w`;
    else if (days === 0) countdown = 'today';
    else if (days < 0 && trip.end_date && daysBetween(TODAY, trip.end_date) >= 0) countdown = 'active';
    range = fmtDateRange(trip.start_date, trip.end_date);
  }

  const budgetPct = trip.budget_total > 0
    ? Math.min(100, (trip.budget_spent / trip.budget_total) * 100)
    : 0;

  return (
    <div
      className={`tcard${isDragging ? ' dragging' : ''}`}
      draggable={!!onDragStart}
      onDragStart={onDragStart ? (e) => onDragStart(e, trip) : undefined}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <div className="tcard-cover" style={coverStyle(trip.cover)}>
        <div className="label">{trip.cover?.label}</div>
      </div>
      <div className="tcard-body">
        <div className="tcard-dest">{trip.destination}</div>
        <div className="tcard-region">{trip.region}, {trip.country}</div>

        <div className="tcard-meta">
          {trip.date_approx && !range
            ? <span className="tcard-approx">{trip.date_approx}</span>
            : range
              ? <span>{range}</span>
              : null}
          {countdown && <><span className="sep">·</span><span className="tcard-countdown">{countdown}</span></>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {trip.categories.map((k) => (
              <span key={k} className="cat-pip" style={{ background: CAT_MAP[k]?.color }} title={CAT_MAP[k]?.label} />
            ))}
          </div>
          <Avatars ids={trip.travelers} />
        </div>

        {(trip.stage === 'booked' || trip.stage === 'upcoming') && trip.budget_total > 0 && (
          <div className="tcard-progress" title={`${fmtMoneyIn(trip.budget_spent, trip.budget_currency)} of ${fmtMoneyIn(trip.budget_total, trip.budget_currency)}`}>
            <div className="bar" style={{ width: budgetPct + '%' }} />
          </div>
        )}
      </div>
    </div>
  );
}
