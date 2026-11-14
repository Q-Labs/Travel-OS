import { HOME_CURRENCY, fmtMoneyIn, sumInCurrency } from '../../lib/currency';
import { TODAY } from '../../lib/data';
import { daysBetween, fmtDate } from '../../lib/utils';
import type { Trip } from '../../lib/types';
import { MetricTile } from '../molecules/MetricTile';

export function MetricsStrip({ trips }: { trips: Trip[] }) {
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
      <MetricTile
        pop
        label="Next trip"
        value={next ? <>{nextDays}<span className="suffix">{nextDays === 1 ? 'day' : 'days'}</span></> : <em>—</em>}
        hint={next ? <>{next.destination} · {fmtDate(next.start_date)}</> : 'nothing booked'}
      />
      <MetricTile label="Active plans" value={active} hint="across Planning, Booked, Upcoming" />
      <MetricTile
        label={`${year} spend`}
        value={<>{fmtMoneyIn(ytdSpend, HOME_CURRENCY)}<span className="suffix">/ {fmtMoneyIn(annualBudget, HOME_CURRENCY)}</span></>}
        hintStyle={{ marginTop: 8 }}
        hint={
          <>
            <div style={{ height: 4, background: 'var(--bg-sunken)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: ytdPct + '%', height: '100%', background: 'var(--accent)' }} />
            </div>
            <div style={{ marginTop: 4 }}>{ytdPct.toFixed(0)}% of annual</div>
          </>
        }
      />
      <MetricTile
        label="Trips in motion"
        value={totalTrips}
        hint={
          <>
            {trips.filter((t) => t.stage === 'dreaming').length} dreaming ·{' '}
            {trips.filter((t) => t.stage === 'archived').length} archived
          </>
        }
      />
    </div>
  );
}
