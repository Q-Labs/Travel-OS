import type { RateTable } from '../currency';
import type { FetchFn } from './openMeteo';

/**
 * Frankfurter publishes the European Central Bank's daily reference rates.
 * No API key, no account, no rate limit worth worrying about.
 */
const RATES_URL = 'https://api.frankfurter.dev/v1/latest';

export async function fetchRates(
  base: string,
  symbols: string[],
  fetchFn: FetchFn,
): Promise<RateTable | null> {
  const params = new URLSearchParams({ base });
  if (symbols.length > 0) params.set('symbols', symbols.join(','));
  try {
    const res = await fetchFn(`${RATES_URL}?${params}`);
    if (!res.ok) return null;
    const body = (await res.json()) as { base?: string; rates?: Record<string, number> };
    if (!body.rates) return null;
    return { base: body.base ?? base, rates: body.rates };
  } catch {
    // Budgets still render in their native currency without a conversion.
    return null;
  }
}
