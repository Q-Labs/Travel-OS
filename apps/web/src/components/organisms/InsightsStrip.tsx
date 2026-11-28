import type { Insight } from '../../lib/types';
import { Icon } from '../atoms/Icon';

/**
 * The scrolling strip of insights above the pipeline. Clicking one opens its
 * trip, when it has one, and its cross dismisses it. Nothing is drawn when there
 * are no insights.
 */
export function InsightsStrip({
  insights,
  onOpen,
  onDismiss,
}: {
  insights: Insight[];
  onOpen: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (!insights.length) return null;
  return (
    <div className="insights">
      <h3>Nudges <em>· gentle, dismissible</em></h3>
      <div className="insights-scroller">
        {insights.map((i) => (
          <div key={i.id} className={`insight ${i.severity}`}>
            <div className="sev" />
            <div
              className="body"
              onClick={() => i.trip_id && onOpen(i.trip_id)}
              style={{ cursor: i.trip_id ? 'pointer' : 'default' }}
            >
              <div className="t">{i.title}</div>
              <div className="b">{i.body}</div>
            </div>
            <button className="x" onClick={() => onDismiss(i.id)}><Icon.Close /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
