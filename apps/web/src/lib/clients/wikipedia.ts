import type { FetchFn } from './openMeteo';

/**
 * Destination context from the Wikipedia REST API — no key, no account.
 *
 * Wikipedia text is licensed CC BY-SA, so anything rendered from this must
 * carry a visible attribution link back to `url`. That is a licence condition,
 * not a nicety.
 */
const SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';

/**
 * Wikimedia's API etiquette asks callers to identify themselves. Browsers
 * refuse to set `User-Agent`, so Wikimedia accepts `Api-User-Agent` instead.
 */
const USER_AGENT = 'Travel OS (https://github.com/Q-Labs/Travel-OS)';

export type DestinationSummary = {
  title: string;
  extract: string;
  thumbnail: string | null;
  url: string;
};

type SummaryPayload = {
  type?: string;
  title?: string;
  extract?: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page: string } };
};

export async function fetchDestinationSummary(
  name: string,
  fetchFn: FetchFn,
): Promise<DestinationSummary | null> {
  const encoded = encodeURIComponent(name);
  try {
    const res = await fetchFn(`${SUMMARY_URL}/${encoded}`, {
      headers: { 'Api-User-Agent': USER_AGENT },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as SummaryPayload;
    // A disambiguation page is a list of options, not a description of a place.
    if (body.type === 'disambiguation') return null;
    if (!body.extract || !body.title) return null;
    return {
      title: body.title,
      extract: body.extract,
      thumbnail: body.thumbnail?.source ?? null,
      url: body.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encoded}`,
    };
  } catch {
    // Trip overviews render fine without a blurb.
    return null;
  }
}
