import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRIPS } from '../../lib/data';

const state = {
  trips: TRIPS,
  inbox: [{ id: 'i1' }, { id: 'i2' }],
  categoryFilter: [] as string[],
  toggleCategoryFilter: vi.fn(),
  tweaksOpen: false,
  setShowIntegrations: vi.fn(),
  setTweaksOpen: vi.fn(),
};
vi.mock('../../app/AppContext', () => ({ useApp: () => state }));
vi.mock('../../lib/db', () => ({ signOut: vi.fn().mockResolvedValue(undefined) }));

import { signOut } from '../../lib/db';
import { Sidebar } from './Sidebar';

function renderSidebar(path = '/app/pipeline') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/*" element={<Sidebar />} />
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  state.categoryFilter = [];
  state.tweaksOpen = false;
});

describe('Sidebar (built from Cobalt)', () => {
  it('links the four views with their counts', () => {
    renderSidebar();
    for (const name of ['Pipeline', 'Inbox', 'Calendar', 'Archive']) {
      expect(screen.getByRole('link', { name: new RegExp(name) })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /Inbox/ })).toHaveTextContent('2');
  });

  it('shows the signed-in user and the Travel OS mark', () => {
    renderSidebar();
    expect(screen.getByText('Travel OS')).toBeInTheDocument();
    expect(screen.getByText('Quincy')).toBeInTheDocument();
    expect(screen.getByText('Cherry Hill, NJ')).toBeInTheDocument();
  });

  it('toggles a category filter by click and by keyboard, and reports its pressed state', () => {
    state.categoryFilter = ['family'];
    renderSidebar();
    const family = screen.getByRole('button', { name: /Family/ });
    expect(family).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(family);
    fireEvent.keyDown(family, { key: 'Enter' });
    fireEvent.keyDown(family, { key: ' ' });
    fireEvent.keyDown(family, { key: 'a' });
    expect(state.toggleCategoryFilter).toHaveBeenCalledTimes(3);
    expect(state.toggleCategoryFilter).toHaveBeenCalledWith('family');
  });

  it('opens integrations and toggles the tweaks panel', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Integrations' }));
    expect(state.setShowIntegrations).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: 'Tweaks' }));
    expect(state.setTweaksOpen).toHaveBeenCalledWith(true);
  });

  it('settings is reachable but has nothing to open yet', () => {
    renderSidebar();
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Settings' }))).not.toThrow();
  });

  it('signs out and returns to the login page', async () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(signOut).toHaveBeenCalled();
  });
});
