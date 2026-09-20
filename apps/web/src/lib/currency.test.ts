import { describe, expect, it } from 'vitest';
import { convertAmount, fmtMoneyIn } from './currency';
import type { RateTable } from './currency';

const TABLE: RateTable = { base: 'USD', rates: { EUR: 0.92, JPY: 155, MAD: 10 } };

describe('convertAmount', () => {
  it('returns the amount unchanged for a same-currency conversion', () => {
    expect(convertAmount(100, 'EUR', 'EUR', TABLE)).toBe(100);
  });

  it('converts from the base currency', () => {
    expect(convertAmount(100, 'USD', 'EUR', TABLE)).toBeCloseTo(92);
  });

  it('converts to the base currency', () => {
    expect(convertAmount(92, 'EUR', 'USD', TABLE)).toBeCloseTo(100);
  });

  it('converts between two non-base currencies', () => {
    // 92 EUR -> 100 USD -> 15500 JPY
    expect(convertAmount(92, 'EUR', 'JPY', TABLE)).toBeCloseTo(15500);
  });

  it('returns null when the source rate is unknown', () => {
    expect(convertAmount(100, 'GBP', 'USD', TABLE)).toBeNull();
  });

  it('returns null when the target rate is unknown', () => {
    expect(convertAmount(100, 'USD', 'GBP', TABLE)).toBeNull();
  });

  it('returns null when both rates are unknown', () => {
    expect(convertAmount(100, 'GBP', 'CHF', TABLE)).toBeNull();
  });
});

describe('fmtMoneyIn', () => {
  it('formats in the given currency', () => {
    expect(fmtMoneyIn(1240, 'EUR')).toContain('1,240');
    expect(fmtMoneyIn(1240, 'USD')).toContain('$');
  });

  it('rounds to whole units', () => {
    expect(fmtMoneyIn(1240.7, 'USD')).not.toContain('.');
  });

  it('falls back to a plain rendering for an unknown currency code', () => {
    expect(fmtMoneyIn(1240, 'XXXX')).toContain('1,240');
  });
});
