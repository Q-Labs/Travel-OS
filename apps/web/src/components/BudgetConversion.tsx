import { useEffect, useState } from 'react';
import { fetchRates } from '../lib/clients/frankfurter';
import { HOME_CURRENCY, convertAmount, fmtMoneyIn } from '../lib/currency';
import type { Trip } from '../lib/types';

type Loaded = { for: string; value: number | null };

/**
 * Shows a home-currency equivalent beside a budget held in another currency.
 * Renders nothing when the trip is already in the home currency, or when rates
 * are unavailable — the native figure is always shown regardless.
 */
export function BudgetConversion({ trip }: { trip: Trip }) {
  const [loaded, setLoaded] = useState<Loaded>({ for: '', value: null });
  const { budget_currency: currency, budget_total: total } = trip;
  const key = `${currency}:${total}`;

  useEffect(() => {
    if (currency === HOME_CURRENCY) return;
    let cancelled = false;
    void (async () => {
      const table = await fetchRates(HOME_CURRENCY, [currency], (url, init) => fetch(url, init));
      if (cancelled || !table) return;
      setLoaded({ for: `${currency}:${total}`, value: convertAmount(total, currency, HOME_CURRENCY, table) });
    })();
    return () => {
      cancelled = true;
    };
  }, [currency, total]);

  if (currency === HOME_CURRENCY) return null;
  // Tracking which currency/total the figure belongs to hides a previous trip's
  // conversion while a new one loads — and keeps it hidden if that fetch fails
  // — without clearing state synchronously inside the effect.
  const converted = loaded.for === key ? loaded.value : null;
  if (converted === null) return null;

  return (
    <div className="budget-converted">
      ≈ {fmtMoneyIn(converted, HOME_CURRENCY)}
      <span> · ECB reference rate</span>
    </div>
  );
}
