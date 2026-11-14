import { useState } from 'react';
import { fmtMoneyIn } from '../../lib/currency';
import { TRAVELERS } from '../../lib/data';
import type { Trip, TripSplit } from '../../lib/types';
import { Icon } from '../atoms/Icon';

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

export function SplitBudget({ splits, trip }: { splits: TripSplit[] | undefined; trip: Trip }) {
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
          Default: equal split — {fmtMoneyIn(trip.budget_total / trip.travelers.length, trip.budget_currency)} per person
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
                <div className="split-amounts">Paid {fmtMoneyIn(s.paid, trip.budget_currency)} · share {fmtMoneyIn(s.share, trip.budget_currency)}</div>
                <div className="split-bar-wrap">
                  <div className="split-bar-track">
                    <div className="split-bar-fill" style={{ width: `${paidPct}%`, background: barColor }} />
                    <div className="split-bar-marker" style={{ left: `${sharePct}%` }} />
                  </div>
                </div>
              </div>
              <div className="split-balance" style={{ color: balColor }}>
                <div className="split-balance-amount">
                  {isOwed ? '+' : isOwes ? '-' : '±'}{fmtMoneyIn(Math.abs(balance), trip.budget_currency)}
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
              <div className="settle-amount">{fmtMoneyIn(row.amount, trip.budget_currency)}</div>
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
