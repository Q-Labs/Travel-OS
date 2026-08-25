import { describe, expect, it, vi } from 'vitest';
import { fetchRates } from './frankfurter';

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

describe('fetchRates', () => {
  it('returns the rate table', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({ amount: 1, base: 'USD', date: '2026-04-20', rates: { EUR: 0.92, JPY: 155 } }),
    );
    expect(await fetchRates('USD', ['EUR', 'JPY'], fetchFn)).toEqual({
      base: 'USD',
      rates: { EUR: 0.92, JPY: 155 },
    });
    const url = String(fetchFn.mock.calls[0]?.[0]);
    expect(url).toContain('api.frankfurter.dev');
    expect(url).toContain('base=USD');
    expect(url).toContain('symbols=EUR%2CJPY');
  });

  it('omits the symbols parameter when none are requested', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ base: 'USD', rates: { EUR: 0.92 } }));
    await fetchRates('USD', [], fetchFn);
    expect(String(fetchFn.mock.calls[0]?.[0])).not.toContain('symbols=');
  });

  it('falls back to the requested base when the payload omits it', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ rates: { EUR: 0.92 } }));
    expect((await fetchRates('USD', ['EUR'], fetchFn))?.base).toBe('USD');
  });

  it('returns null on a non-ok response', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, false));
    expect(await fetchRates('USD', ['EUR'], fetchFn)).toBeNull();
  });

  it('returns null when the payload has no rates', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ base: 'USD' }));
    expect(await fetchRates('USD', ['EUR'], fetchFn)).toBeNull();
  });

  it('returns null when the request throws', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await fetchRates('USD', ['EUR'], fetchFn)).toBeNull();
  });
});
