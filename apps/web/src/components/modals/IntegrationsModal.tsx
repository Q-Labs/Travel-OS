import { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { INTEGRATIONS } from '../../lib/data';
import { INBOX_DOMAIN, INBOX_MAILBOX } from '../../lib/inboxAddress';
import { Icon } from '../Icon';

export function IntegrationsModal() {
  const { setShowIntegrations, inboxToken } = useApp();
  const [showFeed, setShowFeed] = useState(false);
  const [copied, setCopied] = useState(false);

  const close = () => setShowIntegrations(false);

  // The token addresses the read-only feed, so the URL itself is the credential.
  const feedUrl = inboxToken
    ? `${window.location.origin}/api/calendar/${inboxToken}`
    : null;
  // Show the actual address rather than the endpoint that receives it.
  const forwardAddress = inboxToken
    ? `${INBOX_MAILBOX}+${inboxToken}@${INBOX_DOMAIN}`
    : null;

  const [copyFailed, setCopyFailed] = useState(false);

  const copyFeed = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyFailed(false);
      // Reset so a second copy still gives feedback.
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Denied permission or an insecure origin: say so rather than
      // reporting a success that never happened.
      setCopied(false);
      setCopyFailed(true);
    }
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2>Integrations <em>· how bookings get here</em></h2>
            <button className="icon-btn" aria-label="Close" onClick={close}><Icon.Close /></button>
          </div>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {INTEGRATIONS.map((it) => {
            const isCalendar = it.key === 'calendar';
            // Both the feed and the forwarding address are derived from the
            // user's token, so neither is connected until that token exists.
            const tokenGated = isCalendar || it.key === 'forward';
            const status = tokenGated && inboxToken ? 'active' : it.status;
            // The calendar feed is the only implemented action, and only once a
            // token exists. Every other row's button would be inert, so it is
            // disabled rather than left looking clickable.
            const canAct = isCalendar && Boolean(feedUrl);
            return (
              <div key={it.key}>
                <div className="integ-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 14 }}>{it.name}</strong>
                      <span className={`integ-status ${status}`}>
                        {status === 'active' && '● Connected'}
                        {status === 'email-only' && '◐ Via forwarding'}
                        {status === 'available' && '○ Available'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.5 }}>{it.desc}</div>
                    {it.key === 'forward' && forwardAddress && (
                      <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                        {forwardAddress}
                      </div>
                    )}
                    {it.meta && !(it.key === 'forward' && forwardAddress) && (
                      <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                        {it.meta}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn"
                    style={{ padding: '6px 12px' }}
                    disabled={!canAct}
                    onClick={canAct ? () => setShowFeed((v) => !v) : undefined}
                  >
                    {status === 'active' ? 'Manage' : 'Connect'}
                  </button>
                </div>
                {isCalendar && showFeed && feedUrl && (
                  <div className="integ-feed">
                    <div className="integ-feed-label">
                      Subscribe in Google or Apple Calendar. Anyone with this link can read your trips.
                    </div>
                    <div className="integ-feed-row">
                      <code>{feedUrl}</code>
                      <button className="btn" onClick={() => void copyFeed(feedUrl)}>
                        {copied ? 'Copied' : copyFailed ? 'Copy failed' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="modal-foot">
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Everything here is read-only or email-based. Your inbox stays yours.</span>
          <button className="btn primary" onClick={close}>Done</button>
        </div>
      </div>
    </div>
  );
}
