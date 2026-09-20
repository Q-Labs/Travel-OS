import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TODAY, TRIPS, TRIP_DETAILS } from '../lib/data';
import { AppProvider } from './AppContext';
import {
  AppLayout,
  ArchivePage,
  CalendarPage,
  InboxPage,
  PipelinePage,
  TripDetailPage,
  authGuardLoader,
  greeting,
  localDateLabel,
  tripsLoader
} from './routes';

// Keep these tests hermetic — the trip Overview tab renders DestinationBlurb,
// which would otherwise reach out to Wikipedia during the test run.
vi.mock('../lib/clients/wikipedia', () => ({
  fetchDestinationSummary: vi.fn().mockResolvedValue(null),
}));

vi.mock('../lib/clients/frankfurter', () => ({
  fetchRates: vi.fn().mockResolvedValue(null),
}));

vi.mock('../lib/db', () => ({
  getSession: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  subscribeAuthChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  hasSeededData: vi.fn(),
  seedFromFixtures: vi.fn(),
  fetchTrips: vi.fn(),
  fetchTripDetails: vi.fn(),
  fetchInsights: vi.fn(),
  fetchInboxItems: vi.fn(),
  upsertTrip: vi.fn(),
  upsertTripDetail: vi.fn(),
  deleteInsight: vi.fn(),
  deleteInboxItem: vi.fn(),
}));
import { getSession, signOut } from '../lib/db';

const renderAt = (path: string, tripPath = 'trip/:tripId') => {
  return render(
    <AppProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/app" element={<AppLayout />}>
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="archive" element={<ArchivePage />} />
            <Route path={tripPath} element={<TripDetailPage />} />
          </Route>
          <Route path="/login" element={<div data-testid="login-page">login</div>} />
        </Routes>
      </MemoryRouter>
    </AppProvider>
  );
};

describe('localDateLabel', () => {
  it('formats a UTC-midnight date using calendar date, not local timezone shift', () => {
    // new Date('YYYY-MM-DD') is UTC midnight — would shift back a day in negative-offset zones
    expect(localDateLabel(new Date('2026-04-20'))).toBe('April 20, 2026');
    expect(localDateLabel(new Date('2026-01-01'))).toBe('January 1, 2026');
    expect(localDateLabel(new Date('2026-12-31'))).toBe('December 31, 2026');
  });
});

describe('greeting helper', () => {
  it('returns morning, afternoon, and evening by hour', () => {
    expect(greeting(0)).toBe('Good morning');
    expect(greeting(11)).toBe('Good morning');
    expect(greeting(12)).toBe('Good afternoon');
    expect(greeting(17)).toBe('Good afternoon');
    expect(greeting(18)).toBe('Good evening');
    expect(greeting(23)).toBe('Good evening');
  });
});

