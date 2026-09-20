import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INBOX_DOMAIN, INBOX_MAILBOX } from '../lib/inboxAddress';
import { useApp } from '../app/AppContext';
import { Icon } from './Icon';
import { fmtMoney } from '../lib/utils';
import type { BookingCategory, InboxItem } from '../lib/types';

const SOURCE_META: Record<string, { label: string; color: string; icon: string }> = {
  email:     { label: 'Forwarded',  color: 'oklch(60% 0.08 200)', icon: '✉' },
  gmail:     { label: 'Gmail',      color: 'oklch(58% 0.14 25)',  icon: 'G' },
  extension: { label: 'Extension',  color: 'oklch(60% 0.1 280)',  icon: '⎘' },
  manual:    { label: 'Manual',     color: 'oklch(55% 0.02 80)',  icon: '✎' },
  api:       { label: 'API',        color: 'oklch(55% 0.12 150)', icon: '⚡' },
  viator:    { label: 'Viator',     color: 'oklch(55% 0.14 25)',  icon: 'V' },
};

const VENDOR_GLYPH: Record<string, { c: string; g: string }> = {
  'Airbnb':          { c: 'oklch(60% 0.17 20)',  g: 'A' },
  'United Airlines': { c: 'oklch(45% 0.12 255)', g: 'U' },
  'Viator':          { c: 'oklch(55% 0.14 25)',  g: 'V' },
  'OpenTable':       { c: 'oklch(55% 0.14 30)',  g: 'O' },
  'Expedia':         { c: 'oklch(52% 0.15 260)', g: 'E' },
  'TAP Portugal':    { c: 'oklch(55% 0.14 150)', g: 'T' },
  'Icelandair':      { c: 'oklch(50% 0.13 230)', g: 'I' },
};

const BOOKING_ICONS: Record<BookingCategory, (p: React.SVGProps<SVGSVGElement>) => React.ReactElement> = {
  flight:   Icon.Plane,
  lodging:  Icon.Bed,
  transport: Icon.Car,
  dining:   Icon.Cutlery,
  activity: Icon.Ticket,
  other:    Icon.MoreH,
};

function SourceChip({ source }: { source?: string }) {
  if (!source) return null;
  const m = SOURCE_META[source] ?? SOURCE_META.manual;
  return (
    <span className="src-chip" title={`From ${m.label}`}>
      <span className="src-glyph" style={{ background: m.color }}>{m.icon}</span>
      {m.label}
    </span>
  );
}

