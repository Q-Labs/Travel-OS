import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const fetchRates = vi.fn();
const fetchDestinationSummary = vi.fn();

vi.mock('../lib/clients/frankfurter', () => ({ fetchRates: (...a: unknown[]) => fetchRates(...a) }));
vi.mock('../lib/clients/wikipedia', () => ({
  fetchDestinationSummary: (...a: unknown[]) => fetchDestinationSummary(...a),
}));

import { BudgetConversion } from './BudgetConversion';
import { DestinationBlurb } from './DestinationBlurb';
import type { Trip } from '../lib/types';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'tr-lisbon', destination: 'Lisbon', region: 'Estremadura', country: 'Portugal',
    stage: 'planning', categories: ['couple'],
    start_date: null, end_date: null, date_approx: null,
    budget_total: 1000, budget_spent: 0, budget_currency: 'EUR',
    travelers: ['t1'], cover: { hue: 30, label: 'x' }, notes: '', nights: 5,
    ...overrides,
  };
}

beforeEach(() => {
  fetchRates.mockReset();
  fetchDestinationSummary.mockReset();
  vi.stubGlobal('fetch', vi.fn());
});

describe('BudgetConversion', () => {
  it('shows a home-currency equivalent for a foreign-currency budget', async () => {
    fetchRates.mockResolvedValue({ base: 'USD', rates: { EUR: 0.5 } });
    render(<BudgetConversion trip={makeTrip()} />);
    // 1000 EUR at 0.5 EUR per USD is 2000 USD.
    expect(await screen.findByText(/\$2,000/)).toBeInTheDocument();
    expect(screen.getByText(/ECB reference rate/)).toBeInTheDocument();
  });

  it('renders nothing, and asks for no rates, when already in the home currency', () => {
    const { container } = render(<BudgetConversion trip={makeTrip({ budget_currency: 'USD' })} />);
    expect(container).toBeEmptyDOMElement();
    expect(fetchRates).not.toHaveBeenCalled();
  });

  it('renders nothing when rates are unavailable', async () => {
    fetchRates.mockResolvedValue(null);
    const { container } = render(<BudgetConversion trip={makeTrip()} />);
    await waitFor(() => expect(fetchRates).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the currency pair cannot be converted', async () => {
    fetchRates.mockResolvedValue({ base: 'USD', rates: {} });
    const { container } = render(<BudgetConversion trip={makeTrip()} />);
    await waitFor(() => expect(fetchRates).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('ignores a response that arrives after unmount', async () => {
    let resolve!: (v: unknown) => void;
    fetchRates.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { unmount } = render(<BudgetConversion trip={makeTrip()} />);
    unmount();
    resolve({ base: 'USD', rates: { EUR: 0.5 } });
    await waitFor(() => expect(fetchRates).toHaveBeenCalled());
    expect(screen.queryByText(/\$2,000/)).not.toBeInTheDocument();
  });
});

describe('DestinationBlurb', () => {
  const SUMMARY = {
    title: 'Lisbon',
    extract: 'Lisbon is the capital of Portugal.',
    thumbnail: 'https://upload.wikimedia.org/lisbon.jpg',
    url: 'https://en.wikipedia.org/wiki/Lisbon',
  };

  it('renders the extract with a CC BY-SA attribution link', async () => {
    fetchDestinationSummary.mockResolvedValue(SUMMARY);
    render(<DestinationBlurb destination="Lisbon" />);
    expect(await screen.findByText('Lisbon is the capital of Portugal.')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /CC BY-SA/ });
    expect(link).toHaveAttribute('href', SUMMARY.url);
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('renders the lead image when there is one', async () => {
    fetchDestinationSummary.mockResolvedValue(SUMMARY);
    render(<DestinationBlurb destination="Lisbon" />);
    expect(await screen.findByRole('img', { name: 'Lisbon' })).toHaveAttribute('src', SUMMARY.thumbnail);
  });

  it('renders text alone when the page has no image', async () => {
    fetchDestinationSummary.mockResolvedValue({ ...SUMMARY, thumbnail: null });
    render(<DestinationBlurb destination="Lisbon" />);
    await screen.findByText(SUMMARY.extract);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders nothing when there is no summary', async () => {
    fetchDestinationSummary.mockResolvedValue(null);
    const { container } = render(<DestinationBlurb destination="Atlantis" />);
    await waitFor(() => expect(fetchDestinationSummary).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('hides a stale blurb while a new destination loads', async () => {
    fetchDestinationSummary.mockResolvedValue(SUMMARY);
    const { rerender } = render(<DestinationBlurb destination="Lisbon" />);
    await screen.findByText(SUMMARY.extract);

    fetchDestinationSummary.mockReturnValue(new Promise(() => {}));
    rerender(<DestinationBlurb destination="Porto" />);
    expect(screen.queryByText(SUMMARY.extract)).not.toBeInTheDocument();
  });

  it('ignores a response that arrives after unmount', async () => {
    let resolve!: (v: unknown) => void;
    fetchDestinationSummary.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { unmount } = render(<DestinationBlurb destination="Lisbon" />);
    unmount();
    resolve(SUMMARY);
    await waitFor(() => expect(fetchDestinationSummary).toHaveBeenCalled());
    expect(screen.queryByText(SUMMARY.extract)).not.toBeInTheDocument();
  });
});