describe('route components', () => {
  it('returns an empty trips loader payload', () => {
    expect(tripsLoader()).toEqual({});
  });

  it('renders pipeline with count', async () => {
    renderAt('/app/pipeline');
    expect(await screen.findByText('Travel OS')).toBeInTheDocument();
    expect(screen.getByText('Dreaming')).toBeInTheDocument();
    expect(screen.getByText('Quincy')).toBeInTheDocument();
  });

  it('renders static sections', async () => {
    renderAt('/app/inbox');
    expect(await screen.findByText('In the inbox')).toBeInTheDocument();

    renderAt('/app/calendar');
    expect(await screen.findByText('Sun')).toBeInTheDocument();

    renderAt('/app/archive');
    expect(await screen.findByText('Lifetime trips')).toBeInTheDocument();
  });

  it('sidebar and topbar interactions work', async () => {
    renderAt('/app/pipeline');
    await screen.findByText('Travel OS');

    fireEvent.click(screen.getByRole('button', { name: /Family/i }));
    fireEvent.change(screen.getByPlaceholderText('Search destinations…'), { target: { value: 'k' } });
    fireEvent.click(screen.getByRole('button', { name: /New trip/i }));
    fireEvent.click(screen.getByRole('button', { name: /Integrations/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tweaks/i }));

    expect(screen.getByText('Travel OS')).toBeInTheDocument();
  });

  it('renders trip detail and not found state', async () => {
    renderAt('/app/trip/tr-lisbon');
    expect(await screen.findByText('Lisbon')).toBeInTheDocument();
    expect(screen.getByText(/Portugal/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Bookings/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Trip notes'), {
      target: { value: 'Updated Lisbon plan for test.' }
    });
    fireEvent.blur(screen.getByLabelText('Trip notes'));

    fireEvent.click(screen.getByRole('tab', { name: /Notes/i }));
    expect(screen.getByLabelText('Full trip notes')).toHaveValue('Updated Lisbon plan for test.');

    fireEvent.click(screen.getByRole('tab', { name: /Bookings/i }));
    expect(screen.getByText('EWR → LIS')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Packing/i }));
    expect(screen.getByText(/0 of 9 items packed/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Linen shirts/i }));
    expect(screen.getByText(/1 of 9 items packed/i)).toBeInTheDocument();

    renderAt('/app/trip/nope');
    expect(await screen.findByText('Trip not found.')).toBeInTheDocument();
  });

  it('covers itinerary, budget, documents, and booking filters in trip detail', async () => {
    window.localStorage.setItem('travelos:tab:tr-lisbon', 'itinerary');
    renderAt('/app/trip/tr-lisbon');

    expect(await screen.findByRole('tab', { name: /Itinerary/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Arrive Lisbon')).toBeInTheDocument();
    expect(screen.getAllByText('No activities planned yet.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Location TBD').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$0').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('tab', { name: /Budget/i }));
    expect(screen.getByText('By category')).toBeInTheDocument();
    expect(screen.getByText(/Flights/)).toBeInTheDocument();
    expect(screen.getByText(/\$1,420 \/ \$1,420/)).toBeInTheDocument();

    const originalToday = TODAY.toISOString();
    TODAY.setTime(new Date('2027-04-01T00:00:00.000Z').getTime());
    fireEvent.click(screen.getByRole('tab', { name: /Documents/i }));
    expect(screen.getByText('Quincy passport')).toBeInTheDocument();
    expect(screen.getByText('TAP e-ticket.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Renew soon: under 6 months remaining./i)).toBeInTheDocument();
    expect(screen.getByText('No expiry date')).toBeInTheDocument();
    TODAY.setTime(new Date(originalToday).getTime());

    fireEvent.click(screen.getByRole('tab', { name: /Bookings/i }));
    expect(screen.getByText('Airport transfer')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Date TBD').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$0').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /lodging/i }));
    expect(screen.getByText('Memmo Alfama (6 nights)')).toBeInTheDocument();
    expect(screen.queryByText('EWR → LIS')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Email/i }));
    expect(screen.getByText('Memmo Alfama (6 nights)')).toBeInTheDocument();
    expect(screen.queryByText('Sintra Boutique')).not.toBeInTheDocument();
  });

  it('renders someday and completed countdown states', async () => {
    renderAt('/app/trip/tr-kyoto');
    expect(await screen.findByText('Someday')).toBeInTheDocument();
    expect(screen.getAllByText('Spring 2027').length).toBeGreaterThan(0);

    renderAt('/app/trip/tr-rome');
    expect(await screen.findByText('Completed')).toBeInTheDocument();
    expect(screen.getByText(/Oct 2025/i)).toBeInTheDocument();
  });

  it('covers quick actions, notes handlers, and booking status toggles', async () => {
    window.localStorage.removeItem('travelos:tab:tr-lisbon');
    renderAt('/app/trip/tr-lisbon');
    await screen.findByText('Lisbon');
    fireEvent.click(screen.getByRole('tab', { name: /Overview/i }));

    fireEvent.click(screen.getByRole('button', { name: /Review bookings/i }));
    expect(screen.getByRole('tab', { name: /Bookings/i })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('button', { name: /All categories/i }));
    fireEvent.click(screen.getByRole('button', { name: /All sources/i }));
    fireEvent.click(screen.getByRole('button', { name: /Set EWR → LIS to todo/i }));

    fireEvent.click(screen.getByRole('tab', { name: /Overview/i }));
    fireEvent.click(screen.getByRole('button', { name: /Update packing/i }));
    expect(screen.getByRole('tab', { name: /Packing/i })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('tab', { name: /Overview/i }));
    fireEvent.click(screen.getByRole('button', { name: /Check documents/i }));
    expect(screen.getByRole('tab', { name: /Documents/i })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('tab', { name: /Notes/i }));
    const fullNotes = screen.getByLabelText('Full trip notes');
    fireEvent.change(fullNotes, { target: { value: 'Fresh full-notes coverage text.' } });
    fireEvent.blur(fullNotes);
    expect(fullNotes).toHaveValue('Fresh full-notes coverage text.');
  });

  it('covers fallback trip-detail branches for missing params and zero budgets', async () => {
    const customTrip = {
      id: 'tr-test-fallback',
      destination: 'Testville',
      region: 'Unknown Region',
      country: 'Nowhere',
      stage: 'dreaming' as const,
      categories: ['solo' as const],
      start_date: null,
      end_date: null,
      date_approx: null,
      budget_total: 0,
      budget_spent: 0,
      budget_currency: 'USD',
      travelers: ['t1'],
      cover: { hue: 10, label: 'test' },
      notes: 'Fallback test trip',
      nights: 0,
    };

    const oneDayTrip = {
      ...customTrip,
      id: 'tr-test-one-day',
      destination: 'Tomorrowland',
      start_date: '2026-04-21',
      end_date: '2026-04-22',
      date_approx: null,
      budget_total: 100,
      nights: 1,
    };

    TRIPS.push(customTrip, oneDayTrip);
    TRIP_DETAILS[customTrip.id] = {
      itinerary: [],
      bookings: [
        {
          category: 'other',
          title: 'Mystery booking',
          status: 'todo',
          cost: undefined as never,
        },
      ],
      budget_breakdown: [{ category: 'Misc', total: 0, spent: 5 }],
      packing: [],
      documents: [],
    };
    TRIP_DETAILS[oneDayTrip.id] = {
      itinerary: [],
      bookings: [],
      budget_breakdown: [],
      packing: [],
      documents: [],
    };

    try {
      renderAt('/app/trip', 'trip');
      expect(await screen.findByText('Trip not found.')).toBeInTheDocument();

      renderAt('/app/trip/tr-test-fallback');
      expect(await screen.findByText('Dates TBD')).toBeInTheDocument();
      expect(screen.getByText('Choose dates')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('tab', { name: /Bookings/i }));
      expect(screen.getByText('Mystery booking')).toBeInTheDocument();
      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
      fireEvent.click(screen.getByRole('tab', { name: /Budget/i }));
      expect(screen.getAllByText(/\$0/).length).toBeGreaterThan(0);
      expect(screen.getByText(/\$5 \/ \$0/)).toBeInTheDocument();

      renderAt('/app/trip/tr-test-one-day');
      expect(await screen.findByText('day to go')).toBeInTheDocument();
    } finally {
      delete TRIP_DETAILS[customTrip.id];
      delete TRIP_DETAILS[oneDayTrip.id];
      TRIPS.splice(TRIPS.findIndex((trip) => trip.id === customTrip.id), 1);
      TRIPS.splice(TRIPS.findIndex((trip) => trip.id === oneDayTrip.id), 1);
    }
  });

  it('sign-out button calls signOut and navigates to /login', async () => {
    renderAt('/app/pipeline');
    await screen.findByText('Travel OS');
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    await screen.findByTestId('login-page');
    expect(vi.mocked(signOut)).toHaveBeenCalled();
  });

  it('budget tab shows split section for trips with splits data', async () => {
    renderAt('/app/trip/tr-lisbon');
    await screen.findByText('Lisbon');
    fireEvent.click(screen.getByRole('tab', { name: /Budget/i }));
    expect(screen.getByText(/who owes what/i)).toBeInTheDocument();
    expect(screen.getByText(/gets back/i)).toBeInTheDocument();
    expect(screen.getAllByText(/owes/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/settle up/i)).toBeInTheDocument();
  });

  it('budget split mark paid removes settle row', async () => {
    renderAt('/app/trip/tr-lisbon');
    await screen.findByText('Lisbon');
    fireEvent.click(screen.getByRole('tab', { name: /Budget/i }));
    const markPaidBtns = screen.getAllByRole('button', { name: /mark paid/i });
    expect(markPaidBtns.length).toBeGreaterThan(0);
    fireEvent.click(markPaidBtns[0]);
    expect(screen.queryAllByRole('button', { name: /mark paid/i }).length).toBe(markPaidBtns.length - 1);
  });

  it('budget tab shows split cards for iceland (4 travelers)', async () => {
    renderAt('/app/trip/tr-iceland');
    await screen.findByText('Reykjavík');
    fireEvent.click(screen.getByRole('tab', { name: /Budget/i }));
    expect(screen.getByText(/who owes what/i)).toBeInTheDocument();
    expect(screen.getAllByText(/gets back|owes/i).length).toBeGreaterThan(0);
  });

  it('budget tab shows empty split state when no splits configured', async () => {
    // tr-catskills has 4 travelers but no splits
    renderAt('/app/trip/tr-catskills');
    await screen.findByText('Catskills');
    fireEvent.click(screen.getByRole('tab', { name: /Budget/i }));
    expect(screen.getByText(/no split set up yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set up split/i })).toBeInTheDocument();
  });

  it('budget split shows even balance and hides settle-up when all square', async () => {
    const evenTrip = {
      id: 'tr-test-even',
      destination: 'EvenVille',
      region: 'Test',
      country: 'Test',
      stage: 'booked' as const,
      categories: ['couple' as const],
      start_date: null,
      end_date: null,
      date_approx: null,
      budget_total: 2000,
      budget_spent: 2000,
      budget_currency: 'USD',
      travelers: ['t1', 't2'],
      cover: { hue: 100, label: 'test' },
      notes: '',
      nights: 5,
    };
    TRIPS.push(evenTrip);
    TRIP_DETAILS[evenTrip.id] = {
      itinerary: [],
      bookings: [],
      budget_breakdown: [],
      packing: [],
      documents: [],
      splits: [
        { travelerId: 't1', paid: 1000, share: 1000 },
        { travelerId: 't2', paid: 1000, share: 1000 },
      ],
    };
    try {
      renderAt(`/app/trip/${evenTrip.id}`);
      await screen.findByText('EvenVille');
      fireEvent.click(screen.getByRole('tab', { name: /Budget/i }));
      expect(screen.getAllByText(/±/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/^even$/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/settle up/i)).not.toBeInTheDocument();
    } finally {
      delete TRIP_DETAILS[evenTrip.id];
      TRIPS.splice(TRIPS.findIndex((t) => t.id === evenTrip.id), 1);
    }
  });
});

describe('authGuardLoader', () => {
  it('returns {} when a session exists', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'u1' } } as Awaited<ReturnType<typeof getSession>>);
    expect(await authGuardLoader()).toEqual({});
  });

  it('returns a redirect Response when no session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const result = await authGuardLoader();
    expect(result).toBeInstanceOf(Response);
  });
});
