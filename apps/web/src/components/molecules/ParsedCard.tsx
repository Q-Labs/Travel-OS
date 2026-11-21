import { fmtMoney } from '../../lib/utils';
import type { ParsedInbox } from '../../lib/types';
import { BOOKING_ICONS, Icon } from '../atoms/Icon';

export function ParsedCard({ parsed }: { parsed: ParsedInbox }) {
  const ParsedIcon = BOOKING_ICONS[parsed.type] ?? Icon.MoreH;
  return (
    <div className="parsed-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ParsedIcon />
        <strong style={{ fontSize: 13.5 }}>{parsed.title}</strong>
        {parsed.cost > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-2)' }}>
            {fmtMoney(parsed.cost)}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11.5, color: 'var(--ink-3)' }}>
        <span>{parsed.dates}</span>
        {parsed.confirmation && (
          <span style={{ fontFamily: 'var(--font-mono)' }}>{parsed.confirmation}</span>
        )}
      </div>
      {parsed.note && (
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4, fontStyle: 'normal' }}>
          {parsed.note}
        </div>
      )}
    </div>
  );
}
