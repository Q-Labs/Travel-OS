import { describe, expect, it } from 'vitest';
import { ACCENTS, accentTokens } from './accents';

const ACCENT_TOKENS = [
  '--accent-default', '--accent-hover', '--accent-pressed', '--accent-subtle', '--accent-glow',
  '--text-accent', '--border-accent', '--shadow-glow-cobalt',
];

describe('accents', () => {
  it('lists Cobalt first, drawn from its own token rather than a copied hex', () => {
    expect(ACCENTS.map((a) => a.key)).toEqual(['cobalt', 'emerald', 'violet', 'rust']);
    expect(ACCENTS[0]).toEqual({ key: 'cobalt', label: 'Cobalt', swatch: 'var(--cobalt-500)' });
    expect(ACCENTS.find((a) => a.key === 'emerald')?.swatch).toBe('#1F8A5B');
  });

  it('leaves every Cobalt token alone for the default accent', () => {
    expect(accentTokens('cobalt', 'dark')).toEqual({});
    expect(accentTokens('cobalt', 'light')).toEqual({});
  });

  it('overrides every accent-derived token for an alternate, not just --accent-default', () => {
    const tokens = accentTokens('emerald', 'dark');
    expect(Object.keys(tokens).sort()).toEqual([...ACCENT_TOKENS].sort());
    expect(tokens['--accent-default']).toBe('#1F8A5B');
    expect(tokens['--border-accent']).toBe('#1F8A5B');
    for (const name of ACCENT_TOKENS) expect(tokens[name]).toContain('#1F8A5B');
  });

  it('keeps accent text readable: lighter on dark surfaces, darker on light ones', () => {
    expect(accentTokens('rust', 'dark')['--text-accent']).toContain('white');
    expect(accentTokens('rust', 'light')['--text-accent']).toContain('black');
  });
});
