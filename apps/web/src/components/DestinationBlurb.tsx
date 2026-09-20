import { useEffect, useState } from 'react';
import { fetchDestinationSummary, type DestinationSummary } from '../lib/clients/wikipedia';

type Loaded = { for: string; summary: DestinationSummary | null };

/**
 * A short description of the destination, pulled from Wikipedia.
 *
 * Wikipedia text is CC BY-SA, so the attribution link below is a licence
 * condition — it must stay visible wherever the extract is shown.
 */
export function DestinationBlurb({ destination }: { destination: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ for: '', summary: null });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchDestinationSummary(destination, (url, init) => fetch(url, init));
      if (cancelled) return;
      setLoaded({ for: destination, summary: result });
    })();
    return () => {
      cancelled = true;
    };
  }, [destination]);

  // Tracking which destination the summary belongs to hides a stale blurb while
  // a new one loads, without clearing state synchronously inside the effect.
  const summary = loaded.for === destination ? loaded.summary : null;
  if (!summary) return null;

  return (
    <div className="destination-blurb">
      {summary.thumbnail && (
        <img className="destination-blurb-img" src={summary.thumbnail} alt={summary.title} />
      )}
      <p>{summary.extract}</p>
      <a href={summary.url} target="_blank" rel="noreferrer noopener">
        Wikipedia · CC BY-SA
      </a>
    </div>
  );
}
