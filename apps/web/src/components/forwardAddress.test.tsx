import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const state: Record<string, unknown> = {
  trips: [],
  inbox: [],
  inboxToken: null,
  assignInboxItem: vi.fn(),
  dismissInboxItem: vi.fn(),
  setShowIntegrations: vi.fn(),
};

vi.mock('../app/AppContext', () => ({ useApp: () => state }));
vi.mock('../../app/AppContext', () => ({ useApp: () => state }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

import { ArchiveDashboard } from './ArchiveDashboard';
import { InboxDashboard } from './InboxDashboard';
import { IntegrationsModal } from './modals/IntegrationsModal';

const writeText = vi.fn();

beforeEach(() => {
  state['inboxToken'] = null;
  state['inbox'] = [];
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});
afterEach(() => vi.clearAllMocks());

describe('forwarding address', () => {
  it('advertises nothing to forward to before a token exists', () => {
    render(<InboxDashboard />);
    expect(screen.getByText(/your forwarding address/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy address/ })).toBeDisabled();
  });

  it('shows the real plus-tagged address once a token exists', () => {
    state['inboxToken'] = 'a1b2c3';
    render(<InboxDashboard />);
    expect(screen.getByText(/trips\+a1b2c3@/)).toBeInTheDocument();
  });

  it('copies the address and reports it', async () => {
    state['inboxToken'] = 'a1b2c3';
    render(<InboxDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Copy address/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('trips+a1b2c3@')));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('does not claim success when the clipboard refuses', async () => {
    state['inboxToken'] = 'a1b2c3';
    writeText.mockRejectedValue(new Error('denied'));
    render(<InboxDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /Copy address/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Copied' })).toBeNull();
  });

  it('the integrations panel shows the address instead of the endpoint', () => {
    state['inboxToken'] = 'a1b2c3';
    render(<IntegrationsModal />);
    expect(screen.getByText(/trips\+a1b2c3@/)).toBeInTheDocument();
    expect(screen.queryByText('POST /api/inbox/ingest')).toBeNull();
  });

  it('falls back to the endpoint when there is no address yet', () => {
    render(<IntegrationsModal />);
    expect(screen.getByText('POST /api/inbox/ingest')).toBeInTheDocument();
  });

  it('reports a failed feed copy rather than a false success', async () => {
    state['inboxToken'] = 'a1b2c3';
    writeText.mockRejectedValue(new Error('insecure origin'));
    render(<IntegrationsModal />);
    const row = screen.getByText('Calendar export').closest('.integ-row') as HTMLElement;
    fireEvent.click(row.querySelector('button') as HTMLButtonElement);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(await screen.findByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
  });

  it('archive totals disclose the trips they could not include', () => {
    const usd = {
      id: 'a', destination: 'Lisbon', region: '', country: 'PT', stage: 'archived',
      categories: [], start_date: '2025-02-01', end_date: '2025-02-08', date_approx: null,
      budget_total: 3000, budget_spent: 2000, budget_currency: 'USD', travelers: [],
      cover: { hue: 30, label: '' }, notes: '', nights: 7,
    };
    const jpy = { ...usd, id: 'b', destination: 'Sapporo', budget_currency: 'JPY', budget_spent: 900000 };
    state['trips'] = [usd, jpy];
    render(<ArchiveDashboard />);
    // The yen trip is excluded from the dollar total rather than folded in.
    expect(screen.getByText(/1 in other currencies not counted/)).toBeInTheDocument();
    expect(screen.getByText('$2,000')).toBeInTheDocument();
  });
});
