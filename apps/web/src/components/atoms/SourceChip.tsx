/** How each source is shown: its label, the colour of its glyph and a one-character icon. A source that is not listed is shown as `manual`. */
export const SOURCE_META: Record<string, { label: string; color: string; icon: string }> = {
  email:     { label: 'Forwarded',  color: 'oklch(60% 0.08 200)', icon: '✉' },
  gmail:     { label: 'Gmail',      color: 'oklch(58% 0.14 25)',  icon: 'G' },
  extension: { label: 'Extension',  color: 'oklch(60% 0.1 280)',  icon: '⎘' },
  manual:    { label: 'Manual',     color: 'oklch(55% 0.02 80)',  icon: '✎' },
  api:       { label: 'API',        color: 'oklch(55% 0.12 150)', icon: '⚡' },
  viator:    { label: 'Viator',     color: 'oklch(55% 0.14 25)',  icon: 'V' },
};

/**
 * A small chip naming where an item came from. With a count it is a tally
 * ("Forwarded · 3"); without one it tags a single item and explains itself on
 * hover. Nothing is drawn when there is no source.
 */
export function SourceChip({ source, count }: { source?: string; count?: number }) {
  if (!source) return null;
  const m = SOURCE_META[source] ?? SOURCE_META.manual;
  return (
    <span className="src-chip" title={count === undefined ? `From ${m.label}` : undefined}>
      <span className="src-glyph" style={{ background: m.color }}>{m.icon}</span>
      {count === undefined ? m.label : `${m.label} · ${count}`}
    </span>
  );
}
