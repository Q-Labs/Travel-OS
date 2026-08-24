import { useEffect, useState } from 'react';
import { fetchRates } from '../lib/clients/frankfurter';
import { HOME_CURRENCY, convertAmount, fmtMoneyIn } from '../lib/currency';
import type { Trip } from '../lib/types';

/**
 * Shows a home-currency equivalent beside a budget held in another currency.
 * Renders nothing when the trip is already in the home currency, or when rates
 * are unavailable — the native figure is always shown regardless.
 */
export function BudgetConversion({ trip }: { trip: Trip }) {
  const [converted, setConverted] = useState<number | null>(null);
  const { budget_currency: currency, budget_total: total } = trip;

  useEffect(() => {
    if (currency === HOME_CURRENCY) return;
    let cancelled = false;
    void (async () => {
      const table = await fetchRates(HOME_CURRENCY, [currency], (url, init) => fetch(url, init));
      if (cancelled || !table) return;
      setConverted(convertAmount(total, currency, HOME_CURRENCY, table));
    })();
    return () => {
      cancelled = true;
    };
  }, [currency, total]);

  if (currency === HOME_CURRENCY || converted === null) return null;

  return (
    <div className="budget-converted">
      ≈ {fmtMoneyIn(converted, HOME_CURRENCY)}
      <span> · ECB reference rate</span>
    </div>
  );
}
