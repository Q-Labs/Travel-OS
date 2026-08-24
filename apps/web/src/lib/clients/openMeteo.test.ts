import { describe, expect, it, vi } from 'vitest';
import { fetchForecast, geocode } from './openMeteo';

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

describe('geocode', () => {
  it('maps the first Open-Meteo match', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({
        results: [
          {
            name: 'Lisbon',
            latitude: 38.71667,
            longitude: -9.13333,
            country: 'Portugal',
            admin1: 'Lisbon',
            timezone: 'Europe/Lisbon',
          },
        ],
      }),
    );
    const result = await geocode('Lisbon', fetchFn);
    expect(result).toEqual({
      lat: 38.71667,
      lon: -9.13333,
      country: 'Portugal',
      region: 'Lisbon',
      timezone: 'Europe/Lisbon',
    });
    const url = String(fetchFn.mock.calls[0]?.[0]);
    expect(url).toContain('geocoding-api.open-meteo.com');
    expect(url).toContain('name=Lisbon');
  });

  it('url-encodes the destination', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));
    await geocode('San José', fetchFn);
    expect(String(fetchFn.mock.calls[0]?.[0])).toContain('San%20Jos%C3%A9');
  });

  it('returns null when the API reports no matches', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}));
    expect(await geocode('Atlantis', fetchFn)).toBeNull();
  });

  it('returns null on an empty results array', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));
    expect(await geocode('Atlantis', fetchFn)).toBeNull();
  });

  it('returns null on a non-ok response', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, false));
    expect(await geocode('Lisbon', fetchFn)).toBeNull();
  });

  it('returns null when the request throws', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('network down'));
    expect(await geocode('Lisbon', fetchFn)).toBeNull();
  });

  it('defaults a missing region to an empty string', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({
        results: [
          { name: 'Nowhere', latitude: 1, longitude: 2, country: 'X', timezone: 'UTC' },
        ],
      }),
    );
    expect((await geocode('Nowhere', fetchFn))?.region).toBe('');
  });
});

describe('fetchForecast', () => {
  it('unwraps the parallel daily arrays', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({
        daily: {
          time: ['2026-04-21', '2026-04-22'],
          temperature_2m_max: [18.4, 22.1],
          temperature_2m_min: [11.2, 13.9],
          precipitation_probability_max: [10, 80],
        },
      }),
    );
    expect(await fetchForecast(38.7, -9.1, 2, fetchFn)).toEqual([
      { date: '2026-04-21', tempMaxC: 18.4, tempMinC: 11.2, precipitationProbability: 10 },
      { date: '2026-04-22', tempMaxC: 22.1, tempMinC: 13.9, precipitationProbability: 80 },
    ]);
    const url = String(fetchFn.mock.calls[0]?.[0]);
    expect(url).toContain('api.open-meteo.com');
    expect(url).toContain('forecast_days=2');
  });

  it('treats null precipitation probability as zero', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse({
        daily: {
          time: ['2026-04-21'],
          temperature_2m_max: [18],
          temperature_2m_min: [11],
          precipitation_probability_max: [null],
        },
      }),
    );
    expect((await fetchForecast(1, 2, 1, fetchFn))[0]?.precipitationProbability).toBe(0);
  });

  it('returns an empty list when the payload has no daily block', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}));
    expect(await fetchForecast(1, 2, 1, fetchFn)).toEqual([]);
  });

  it('returns an empty list on a non-ok response', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, false));
    expect(await fetchForecast(1, 2, 1, fetchFn)).toEqual([]);
  });

  it('returns an empty list when the request throws', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('network down'));
    expect(await fetchForecast(1, 2, 1, fetchFn)).toEqual([]);
  });
});
