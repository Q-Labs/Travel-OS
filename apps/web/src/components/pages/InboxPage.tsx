import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INBOX_DOMAIN, INBOX_MAILBOX } from '../../lib/inboxAddress';
import { useApp } from '../../app/AppContext';
import { SourceChip } from '../atoms/SourceChip';
import { EmptyState } from '../molecules/EmptyState';
import { MetricTile } from '../molecules/MetricTile';
import { InboxRow } from '../organisms/InboxRow';

export function InboxPage() {
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
        <MetricTile label="In the inbox" value={inbox.length} hint="awaiting attach or review" />
        <MetricTile
          label="Parsed"
          value={inbox.filter((i) => i.status === 'parsed').length}
          hint="auto-matched to a trip"
        />
        <MetricTile
          label="Parsing now"
          value={inbox.filter((i) => i.status === 'parsing').length}
          hint="running through the LLM"
        />
        <MetricTile
          label="Needs review"
          value={inbox.filter((i) => i.status === 'needs_review' || i.status === 'pending_trip').length}
          hint="ambiguous or duplicate"
        />
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
            <SourceChip source="email" count={sourceCounts.email ?? 0} />
            <SourceChip source="gmail" count={sourceCounts.gmail ?? 0} />
            <SourceChip source="extension" count={sourceCounts.extension ?? 0} />
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
          <EmptyState title="Inbox zero." body="New confirmations will show up here." />
        )}
      </div>
    </div>
  );
}
