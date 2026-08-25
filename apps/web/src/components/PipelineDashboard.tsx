import { useMemo, useState } from 'react';
import { HOME_CURRENCY, fmtMoneyIn, sumInCurrency } from '../lib/currency';
import { useNavigate } from 'react-router-dom';
import { TODAY } from '../lib/data';
import { CAT_MAP, STAGES, coverStyle, daysBetween, fmtDate, fmtDateRange } from '../lib/utils';
import type { Insight, Trip, TripCategory } from '../lib/types';
import { useApp } from '../app/AppContext';
import { Icon } from './Icon';
import { TripCard } from './TripCard';

// ─── Metrics strip ────────────────────────────────────────────────────────────

function MetricsStrip({ trips }: { trips: Trip[] }) {
  const upcoming = trips
    .filter((t) => t.start_date && daysBetween(TODAY, t.start_date) >= 0)
    .sort((a, b) => a.start_date!.localeCompare(b.start_date!));
  const next = upcoming[0];
  const nextDays = next ? daysBetween(TODAY, next.start_date!) : null;

  const active = trips.filter((t) => ['planning', 'booked', 'upcoming'].includes(t.stage)).length;

  const year = TODAY.getFullYear();
  const ytdTrips = trips.filter((t) => {
    if (!t.start_date) return false;
    return new Date(t.start_date + 'T00:00:00').getFullYear() === year;
  });
  // Only home-currency trips are summed; mixing ¥ and $ into one figure would
  // be nonsense and there are no live rates here to convert with.
  const ytd = sumInCurrency(ytdTrips, HOME_CURRENCY, (t) => t.budget_spent, (t) => t.budget_currency);
  const ytdSpend = ytd.total;
  const annualBudget = 30000;
  const ytdPct = Math.min(100, (ytdSpend / annualBudget) * 100);
  const totalTrips = trips.filter((t) => t.stage !== 'archived').length;

  return (
    <div className="metrics">
      <div className="metric pop">
        <div className="label">Next trip</div>
        {next ? (
          <>
            <div className="value">{nextDays}<span className="suffix">{nextDays === 1 ? 'day' : 'days'}</span></div>
            <div className="hint">{next.destination} · {fmtDate(next.start_date)}</div>
          </>
        ) : (
          <><div className="value"><em>—</em></div><div className="hint">nothing booked</div></>
        )}
      </div>
      <div className="metric">
        <div className="label">Active plans</div>
        <div className="value">{active}</div>
        <div className="hint">across Planning, Booked, Upcoming</div>
      </div>
      <div className="metric">
        <div className="label">{year} spend</div>
        <div className="value">{fmtMoneyIn(ytdSpend, HOME_CURRENCY)}<span className="suffix">/ {fmtMoneyIn(annualBudget, HOME_CURRENCY)}</span></div>
        <div className="hint" style={{ marginTop: 8 }}>
          <div style={{ height: 4, background: 'var(--bg-sunken)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: ytdPct + '%', height: '100%', background: 'var(--accent)' }} />
          </div>
          <div style={{ marginTop: 4 }}>{ytdPct.toFixed(0)}% of annual</div>
        </div>
      </div>
      <div className="metric">
        <div className="label">Trips in motion</div>
        <div className="value">{totalTrips}</div>
        <div className="hint">
          {trips.filter((t) => t.stage === 'dreaming').length} dreaming ·{' '}
          {trips.filter((t) => t.stage === 'archived').length} archived
        </div>
      </div>
    </div>
  );
}

// ─── Year ribbon ──────────────────────────────────────────────────────────────

function YearRibbon({ trips, onOpen }: { trips: Trip[]; onOpen: (id: string) => void }) {
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

// ─── Kanban board ─────────────────────────────────────────────────────────────

function KanbanBoard({
  trips,
  categoryFilter,
  onOpen,
  onMove,
}: {
  trips: Trip[];
  categoryFilter: string[];
  onOpen: (id: string) => void;
  onMove: (id: string, stage: Trip['stage']) => void;
}) {
  const [dragTrip, setDragTrip] = useState<Trip | null>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);

  const filtered = categoryFilter.length
    ? trips.filter((t) => t.categories.some((c) => categoryFilter.includes(c)))
    : trips;

  const byStage = useMemo(() => {
    const m: Record<string, Trip[]> = {};
    STAGES.forEach((s) => { m[s.key] = []; });
    filtered.forEach((t) => { if (m[t.stage]) m[t.stage].push(t); });
    Object.keys(m).forEach((k) => {
      m[k].sort((a, b) => {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return a.start_date.localeCompare(b.start_date);
      });
    });
    return m;
  }, [filtered]);

  const handleDragStart = (e: React.DragEvent, t: Trip) => {
    setDragTrip(t);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', t.id); // required for Firefox
  };
  const handleDragEnd = () => { setDragTrip(null); setDropStage(null); };
  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    if (stage !== dropStage) setDropStage(stage);
  };
  const handleDragLeave = (stage: string) => {
    if (stage === dropStage) setDropStage(null);
  };
  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    /* v8 ignore next -- same-stage/no-drag drops are harmless defensive guards */
    if (dragTrip && dragTrip.stage !== stage) onMove(dragTrip.id, dragTrip.stage !== stage ? stage as Trip['stage'] : dragTrip.stage);
    setDragTrip(null);
    setDropStage(null);
  };

  return (
    <div className="pipeline">
      {STAGES.map((stage) => (
        <div
          key={stage.key}
          className={`column${dropStage === stage.key && dragTrip?.stage !== stage.key ? ' drop-target' : ''}`}
          onDragOver={(e) => handleDragOver(e, stage.key)}
          onDragLeave={() => handleDragLeave(stage.key)}
          onDrop={(e) => handleDrop(e, stage.key)}
        >
          <div className="column-head">
            <span className="name">{stage.label}</span>
            <span className="count">{byStage[stage.key].length}</span>
          </div>
          {byStage[stage.key].map((t) => (
            <TripCard
              key={t.id}
              trip={t}
              onClick={() => onOpen(t.id)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              isDragging={dragTrip?.id === t.id}
            />
          ))}
          {byStage[stage.key].length === 0 && (
            <div className="column-empty">nothing here yet</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Insights strip ───────────────────────────────────────────────────────────

function InsightsStrip({
  insights,
  onOpen,
  onDismiss,
}: {
  insights: Insight[];
  onOpen: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (!insights.length) return null;
  return (
    <div className="insights">
      <h3>Nudges <em>· gentle, dismissible</em></h3>
      <div className="insights-scroller">
        {insights.map((i) => (
          <div key={i.id} className={`insight ${i.severity}`}>
            <div className="sev" />
            <div
              className="body"
              onClick={() => i.trip_id && onOpen(i.trip_id)}
              style={{ cursor: i.trip_id ? 'pointer' : 'default' }}
            >
              <div className="t">{i.title}</div>
              <div className="b">{i.body}</div>
            </div>
            <button className="x" onClick={() => onDismiss(i.id)}><Icon.Close /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PipelineDashboard() {
  const {
    trips, searchedTrips, insights,
    categoryFilter, toggleCategoryFilter,
    moveStage, dismissInsight,
  } = useApp();
  const navigate = useNavigate();
  const openTrip = (id: string) => navigate(`/app/trip/${id}`);

  const activeTrips = searchedTrips.filter((t) => t.stage !== 'archived');

  return (
    <div className="dashboard">
      <MetricsStrip trips={trips} />
      <YearRibbon trips={trips.filter((t) => t.stage !== 'archived')} onOpen={openTrip} />

      <div className="pipeline-head">
        <h3>Pipeline <em>· {activeTrips.length} trips in motion</em></h3>
        {categoryFilter.length > 0 && (
          <div className="filter-chips">
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Filter:</span>
            {categoryFilter.map((k) => (
              <button key={k} className="chip on" onClick={() => toggleCategoryFilter(k)}>
                <span className="sw" style={{ background: CAT_MAP[k as TripCategory]?.color }} />
                {CAT_MAP[k as TripCategory]?.label}
                <Icon.Close style={{ width: 10, height: 10 }} />
              </button>
            ))}
            <button className="chip" onClick={() => categoryFilter.forEach((k) => toggleCategoryFilter(k))}>
              Clear
            </button>
          </div>
        )}
      </div>

      <KanbanBoard
        trips={activeTrips}
        categoryFilter={categoryFilter}
        onOpen={openTrip}
        onMove={moveStage}
      />

      <InsightsStrip insights={insights} onOpen={openTrip} onDismiss={dismissInsight} />
    </div>
  );
}

// coverStyle re-export for archive use
export { coverStyle };
