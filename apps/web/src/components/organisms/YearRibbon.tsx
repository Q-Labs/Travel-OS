import { useMemo } from 'react';
import { TODAY } from '../../lib/data';
import { daysBetween, fmtDateRange } from '../../lib/utils';
import type { Trip } from '../../lib/types';

export function YearRibbon({ trips, onOpen }: { trips: Trip[]; onOpen: (id: string) => void }) {
  const year = TODAY.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const total = daysBetween(start, end);
  const todayPct = (daysBetween(start, TODAY) / total) * 100;

  type Bar = { t: Trip; left: number; width: number; row: number };

  const bars: Bar[] = useMemo(() => {
    const raw = trips
      .filter((t) => t.start_date && t.end_date)
      .filter((t) => {
        const s = new Date(t.start_date! + 'T00:00:00');
        const e = new Date(t.end_date! + 'T00:00:00');
        return e >= start && s <= end;
      })
      .map((t) => {
        // Clip to the year window so cross-year trips don't spill outside the ribbon.
        const s = Math.max(new Date(t.start_date! + 'T00:00:00').getTime(), start.getTime());
        const e = Math.min(new Date(t.end_date!  + 'T00:00:00').getTime(), end.getTime());
        const left  = (daysBetween(start, new Date(s)) / total) * 100;
        const width = Math.max(1.2, (daysBetween(new Date(s), new Date(e)) / total) * 100);
        return { t, left, width, row: 0 };
      })
      .sort((a, b) => a.left - b.left);

    // Two-row overlap avoidance
    const rows: Bar[][] = [[], []];
    raw.forEach((b) => {
      const placed = rows.some((row, r) => {
        const conflict = row.some((x) => !(b.left + b.width < x.left || x.left + x.width < b.left));
        if (!conflict) { b.row = r; row.push(b); return true; }
        return false;
      });
      /* v8 ignore next -- defensive fallback when both overlap rows are occupied */
      if (!placed) { b.row = 0; rows[0].push(b); }
    });
    return raw;
  }, [trips]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="year-ribbon">
      <div className="year-ribbon-head">
        <h3>{year} <em>· year at a glance</em></h3>
        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{bars.length} trips across 12 months</div>
      </div>
      <div className="ribbon" style={{ ['--today' as string]: todayPct.toFixed(1) }}>
        {bars.map(({ t, left, width, row }) => (
          <div
            key={t.id}
            className="ribbon-trip"
            style={{
              left: left + '%',
              width: width + '%',
              top: row === 0 ? 6 : 20,
              background: `oklch(48% 0.14 ${t.cover?.hue ?? 30})`,
            }}
            onClick={() => onOpen(t.id)}
            title={`${t.destination} · ${fmtDateRange(t.start_date, t.end_date)}`}
          >
            {t.destination}
          </div>
        ))}
        <div className="ribbon-today" style={{ left: todayPct + '%' }}>
          <div className="ribbon-today-label">Today</div>
        </div>
      </div>
      <div className="ribbon-months">
        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}
