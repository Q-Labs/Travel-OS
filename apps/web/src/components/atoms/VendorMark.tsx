const VENDOR_GLYPH: Record<string, { c: string; g: string }> = {
  'Airbnb':          { c: 'oklch(60% 0.17 20)',  g: 'A' },
  'United Airlines': { c: 'oklch(45% 0.12 255)', g: 'U' },
  'Viator':          { c: 'oklch(55% 0.14 25)',  g: 'V' },
  'OpenTable':       { c: 'oklch(55% 0.14 30)',  g: 'O' },
  'Expedia':         { c: 'oklch(52% 0.15 260)', g: 'E' },
  'TAP Portugal':    { c: 'oklch(55% 0.14 150)', g: 'T' },
  'Icelandair':      { c: 'oklch(50% 0.13 230)', g: 'I' },
};

export function VendorMark({ vendor }: { vendor: string }) {
  const vg = VENDOR_GLYPH[vendor] ?? { c: 'var(--ink-3)', g: vendor[0] };
  return <div className="vendor-mark" style={{ background: vg.c }}>{vg.g}</div>;
}
