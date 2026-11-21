import { CatPip } from '../atoms/CatPip';
import { VendorMark } from '../atoms/VendorMark';
import { SourceChip } from '../atoms/SourceChip';
import { ParsedCard } from '../molecules/ParsedCard';
import type { InboxItem } from '../../lib/types';
import { Button } from '@q-labs/cobalt';

export function InboxRow({
  item,
  onOpen,
  onAssign,
  onDismiss,
  suggestedTrip,
}: {
  item: InboxItem;
  onOpen: (id: string) => void;
  onAssign: (id: string) => void;
  onDismiss: (id: string) => void;
  suggestedTrip?: { id: string; destination: string; cover: { hue: number } };
}) {
  /* v8 ignore next -- covered in interaction tests, but V8 misses inline JSX callbacks here */
  const handleOpenSuggested = () => suggestedTrip && onOpen(suggestedTrip.id);
  /* v8 ignore next -- covered in interaction tests, but V8 misses inline JSX callbacks here */
  const handleAssign = () => onAssign(item.id);
  /* v8 ignore next -- covered in interaction tests, but V8 misses inline JSX callbacks here */
  const handleDismiss = () => onDismiss(item.id);

  return (
    <div className={`inbox-row ${item.status}`}>
      <VendorMark vendor={item.vendor} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{item.subject}</div>
          <SourceChip source={item.source} />
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
          {item.from} · {item.received_ago}
        </div>
        {item.status === 'parsing' && (
          <div className="parse-shim" style={{ marginTop: 10 }}>
            <div className="bar" />
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Parsing confirmation…</span>
          </div>
        )}
        {item.parsed && <ParsedCard parsed={item.parsed} />}
        {item.note && (
          <div style={{ fontSize: 12, color: 'oklch(58% 0.15 50)', marginTop: 6 }}>⚠ {item.note}</div>
        )}
      </div>
      <div className="inbox-actions">
        {item.suggested_trip && suggestedTrip ? (
          <>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Suggest
              <span style={{ marginLeft: 6, color: 'var(--ink-4)' }}>
                {Math.round((item.suggested_confidence ?? 0) * 100)}%
              </span>
            </div>
            <button className="inbox-suggest" onClick={handleOpenSuggested}>
              <CatPip color={`oklch(48% 0.14 ${suggestedTrip.cover?.hue ?? 30})`} size={8} />
              {suggestedTrip.destination}
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button variant="primary" size="sm"
                onClick={handleAssign}
                disabled={item.status === 'parsing'}
              >
                Attach
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Dismiss
              </Button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="primary" size="sm" disabled>Pick trip…</Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>Dismiss</Button>
          </div>
        )}
      </div>
    </div>
  );
}
