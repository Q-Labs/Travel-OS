import type { DailyForecast } from '../insights';

/**
 * Open-Meteo needs no API key, account, or billing — the only constraint is a
 * fair-use limit on the free non-commercial tier, which the daily insights cron
 * stays far below.
 */
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * `fetch` is injected rather than defaulted so tests can stub it without a
 * network call and without an untestable default-parameter branch.
 */
export type FetchFn = (input: string) => Promise<Response>;

export type GeocodeResult = {
  lat: number;
  lon: number;
  country: string;
  region: string;
  timezone: string;
};

type GeocodeRow = {
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  timezone: string;
};

type DailyBlock = {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: (number | null)[];
};

export async function geocode(name: string, fetchFn: FetchFn): Promise<GeocodeResult | null> {
  try {
    const res = await fetchFn(`${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=1`);
    if (!res.ok) return null;
    const body = (await res.json()) as { results?: GeocodeRow[] };
    const row = body.results?.[0];
    if (!row) return null;
    return {
      lat: row.latitude,
      lon: row.longitude,
      country: row.country,
      region: row.admin1 ?? '',
      timezone: row.timezone,
    };
  } catch {
    // A geocoding outage should degrade insights, not fail the whole refresh.
    return null;
  }
}

export async function fetchForecast(
  lat: number,
  lon: number,
  days: number,
  fetchFn: FetchFn,
): Promise<DailyForecast[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: String(days),
    timezone: 'auto',
  });
  try {
    const res = await fetchFn(`${FORECAST_URL}?${params}`);
    if (!res.ok) return [];
    const body = (await res.json()) as { daily?: DailyBlock };
    const daily = body.daily;
    if (!daily) return [];
    return daily.time.map((date, i) => ({
      date,
      tempMaxC: daily.temperature_2m_max[i] as number,
      tempMinC: daily.temperature_2m_min[i] as number,
      precipitationProbability: daily.precipitation_probability_max[i] ?? 0,
    }));
  } catch {
    return [];
  }
}