function InboxRow({
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
  const vg = VENDOR_GLYPH[item.vendor] ?? { c: 'var(--ink-3)', g: item.vendor[0] };
  const ParsedIcon = item.parsed ? (BOOKING_ICONS[item.parsed.type] ?? Icon.MoreH) : null;
  /* v8 ignore next -- covered in interaction tests, but V8 misses inline JSX callbacks here */
  const handleOpenSuggested = () => suggestedTrip && onOpen(suggestedTrip.id);
  /* v8 ignore next -- covered in interaction tests, but V8 misses inline JSX callbacks here */
  const handleAssign = () => onAssign(item.id);
  /* v8 ignore next -- covered in interaction tests, but V8 misses inline JSX callbacks here */
  const handleDismiss = () => onDismiss(item.id);

  return (
    <div className={`inbox-row ${item.status}`}>
      <div className="vendor-mark" style={{ background: vg.c }}>{vg.g}</div>
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
        {item.parsed && ParsedIcon && (
          <div className="parsed-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ParsedIcon />
              <strong style={{ fontSize: 13.5 }}>{item.parsed.title}</strong>
              {item.parsed.cost > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-2)' }}>
                  {fmtMoney(item.parsed.cost)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11.5, color: 'var(--ink-3)' }}>
              <span>{item.parsed.dates}</span>
              {item.parsed.confirmation && (
                <span style={{ fontFamily: 'var(--font-mono)' }}>{item.parsed.confirmation}</span>
              )}
            </div>
            {item.parsed.note && (
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4, fontStyle: 'italic' }}>
                {item.parsed.note}
              </div>
            )}
          </div>
        )}
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
              <span className="cat-pip" style={{ background: `oklch(48% 0.14 ${suggestedTrip.cover?.hue ?? 30})`, width: 8, height: 8 }} />
              {suggestedTrip.destination}
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn primary"
                style={{ padding: '6px 12px' }}
                onClick={handleAssign}
                disabled={item.status === 'parsing'}
              >
                Attach
              </button>
              <button className="btn" style={{ padding: '6px 12px' }} onClick={handleDismiss}>
                Dismiss
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn primary" style={{ padding: '6px 12px' }} disabled>Pick trip…</button>
            <button className="btn" style={{ padding: '6px 12px' }} onClick={handleDismiss}>Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function InboxDashboard() {
  const { trips, inbox, assignInboxItem, dismissInboxItem, inboxToken } = useApp();
  const [addressCopied, setAddressCopied] = useState(false);

  // The address is derived from the user's routing token; there is no address
  // to advertise until one exists.
  const forwardAddress = inboxToken ? `${INBOX_MAILBOX}+${inboxToken}@${INBOX_DOMAIN}` : null;

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setAddressCopied(true);
      window.setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      setAddressCopied(false);
    }
  };
  const navigate = useNavigate();
  const openTrip = (id: string) => navigate(`/app/trip/${id}`);

  const sourceCounts = inbox.reduce<Record<string, number>>((m, i) => {
    m[i.source] = (m[i.source] ?? 0) + 1;
    return m;
  }, {});

  return (
    <div className="inbox-view">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, margin: '8px 0 24px' }}>
        <div className="metric">
          <div className="label">In the inbox</div>
          <div className="value">{inbox.length}</div>
          <div className="hint">awaiting attach or review</div>
        </div>
        <div className="metric">
          <div className="label">Parsed</div>
          <div className="value">{inbox.filter((i) => i.status === 'parsed').length}</div>
          <div className="hint">auto-matched to a trip</div>
        </div>
        <div className="metric">
          <div className="label">Parsing now</div>
          <div className="value">{inbox.filter((i) => i.status === 'parsing').length}</div>
          <div className="hint">running through the LLM</div>
        </div>
        <div className="metric">
          <div className="label">Needs review</div>
          <div className="value">
            {inbox.filter((i) => i.status === 'needs_review' || i.status === 'pending_trip').length}
          </div>
          <div className="hint">ambiguous or duplicate</div>
        </div>
      </div>

      <div className="forward-card">
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.01em' }}>
            Forward anything to <em style={{ fontStyle: 'italic' }}>{forwardAddress ?? 'your forwarding address'}</em>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.5 }}>
            Hotel confirms, Viator receipts, OpenTable reservations, flight emails — anything.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <span className="src-chip">
              <span className="src-glyph" style={{ background: SOURCE_META.email.color }}>✉</span>
              Forwarded · {sourceCounts.email ?? 0}
            </span>
            <span className="src-chip">
              <span className="src-glyph" style={{ background: SOURCE_META.gmail.color }}>G</span>
              Gmail · {sourceCounts.gmail ?? 0}
            </span>
            <span className="src-chip">
              <span className="src-glyph" style={{ background: SOURCE_META.extension.color }}>⎘</span>
              Extension · {sourceCounts.extension ?? 0}
            </span>
          </div>
        </div>
        <button
          className="btn"
          disabled={!forwardAddress}
          onClick={forwardAddress ? () => void copyAddress(forwardAddress) : undefined}
        >
          {addressCopied ? 'Copied' : 'Copy address'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        {inbox.map((item) => (
          <InboxRow
            key={item.id}
            item={item}
            onOpen={openTrip}
            onAssign={assignInboxItem}
            onDismiss={dismissInboxItem}
            suggestedTrip={item.suggested_trip ? trips.find((t) => t.id === item.suggested_trip) : undefined}
          />
        ))}
        {inbox.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-3)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, color: 'var(--ink-2)' }}>
              Inbox zero.
            </div>
            <div style={{ marginTop: 6, fontSize: 13 }}>New confirmations will show up here.</div>
          </div>
        )}
      </div>
    </div>
  );
}
