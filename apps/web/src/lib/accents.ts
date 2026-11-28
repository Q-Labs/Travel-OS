/** The accent colours the Tweaks panel offers. `cobalt` is Cobalt's own default. */
export type AccentKey = 'cobalt' | 'emerald' | 'violet' | 'rust';
type Theme = 'dark' | 'light';

// Alternates to Cobalt's own accent. Cobalt's is the default and is never
// overridden, so its swatch reads the token instead of copying the hex.
const ALTERNATES: Record<Exclude<AccentKey, 'cobalt'>, { label: string; colour: string }> = {
  emerald: { label: 'Emerald', colour: '#1F8A5B' },
  violet:  { label: 'Violet',  colour: '#7A5AE0' },
  rust:    { label: 'Rust',    colour: '#C2410C' },
};

/**
 * The accents on offer, each with the name shown to the user and the colour for
 * its swatch. Cobalt's swatch reads the design-system token, so it cannot drift
 * from the colour Cobalt really uses.
 */
export const ACCENTS: { key: AccentKey; label: string; swatch: string }[] = [
  { key: 'cobalt', label: 'Cobalt', swatch: 'var(--cobalt-500)' },
  ...(Object.entries(ALTERNATES) as [Exclude<AccentKey, 'cobalt'>, { label: string; colour: string }][])
    .map(([key, a]) => ({ key, label: a.label, swatch: a.colour })),
];

/**
 * The Cobalt tokens to override for an accent, covering every token derived
 * from it so an alternate never leaves a stray blue behind. Cobalt's own accent
 * needs none and gets an empty object. Accent text is mixed toward the
 * surface's opposite so it stays readable, mirroring Cobalt (cobalt-300 on
 * dark, cobalt-600 on light).
 */
export function accentTokens(key: AccentKey, theme: Theme): Record<string, string> {
  if (key === 'cobalt') return {};
  const c = ALTERNATES[key].colour;
  return {
    '--accent-default':    c,
    '--accent-hover':      `color-mix(in oklab, ${c} 78%, white)`,
    '--accent-pressed':    `color-mix(in oklab, ${c} 80%, black)`,
    '--accent-subtle':     `color-mix(in oklab, ${c} 14%, transparent)`,
    '--accent-glow':       `color-mix(in oklab, ${c} 26%, transparent)`,
    '--text-accent':       theme === 'dark' ? `color-mix(in oklab, ${c} 60%, white)` : `color-mix(in oklab, ${c} 80%, black)`,
    '--border-accent':     c,
    '--shadow-glow-cobalt': `0 0 24px color-mix(in oklab, ${c} 30%, transparent)`,
  };
}
