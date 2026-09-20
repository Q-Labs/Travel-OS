import { useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { daysBetween } from '../lib/utils';
import { HOME_CURRENCY, fmtMoneyIn, sumInCurrency } from '../lib/currency';
import { TripCard } from './TripCard';

export function ArchiveDashboard() {
  const { trips } = useApp();
  const navigate = useNavigate();
  const onOpen = (id: string) => navigate(`/app/trip/${id}`);

  const archived = trips
    .filter((t) => t.stage === 'archived')
    .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''));

  const byYear: Record<number, typeof archived> = {};
  archived.forEach((t) => {
    const y = new Date(t.start_date! + 'T00:00:00').getFullYear();
    (byYear[y] = byYear[y] ?? []).push(t);
  });

  const allCountries = new Set(archived.map((t) => t.country));
  const allDays = archived.reduce(
    (s, t) => s + (t.nights || (t.start_date && t.end_date ? daysBetween(t.start_date, t.end_date) : 0)),
    0,
  );
  // Same reasoning as the pipeline metrics: only home-currency trips are
  // summed, and anything left out is disclosed rather than silently folded in.
  const lifetime = sumInCurrency(archived, HOME_CURRENCY, (t) => t.budget_spent, (t) => t.budget_currency);
  const totalSpend = lifetime.total;
  const avgSpend = lifetime.counted > 0 ? totalSpend / lifetime.counted : 0;

  const countryList = [...allCountries].slice(0, 3).join(', ') + (allCountries.size > 3 ? '…' : '');

  return (
    <div className="archive">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 16, marginBottom: 20 }}>
        <div className="metric">
          <div className="label">Lifetime trips</div>
          <div className="value">{archived.length}</div>
          <div className="hint">completed and logged</div>
        </div>
        <div className="metric">
          <div className="label">Countries</div>
          <div className="value">{allCountries.size}</div>
          <div className="hint">{countryList}</div>
        </div>
        <div className="metric">
          <div className="label">Days traveled</div>
          <div className="value">{allDays}</div>
          <div className="hint">across all archived trips</div>
        </div>
        <div className="metric">
          <div className="label">Lifetime spend</div>
          <div className="value">{fmtMoneyIn(totalSpend, HOME_CURRENCY)}</div>
          <div className="hint">
            avg {fmtMoneyIn(avgSpend, HOME_CURRENCY)}/trip
            {lifetime.excluded > 0 && ` · ${lifetime.excluded} in other currencies not counted`}
          </div>
        </div>
      </div>

      {Object.keys(byYear)
        .map(Number)
        .sort((a, b) => b - a)
        .map((y) => {
          const yearTrips = byYear[y];
          const ySpend = sumInCurrency(yearTrips, HOME_CURRENCY, (t) => t.budget_spent, (t) => t.budget_currency).total;
          const yDays = yearTrips.reduce((s, t) => s + (t.nights || 0), 0);
          return (
            <div key={y} className="archive-year">
              <div>
                <h2>{y}</h2>
                <div className="archive-year-stats">
                  {yearTrips.length} {yearTrips.length === 1 ? 'trip' : 'trips'}<br />
                  {yDays} days<br />
                  {fmtMoneyIn(ySpend, HOME_CURRENCY)}
                </div>
              </div>
              <div className="archive-trips">
                {yearTrips.map((t) => (
                  <TripCard key={t.id} trip={t} onClick={() => onOpen(t.id)} />
                ))}
              </div>
            </div>
          );
        })}

      {archived.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-3)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, color: 'var(--ink-2)' }}>
            Nothing archived yet.
          </div>
          <div style={{ marginTop: 6, fontSize: 13 }}>Completed trips will appear here.</div>
        </div>
      )}
    </div>
  );
}
