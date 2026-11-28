import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TODAY } from '../../lib/data';
import { useApp } from '../../app/AppContext';
import { Icon } from '../atoms/Icon';
import { Button } from '@q-labs/cobalt';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** The Calendar page: a month grid with previous and next controls, showing the trips that fall on each day. Clicking a trip opens it. */
export function CalendarPage() {
  const { trips } = useApp();
  const navigate = useNavigate();
  const onOpen = (id: string) => navigate(`/app/trip/${id}`);

  const [cursor, setCursor] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const firstDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: { date: Date; dim: boolean }[] = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push({ date: new Date(year, month, -firstDow + i + 1), dim: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: new Date(year, month, i), dim: false });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, dim: true });
  }

  const tripsForCell = (d: Date) =>
    trips.filter((t) => {
      if (!t.start_date || !t.end_date) return false;
      const s = new Date(t.start_date + 'T00:00:00');
      const e = new Date(t.end_date + 'T00:00:00');
      return d >= s && d <= e;
    });

  const todayIso = iso(TODAY);

  const goPrev = () => setCursor(new Date(year, month - 1, 1));
  const goNext = () => setCursor(new Date(year, month + 1, 1));
  const goToday = () => setCursor(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));

  return (
    <div className="calendar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 32, margin: 0, letterSpacing: '-0.01em' }}>
          {first.toLocaleDateString('en-US', { month: 'long' })}{' '}
          <em style={{ fontStyle: 'normal', color: 'var(--ink-3)' }}>{year}</em>
        </h2>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="icon-btn" onClick={goPrev}><Icon.ChevronLeft /></button>
          <button className="icon-btn" onClick={goNext}><Icon.ChevronRight /></button>
        </div>
        <Button variant="ghost"  style={{ marginLeft: 8 }} onClick={goToday}>Today</Button>
      </div>

      <div className="cal-grid">
        {DOW.map((d) => <div key={d} className="cal-head">{d}</div>)}
        {cells.map((c, i) => {
          const dayTrips = tripsForCell(c.date);
          const isToday = iso(c.date) === todayIso;
          return (
            <div key={i} className={`cal-cell${c.dim ? ' dim' : ''}${isToday ? ' today' : ''}`}>
              <div className="cal-day">{c.date.getDate()}</div>
              {dayTrips.slice(0, 2).map((t) => (
                <div
                  key={t.id}
                  className="cal-trip"
                  style={{ background: `oklch(48% 0.14 ${t.cover?.hue ?? 30})` }}
                  onClick={() => onOpen(t.id)}
                >
                  {t.destination}
                </div>
              ))}
              {dayTrips.length > 2 && (
                <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                  +{dayTrips.length - 2}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
