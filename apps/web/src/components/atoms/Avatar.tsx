import type { ReactNode } from 'react';

export function Avatar({ title, muted, children }: { title?: string; muted?: boolean; children: ReactNode }) {
  return (
    <div className="av" title={title} style={muted ? { background: 'var(--ink-3)' } : undefined}>
      {children}
    </div>
  );
}
