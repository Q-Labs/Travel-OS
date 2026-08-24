/**
 * Currency conversion against a single reference table.
 *
 * Rates come from the ECB via Frankfurter, which quotes everything relative to
 * one base, so cross-rates are derived by routing through that base.
 */

export type RateTable = {
  base: string;
  rates: Record<string, number>;
};

/** Rate to convert one unit of `code` into the table's base currency. */
function toBase(code: string, table: RateTable): number | null {
  if (code === table.base) return 1;
  const rate = table.rates[code];
  return rate === undefined ? null : 1 / rate;
}

/** Rate to convert one unit of the base currency into `code`. */
function fromBase(code: string, table: RateTable): number | null {
  if (code === table.base) return 1;
  return table.rates[code] ?? null;
}

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  table: RateTable,
): number | null {
  if (from === to) return amount;
  const into = toBase(from, table);
  const outOf = fromBase(to, table);
  if (into === null || outOf === null) return null;
  return amount * into * outOf;
}

export function fmtMoneyIn(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Intl throws on a malformed currency code; still show the number.
    return `${currency} ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
}
