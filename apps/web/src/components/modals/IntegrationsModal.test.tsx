import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const state: { inboxToken: string | null; setShowIntegrations: ReturnType<typeof vi.fn> } = {
  inboxToken: null,
  setShowIntegrations: vi.fn(),
};

vi.mock('../../app/AppContext', () => ({
  useApp: () => state,
}));

import { IntegrationsModal } from './IntegrationsModal';

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  state.inboxToken = null;
  state.setShowIntegrations = vi.fn();
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

function calendarButton() {
  // The calendar row's action button sits next to its name.
  const row = screen.getByText('Calendar export').closest('.integ-row') as HTMLElement;
  return row.querySelector('button') as HTMLButtonElement;
}

describe('IntegrationsModal calendar feed', () => {
  it('marks calendar export connected once the user has a token', () => {
    state.inboxToken = 'a1b2c3';
    render(<IntegrationsModal />);
    expect(calendarButton()).toHaveTextContent('Manage');
  });

  it('reveals the feed URL and copies it', async () => {
    state.inboxToken = 'a1b2c3';
    render(<IntegrationsModal />);
    fireEvent.click(calendarButton());

    const url = `${window.location.origin}/api/calendar/a1b2c3`;
    expect(screen.getByText(url)).toBeInTheDocument();

    const copy = screen.getByRole('button', { name: 'Copy' });
    fireEvent.click(copy);
    expect(writeText).toHaveBeenCalledWith(url);
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('hides the feed again when toggled off', () => {
    state.inboxToken = 'a1b2c3';
    render(<IntegrationsModal />);
    const url = `${window.location.origin}/api/calendar/a1b2c3`;
    fireEvent.click(calendarButton());
    expect(screen.getByText(url)).toBeInTheDocument();
    fireEvent.click(calendarButton());
    expect(screen.queryByText(url)).not.toBeInTheDocument();
  });

  it('offers nothing to copy when the user has no token yet', () => {
    render(<IntegrationsModal />);
    expect(calendarButton()).toHaveTextContent('Manage');
    fireEvent.click(calendarButton());
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
  });

  it('closes from the Done button', () => {
    render(<IntegrationsModal />);
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(state.setShowIntegrations).toHaveBeenCalledWith(false);
  });
});
