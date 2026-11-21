import { TODAY } from '../../lib/data';
import { daysBetween, fmtDate } from '../../lib/utils';
import type { TripDocument } from '../../lib/types';

export function DocumentCard({ document }: { document: TripDocument }) {
  const expiryDays = document.expiry ? daysBetween(TODAY, document.expiry) : null;
  const warn = expiryDays !== null && expiryDays < 183;

  return (
    <article className={`document-card${warn ? ' warning' : ''}`}>
      <span className="document-type">{document.type}</span>
      <strong>{document.title}</strong>
      <span>{document.expiry ? `Expires ${fmtDate(document.expiry, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No expiry date'}</span>
      {warn && <em>Renew soon: under 6 months remaining.</em>}
    </article>
  );
}
