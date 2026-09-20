import { describe, expect, it, vi } from 'vitest';
import { fetchDestinationSummary } from './wikipedia';

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

const PAGE = {
  type: 'standard',
  title: 'Lisbon',
  extract: 'Lisbon is the capital of Portugal.',
  thumbnail: { source: 'https://upload.wikimedia.org/lisbon.jpg' },
  content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Lisbon' } },
};

describe('fetchDestinationSummary', () => {
  it('maps a standard page summary', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(PAGE));
    expect(await fetchDestinationSummary('Lisbon', fetchFn)).toEqual({
      title: 'Lisbon',
      extract: 'Lisbon is the capital of Portugal.',
      thumbnail: 'https://upload.wikimedia.org/lisbon.jpg',
      url: 'https://en.wikipedia.org/wiki/Lisbon',
    });
  });

  it('url-encodes the destination', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(PAGE));
    await fetchDestinationSummary('San José', fetchFn);
    expect(String(fetchFn.mock.calls[0]?.[0])).toContain('San%20Jos%C3%A9');
  });

  it('identifies itself to Wikimedia as their policy asks', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(PAGE));
    await fetchDestinationSummary('Lisbon', fetchFn);
    const init = fetchFn.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string>;
    expect(headers['Api-User-Agent']).toContain('Travel OS');
  });

  it('copes with a page that has no image', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({ type: PAGE.type, title: PAGE.title, extract: PAGE.extract, content_urls: PAGE.content_urls }),
    );
    expect((await fetchDestinationSummary('Lisbon', fetchFn))?.thumbnail).toBeNull();
  });

  it('falls back to a canonical URL when content_urls is absent', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({ type: PAGE.type, title: PAGE.title, extract: PAGE.extract, thumbnail: PAGE.thumbnail }),
    );
    expect((await fetchDestinationSummary('Lisbon', fetchFn))?.url)
      .toBe('https://en.wikipedia.org/wiki/Lisbon');
  });

  it('rejects a disambiguation page as not being a destination', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({ ...PAGE, type: 'disambiguation' }),
    );
    expect(await fetchDestinationSummary('Springfield', fetchFn)).toBeNull();
  });

  it('returns null when the page has no extract', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ type: 'standard', title: 'X' }));
    expect(await fetchDestinationSummary('X', fetchFn)).toBeNull();
  });

  it('returns null for an unknown page', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, false));
    expect(await fetchDestinationSummary('Atlantis', fetchFn)).toBeNull();
  });

  it('returns null when the request throws', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await fetchDestinationSummary('Lisbon', fetchFn)).toBeNull();
  });
});
