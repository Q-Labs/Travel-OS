import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/db', () => ({
  getSession: vi.fn(),
  signInWithMagicLink: vi.fn(),
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

import { AppProvider, useApp } from '../app/AppContext';
import { INBOX, INSIGHTS, INTEGRATIONS, TODAY, TRIPS } from '../lib/data';
import type { Trip } from '../lib/types';
import { ArchiveDashboard } from './ArchiveDashboard';
import { Avatars } from './Avatars';
import { CalendarDashboard } from './CalendarDashboard';
import { CategoryPips } from './CategoryPips';
import { InboxDashboard } from './InboxDashboard';
import { BOOKING_ICONS, Icon } from './Icon';
import { AddTripModal } from './modals/AddTripModal';
import { IntegrationsModal } from './modals/IntegrationsModal';
import { PipelineDashboard } from './PipelineDashboard';
import { StageDot } from './StageDot';
import { TripCard } from './TripCard';
import { TweaksPanel } from './TweaksPanel';

// AddTripModal geocodes on destination blur; keep these tests off the network.
vi.mock('../lib/clients/openMeteo', () => ({
  geocode: vi.fn().mockResolvedValue(null),
}));

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const originalTrips = structuredClone(TRIPS);
const originalInbox = structuredClone(INBOX);
const originalInsights = structuredClone(INSIGHTS);
const originalIntegrations = structuredClone(INTEGRATIONS);
const originalToday = TODAY.toISOString();

function resetFixtures() {
  TRIPS.splice(0, TRIPS.length, ...structuredClone(originalTrips));
  INBOX.splice(0, INBOX.length, ...structuredClone(originalInbox));
  INSIGHTS.splice(0, INSIGHTS.length, ...structuredClone(originalInsights));
  INTEGRATIONS.splice(0, INTEGRATIONS.length, ...structuredClone(originalIntegrations));
  TODAY.setTime(new Date(originalToday).getTime());
  navigateMock.mockReset();
  window.localStorage.clear();
}

function renderWithApp(ui: React.ReactNode) {
  return render(
    <AppProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AppProvider>,
  );
}

function familyFilteredPipeline() {
  function Filtered() {
    const { toggleCategoryFilter } = useApp();
    return (
      <>
        <button onClick={() => toggleCategoryFilter('family')}>Seed family filter</button>
        <PipelineDashboard />
      </>
    );
  }

  return renderWithApp(<Filtered />);
}

beforeEach(() => {
  resetFixtures();
});

afterEach(() => {
  resetFixtures();
});

describe('small components', () => {
  it('renders avatars, hidden counts, category pips, stage dot, and every icon', () => {
    render(
      <>
        <Avatars ids={['t1', 't2', 't3', 't4', 't5']} />
        <CategoryPips cats={['family', 'solo']} />
        <StageDot stage="booked" />
        {Object.entries(Icon).map(([name, Comp]) => (
          <Comp key={name} data-testid={`icon-${name}`} />
        ))}
        {Object.entries(BOOKING_ICONS).map(([name, Comp]) => (
          <Comp key={name} data-testid={`booking-icon-${name}`} />
        ))}
      </>,
    );

    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Solo')).toBeInTheDocument();
    expect(document.querySelector('.stage-dot')).toHaveStyle({ background: 'var(--stage-booked)' });
    expect(screen.getByTestId('icon-Plus')).toBeInTheDocument();
    expect(screen.getByTestId('icon-Inbox')).toBeInTheDocument();
    expect(screen.getByTestId('booking-icon-flight')).toBeInTheDocument();
    expect(screen.getByTestId('booking-icon-other')).toBeInTheDocument();
  });

  it('renders trip cards across countdown and progress states', () => {
    const dragStart = vi.fn();
    const dragEnd = vi.fn();
    const onClick = vi.fn();
    const activeTrip: Trip = {
      ...TRIPS.find((trip) => trip.id === 'tr-catskills')!,
      start_date: '2026-04-19',
      end_date: '2026-04-22',
    };
    const todayTrip: Trip = {
      ...TRIPS.find((trip) => trip.id === 'tr-catskills')!,
      id: 'tr-today',
      start_date: '2026-04-20',
      end_date: '2026-04-22',
    };
    const approxTrip: Trip = {
      ...TRIPS.find((trip) => trip.id === 'tr-kyoto')!,
      id: 'tr-approx',
      date_approx: 'Soon-ish',
    };
    const bareTrip: Trip = {
      ...TRIPS.find((trip) => trip.id === 'tr-kyoto')!,
      id: 'tr-bare',
      date_approx: null,
      budget_total: 0,
      budget_spent: 10,
    };

    const { rerender } = render(<TripCard trip={TRIPS.find((trip) => trip.id === 'tr-catskills')!} onClick={onClick} onDragStart={dragStart} onDragEnd={dragEnd} isDragging />);
    expect(screen.getByText(/in 4d/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Catskills'));
    const card = document.querySelector('.tcard') as HTMLElement;
    fireEvent.dragStart(card, { dataTransfer: { effectAllowed: '', setData: vi.fn() } });
    fireEvent.dragEnd(card);
    expect(onClick).toHaveBeenCalled();
    expect(dragStart).toHaveBeenCalled();
    expect(dragEnd).toHaveBeenCalled();

    rerender(<TripCard trip={TRIPS.find((trip) => trip.id === 'tr-lisbon')!} />);
    expect(screen.getByText(/in 20w/i)).toBeInTheDocument();

    rerender(<TripCard trip={todayTrip} />);
    expect(screen.getByText('today')).toBeInTheDocument();

    rerender(<TripCard trip={activeTrip} />);
    expect(screen.getByText('active')).toBeInTheDocument();

    rerender(<TripCard trip={approxTrip} />);
    expect(screen.getByText('Soon-ish')).toBeInTheDocument();

    rerender(<TripCard trip={bareTrip} />);
    expect(screen.queryByText('Soon-ish')).not.toBeInTheDocument();
    expect(document.querySelector('.tcard-progress')).not.toBeInTheDocument();
  });
});

describe('dashboard components', () => {
  it('renders archive dashboard and empty archive state', () => {
    const { unmount } = renderWithApp(<ArchiveDashboard />);
    fireEvent.click(screen.getByText('Rome'));
    expect(navigateMock).toHaveBeenCalledWith('/app/trip/tr-rome');

    TRIPS.forEach((trip) => {
      if (trip.stage === 'archived') trip.stage = 'planning';
    });

    unmount();
    renderWithApp(<ArchiveDashboard />);
    expect(screen.getByText('Nothing archived yet.')).toBeInTheDocument();
  });

  it('renders archive summary edge cases for derived metrics', () => {
    TRIPS.forEach((trip) => {
      trip.stage = 'planning';
    });

    Object.assign(TRIPS.find((trip) => trip.id === 'tr-rome')!, {
      stage: 'archived',
      country: 'Italy',
      start_date: '2026-01-01',
      end_date: '2026-01-05',
      nights: undefined,
      budget_spent: 0,
    });
    Object.assign(TRIPS.find((trip) => trip.id === 'tr-catskills')!, {
      stage: 'archived',
      country: 'United States',
      start_date: '2025-04-24',
      end_date: '2025-04-27',
      nights: 3,
      budget_spent: 900,
    });
    Object.assign(TRIPS.find((trip) => trip.id === 'tr-hyrox')!, {
      stage: 'archived',
      country: 'Germany',
      start_date: '2025-06-06',
      end_date: '2025-06-10',
      nights: 4,
      budget_spent: 1200,
    });
    Object.assign(TRIPS.find((trip) => trip.id === 'tr-mexico')!, {
      stage: 'archived',
      country: 'Mexico',
      start_date: '2025-05-02',
      end_date: '2025-05-09',
      nights: 7,
      budget_spent: 1800,
    });
    Object.assign(TRIPS.find((trip) => trip.id === 'tr-banff')!, {
      stage: 'archived',
      country: 'Canada',
      start_date: null,
      end_date: null,
      nights: undefined,
      budget_spent: 50,
    });
    Object.assign(TRIPS.find((trip) => trip.id === 'tr-patagonia')!, {
      stage: 'archived',
      country: 'Chile',
      start_date: null,
      end_date: null,
      nights: undefined,
      budget_spent: 75,
    });

    renderWithApp(<ArchiveDashboard />);
    expect(screen.getByText('Italy, Germany, Mexico…')).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === '1 trip0 days$0')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === '3 trips14 days$3,900')).toBeInTheDocument();
  });

  it('renders calendar dashboard controls and overflow chips', () => {
    TRIPS.push(
      {
        ...TRIPS[0],
        id: 'tr-overflow-1',
        destination: 'Overflow One',
        start_date: '2026-04-20',
        end_date: '2026-04-20',
        date_approx: null,
        stage: 'planning',
      },
      {
        ...TRIPS[1],
        id: 'tr-overflow-2',
        destination: 'Overflow Two',
        start_date: '2026-04-20',
        end_date: '2026-04-20',
        date_approx: null,
        stage: 'planning',
      },
      {
        ...TRIPS[2],
        id: 'tr-overflow-3',
        destination: 'Overflow Three',
        start_date: '2026-04-20',
        end_date: '2026-04-20',
        date_approx: null,
        stage: 'planning',
      },
    );

    renderWithApp(<CalendarDashboard />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getAllByRole('button')[1]);
    fireEvent.click(screen.getByRole('button', { name: /Today/i }));
    fireEvent.click(screen.getByText('Overflow One'));
    expect(navigateMock).toHaveBeenCalledWith('/app/trip/tr-overflow-1');
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('uses the fallback calendar color when a trip has no cover', () => {
    TRIPS.push({
      ...TRIPS[0],
      id: 'tr-no-cover',
      destination: 'No Cover',
      cover: undefined as unknown as Trip['cover'],
      start_date: '2026-04-20',
      end_date: '2026-04-20',
      date_approx: null,
      stage: 'planning',
    });

    renderWithApp(<CalendarDashboard />);
    const chip = screen.getByText('No Cover');
    expect(chip).toHaveStyle({ background: 'oklch(48% 0.14 30)' });
    fireEvent.click(chip);
    expect(navigateMock).toHaveBeenCalledWith('/app/trip/tr-no-cover');
  });

  it('renders inbox dashboard actions and empty state', () => {
    const { unmount } = renderWithApp(<InboxDashboard />);
    fireEvent.click(screen.getByText('Lisbon'));
    fireEvent.click(screen.getAllByRole('button', { name: /Attach|Dismiss/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Dismiss/i })[0]);
    expect(navigateMock).toHaveBeenCalled();

    INBOX.splice(0, INBOX.length);
    unmount();
    renderWithApp(<InboxDashboard />);
    expect(screen.getByText('Inbox zero.')).toBeInTheDocument();
  });

  it('renders pipeline dashboard interactions including filters, drag and empty insights', () => {
    TRIPS.forEach((trip) => {
      if (trip.stage !== 'archived') trip.stage = 'planning';
    });
    TRIPS.find((trip) => trip.id === 'tr-lisbon')!.stage = 'booked';

    const { unmount } = renderWithApp(<PipelineDashboard />);

    const lisbonCards = screen.getAllByText('Lisbon');
    fireEvent.click(lisbonCards[lisbonCards.length - 1]);
    expect(navigateMock).toHaveBeenCalledWith('/app/trip/tr-lisbon');

    const tripCard = lisbonCards[lisbonCards.length - 1].closest('.tcard') as HTMLElement;
    const dreamingColumn = screen.getByText('Dreaming').closest('.column') as HTMLElement;
    fireEvent.dragStart(tripCard, { dataTransfer: { effectAllowed: '', setData: vi.fn() } });
    fireEvent.dragOver(dreamingColumn);
    fireEvent.dragLeave(dreamingColumn);
    fireEvent.drop(dreamingColumn);
    expect(within(screen.getByText('Booked').closest('.column') as HTMLElement).getByText(/nothing here yet/i)).toBeInTheDocument();

    unmount();
    familyFilteredPipeline();
    fireEvent.click(screen.getByText('Seed family filter'));
    expect(screen.getByText('Filter:')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Family/i })[1]);
    expect(screen.queryByText('Filter:')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Seed family filter'));
    fireEvent.click(screen.getByText('Clear'));

    fireEvent.click(screen.getByText(/passport expires 6mo after iceland/i));
    fireEvent.click(screen.getAllByRole('button').find((button) => button.className === 'x')!);

    INSIGHTS.splice(0, INSIGHTS.length);
    TRIPS.forEach((trip) => {
      if (trip.start_date) {
        trip.start_date = '2025-01-01';
        trip.end_date = '2025-01-02';
      }
    });
    unmount();
    renderWithApp(<PipelineDashboard />);
    expect(screen.getByText('nothing booked')).toBeInTheDocument();
  });

  it('shows the picked-trip placeholder for inbox items without a suggested trip', () => {
    const itemWithoutSuggestion = INBOX.find((item) => item.id === 'in-4');
    if (!itemWithoutSuggestion) throw new Error('Expected inbox fixture in-4');
    itemWithoutSuggestion.suggested_trip = undefined;

    renderWithApp(<InboxDashboard />);
    const row = screen.getByText(itemWithoutSuggestion.subject).closest('.inbox-row') as HTMLElement;
    expect(within(row).getByRole('button', { name: /Pick trip/i })).toBeDisabled();
    fireEvent.click(within(row).getByRole('button', { name: /Dismiss/i }));
  });

  it('renders inbox fallbacks for unknown metadata and missing source chips', () => {
    const fallbackItem = INBOX.find((item) => item.id === 'in-1');
    const noSourceItem = INBOX.find((item) => item.id === 'in-2');
    if (!fallbackItem || !noSourceItem) throw new Error('Expected inbox fixtures in-1 and in-2');

    fallbackItem.source = 'sms' as never;
    fallbackItem.vendor = 'Mystery Vendor';
    fallbackItem.parsed = {
      ...fallbackItem.parsed!,
      type: 'mystery' as never,
    };
    fallbackItem.suggested_confidence = undefined;
    fallbackItem.suggested_trip = 'tr-kyoto';
    const kyotoTrip = TRIPS.find((trip) => trip.id === 'tr-kyoto');
    if (!kyotoTrip) throw new Error('Expected trip fixture tr-kyoto');
    kyotoTrip.cover = undefined as unknown as Trip['cover'];

    noSourceItem.source = undefined as never;

    renderWithApp(<InboxDashboard />);

    const fallbackRow = screen.getByText(fallbackItem.subject).closest('.inbox-row') as HTMLElement;
    expect(within(fallbackRow).getByText('Manual')).toBeInTheDocument();
    expect(within(fallbackRow).getByText('0%')).toBeInTheDocument();
    fireEvent.click(within(fallbackRow).getByText('Kyoto'));
    expect(navigateMock).toHaveBeenCalledWith('/app/trip/tr-kyoto');

    const noSourceRow = screen.getByText(noSourceItem.subject).closest('.inbox-row') as HTMLElement;
    expect(noSourceRow.querySelector('.src-chip')).toBeNull();
  });

  it('covers pipeline overlap, ribbon clicks, and same-stage drops', () => {
    TRIPS.forEach((trip) => {
      trip.stage = 'archived';
    });

    Object.assign(TRIPS.find((trip) => trip.id === 'tr-catskills')!, {
      stage: 'planning',
      start_date: '2026-04-21',
      end_date: '2026-04-22',
    });
    Object.assign(TRIPS.find((trip) => trip.id === 'tr-mexico')!, {
      stage: 'planning',
      start_date: '2026-04-26',
      end_date: '2026-04-29',
    });
    Object.assign(TRIPS.find((trip) => trip.id === 'tr-lisbon')!, {
      stage: 'planning',
      start_date: '2026-04-26',
      end_date: '2026-04-29',
      cover: undefined as unknown as Trip['cover'],
    });
    Object.assign(TRIPS.find((trip) => trip.id === 'tr-kyoto')!, {
      stage: 'planning',
      start_date: null,
      end_date: null,
      date_approx: 'Later',
    });

    INSIGHTS.splice(0, INSIGHTS.length, {
      id: 'i-no-trip',
      trip_id: '',
      type: 'weather',
      severity: 'info',
      title: 'General nudge',
      body: 'No trip attached',
    });

    renderWithApp(<PipelineDashboard />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('day')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle(/catskills/i));
    expect(navigateMock).toHaveBeenCalledWith('/app/trip/tr-catskills');

    const planningColumn = screen.getByText('Planning').closest('.column') as HTMLElement;
    const planningCards = planningColumn.querySelectorAll('.tcard');
    expect(planningCards[planningCards.length - 1]).toHaveTextContent('Kyoto');
    fireEvent.drop(planningColumn, { dataTransfer: {} });

    const lisbonCard = screen.getAllByText('Lisbon').find((node) => node.closest('.tcard'))!.closest('.tcard') as HTMLElement;
    fireEvent.dragStart(lisbonCard, { dataTransfer: { effectAllowed: '', setData: vi.fn() } });
    fireEvent.dragOver(planningColumn);
    fireEvent.drop(planningColumn);
    fireEvent.dragEnd(lisbonCard);
    expect(within(planningColumn).getAllByText('Lisbon').length).toBe(1);

    fireEvent.click(screen.getByText('General nudge'));
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });
});

describe('modals and tweaks panel', () => {
  function AddTripDriver() {
    const { showModal, setShowModal } = useApp();
    return (
      <>
        <button onClick={() => setShowModal(true)}>Open modal</button>
        {showModal && <AddTripModal />}
      </>
    );
  }

  function IntegrationsDriver() {
    const { showIntegrations, setShowIntegrations } = useApp();
    return (
      <>
        <button onClick={() => setShowIntegrations(true)}>Open integrations</button>
        {showIntegrations && <IntegrationsModal />}
      </>
    );
  }

  function TweaksDriver() {
    const { tweaksOpen, setTweaksOpen } = useApp();
    return (
      <>
        <button onClick={() => setTweaksOpen(true)}>Open tweaks</button>
        {tweaksOpen && <TweaksPanel />}
      </>
    );
  }

  it('AddTripModal step 0 renders fields and validates destination + country required', () => {
    renderWithApp(<AddTripDriver />);
    fireEvent.click(screen.getByRole('button', { name: /Open modal/i }));

    expect(screen.getByLabelText(/Destination/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Region/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/When/i)).toBeInTheDocument();

    // Disabled with no inputs
    expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();

    // Destination filled but country empty → still disabled
    fireEvent.change(screen.getByPlaceholderText(/Kyoto, Patagonia/i), { target: { value: 'Paris' } });
    expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();

    // Both filled → enabled
    fireEvent.change(screen.getByPlaceholderText(/Japan/i), { target: { value: 'France' } });
    expect(screen.getByRole('button', { name: /Next/i })).not.toBeDisabled();

    // Fill optional fields for coverage
    fireEvent.change(screen.getByPlaceholderText(/Optional/i), { target: { value: 'Île-de-France' } });
    fireEvent.change(screen.getByPlaceholderText(/Spring 2027/i), { target: { value: 'Summer 2027' } });

    // Clicking inside modal does not close it
    fireEvent.click(document.querySelector('.modal') as HTMLElement);
    expect(screen.getByLabelText(/Destination/i)).toBeInTheDocument();
  });

  it('AddTripModal cancel closes from step 0; backdrop closes; back returns from step 1 to step 0', () => {
    renderWithApp(<AddTripDriver />);
    fireEvent.click(screen.getByRole('button', { name: /Open modal/i }));

    // Backdrop closes
    fireEvent.click(document.querySelector('.modal-backdrop') as HTMLElement);
    expect(screen.queryByLabelText(/Destination/i)).not.toBeInTheDocument();

    // Reopen → Cancel closes
    fireEvent.click(screen.getByRole('button', { name: /Open modal/i }));
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByLabelText(/Destination/i)).not.toBeInTheDocument();

    // Reopen → fill step 0 → navigate to step 1 → Back returns to step 0
    fireEvent.click(screen.getByRole('button', { name: /Open modal/i }));
    fireEvent.change(screen.getByPlaceholderText(/Kyoto, Patagonia/i), { target: { value: 'Paris' } });
    fireEvent.change(screen.getByPlaceholderText(/Japan/i), { target: { value: 'France' } });
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByText(/Categories/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /← Back/i }));
    expect(screen.getByLabelText(/Destination/i)).toBeInTheDocument();
  });

  it('AddTripModal close button (×) works', () => {
    renderWithApp(<AddTripDriver />);
    fireEvent.click(screen.getByRole('button', { name: /Open modal/i }));
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByLabelText(/Destination/i)).not.toBeInTheDocument();
  });

  it('AddTripModal step 1 validates categories and travelers with toggle behavior', () => {
    renderWithApp(<AddTripDriver />);
    fireEvent.click(screen.getByRole('button', { name: /Open modal/i }));
    fireEvent.change(screen.getByPlaceholderText(/Kyoto, Patagonia/i), { target: { value: 'Paris' } });
    fireEvent.change(screen.getByPlaceholderText(/Japan/i), { target: { value: 'France' } });
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Travelers (Quincy) pre-selected; no categories → disabled
    expect(screen.getByRole('button', { name: /Quincy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Maren/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();

    // Toggle category on → enabled
    fireEvent.click(screen.getByRole('button', { name: /^Family$/i }));
    expect(screen.getByRole('button', { name: /Next/i })).not.toBeDisabled();

    // Toggle category off → disabled again
    fireEvent.click(screen.getByRole('button', { name: /^Family$/i }));
    expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();

    // Re-select category; deselect all travelers → disabled
    fireEvent.click(screen.getByRole('button', { name: /^Family$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Quincy/i })); // deselect pre-selected traveler
    expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();

    // Re-add traveler → enabled
    fireEvent.click(screen.getByRole('button', { name: /Quincy/i }));
    expect(screen.getByRole('button', { name: /Next/i })).not.toBeDisabled();
  });

  it('AddTripModal step 2 shows confirmation summary and submitting adds trip and closes', () => {
    renderWithApp(<AddTripDriver />);
    fireEvent.click(screen.getByRole('button', { name: /Open modal/i }));

    // Step 0
    fireEvent.change(screen.getByPlaceholderText(/Kyoto, Patagonia/i), { target: { value: 'Paris' } });
    fireEvent.change(screen.getByPlaceholderText(/Japan/i), { target: { value: 'France' } });
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 1
    fireEvent.click(screen.getByRole('button', { name: /^Family$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 2: budget input, summary with destination name, Next disabled or not (always proceed)
    expect(screen.getByLabelText(/Rough budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Paris/)).toBeInTheDocument();
    expect(screen.getByText(/Dreaming/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Rough budget/i), { target: { value: '5000' } });

    // Step 2 canProceed() is always true → Add trip button enabled
    expect(screen.getByRole('button', { name: /Add trip/i })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Add trip/i }));

    // Modal closes after submit
    expect(screen.queryByLabelText(/Rough budget/i)).not.toBeInTheDocument();
  });

  it('AddTripModal handles empty budget (fallback to 0) and trip count increases', () => {
    function CountingDriver() {
      const { trips, showModal, setShowModal } = useApp();
      return (
        <>
          <div>{trips.length} trips</div>
          <button onClick={() => setShowModal(true)}>Open modal</button>
          {showModal && <AddTripModal />}
        </>
      );
    }

    renderWithApp(<CountingDriver />);
    const initialCount = screen.getByText(/trips/).textContent;
    expect(initialCount).toMatch(/\d+ trips/);

    fireEvent.click(screen.getByRole('button', { name: /Open modal/i }));

    // Step 0
    fireEvent.change(screen.getByPlaceholderText(/Kyoto, Patagonia/i), { target: { value: 'Tokyo' } });
    fireEvent.change(screen.getByPlaceholderText(/Japan/i), { target: { value: 'Japan' } });
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 1
    fireEvent.click(screen.getByRole('button', { name: /^Couple$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 2: leave budget empty (triggers || 0 fallback)
    const budgetInput = screen.getByLabelText(/Rough budget/i) as HTMLInputElement;
    expect(budgetInput.value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: /Add trip/i }));

    // Trip added with budget 0
    const finalCount = screen.getByText(/trips/).textContent;
    expect(finalCount).not.toEqual(initialCount);
  });

  it('AddTripModal full workflow with all fields filled and trip added', () => {
    function TripsDriver() {
      const { trips, showModal, setShowModal } = useApp();
      return (
        <>
          <div data-testid="trip-count">{trips.length} trips</div>
          <button onClick={() => setShowModal(true)}>Open modal</button>
          {showModal && <AddTripModal />}
        </>
      );
    }

    renderWithApp(<TripsDriver />);
    const initialTrips = parseInt(screen.getByTestId('trip-count').textContent!.match(/\d+/)![0]);

    fireEvent.click(screen.getByRole('button', { name: /Open modal/i }));
    expect(screen.getByText(/New trip/)).toBeInTheDocument();

    // Step 0: all fields
    fireEvent.change(screen.getByPlaceholderText(/Kyoto, Patagonia/i), { target: { value: 'Amsterdam' } });
    fireEvent.change(screen.getByPlaceholderText(/Optional/i), { target: { value: 'Canals' } });
    fireEvent.change(screen.getByPlaceholderText(/Japan/i), { target: { value: 'Netherlands' } });
    fireEvent.change(screen.getByPlaceholderText(/Spring 2027/i), { target: { value: 'Fall 2026' } });
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 1: categories and travelers
    fireEvent.click(screen.getByRole('button', { name: /^Couple$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Maren/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 2: budget
    fireEvent.change(screen.getByLabelText(/Rough budget/i), { target: { value: '3500' } });
    fireEvent.click(screen.getByRole('button', { name: /Add trip/i }));

    // Modal closed, trip added
    expect(screen.queryByText(/New trip/)).not.toBeInTheDocument();
    const finalTrips = parseInt(screen.getByTestId('trip-count').textContent!.match(/\d+/)![0]);
    expect(finalTrips).toBe(initialTrips + 1);
  });

  it('IntegrationsModal renders all integrations with status badges and meta text', () => {
    renderWithApp(<IntegrationsDriver />);
    fireEvent.click(screen.getByRole('button', { name: /Open integrations/i }));

    expect(screen.getByText('Forwarding inbox')).toBeInTheDocument();
    expect(screen.getByText('Gmail')).toBeInTheDocument();
    expect(screen.getByText('Flight tracking')).toBeInTheDocument();
    expect(screen.getByText('Browser extension')).toBeInTheDocument();
    expect(screen.getByText('Airbnb')).toBeInTheDocument();
    expect(screen.getByText('Viator / GetYourGuide')).toBeInTheDocument();
    expect(screen.getByText('OpenTable')).toBeInTheDocument();
    expect(screen.getByText('Calendar export')).toBeInTheDocument();

    // Status badges
    expect(screen.getAllByText(/● Connected/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/◐ Via forwarding/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/○ Available/).length).toBeGreaterThan(0);

    // Meta points at the real endpoint, not a fictional mailbox
    expect(screen.getByText(/POST \/api\/inbox\/ingest/)).toBeInTheDocument();
  });

  it('IntegrationsModal advertises no connection the code cannot make', () => {
    renderWithApp(<IntegrationsDriver />);
    fireEvent.click(screen.getByRole('button', { name: /Open integrations/i }));

    // Only the forwarding endpoint and the iCal feed are actually implemented.
    const connected = INTEGRATIONS.filter((i) => i.status === 'active').map((i) => i.key);
    expect(connected).toEqual(['forward', 'calendar']);

    // Nothing claims fabricated usage telemetry.
    expect(screen.queryByText(/this year|this month|PNRs watched|saved drafts/)).toBeNull();
  });

  it('IntegrationsModal closes via close button, backdrop, and done button', () => {
    renderWithApp(<IntegrationsDriver />);
    fireEvent.click(screen.getByRole('button', { name: /Open integrations/i }));

    // Close via × button
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText('Forwarding inbox')).not.toBeInTheDocument();

    // Close via backdrop
    fireEvent.click(screen.getByRole('button', { name: /Open integrations/i }));
    fireEvent.click(document.querySelector('.modal-backdrop') as HTMLElement);
    expect(screen.queryByText('Forwarding inbox')).not.toBeInTheDocument();

    // Close via Done button
    fireEvent.click(screen.getByRole('button', { name: /Open integrations/i }));
    fireEvent.click(screen.getByRole('button', { name: /Done/i }));
    expect(screen.queryByText('Forwarding inbox')).not.toBeInTheDocument();
  });

  it('TweaksPanel renders and updates theme, accent, and density then closes', () => {
    renderWithApp(<TweaksDriver />);
    fireEvent.click(screen.getByRole('button', { name: /Open tweaks/i }));

    expect(screen.getByText(/Tweaks/)).toBeInTheDocument();

    // Initial active states (light, orange, normal)
    expect(screen.getByRole('button', { name: /Light/i })).toHaveClass('on');
    expect(screen.getByRole('button', { name: /Dark/i })).not.toHaveClass('on');
    expect(screen.getByTitle('Clay')).toHaveClass('on');
    expect(screen.getByTitle('Olive')).not.toHaveClass('on');
    expect(screen.getByRole('button', { name: /normal/i })).toHaveClass('on');

    // Switch to dark theme
    fireEvent.click(screen.getByRole('button', { name: /Dark/i }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByRole('button', { name: /Dark/i })).toHaveClass('on');
    expect(screen.getByRole('button', { name: /Light/i })).not.toHaveClass('on');

    // Switch back to light
    fireEvent.click(screen.getByRole('button', { name: /Light/i }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    // Change accent to olive
    fireEvent.click(screen.getByTitle('Olive'));
    expect(screen.getByTitle('Olive')).toHaveClass('on');
    expect(screen.getByTitle('Clay')).not.toHaveClass('on');

    // Change density to compact
    fireEvent.click(screen.getByRole('button', { name: /compact/i }));
    expect(screen.getByRole('button', { name: /compact/i })).toHaveClass('on');
    expect(screen.getByRole('button', { name: /normal/i })).not.toHaveClass('on');

    // Change density to roomy (covers third branch)
    fireEvent.click(screen.getByRole('button', { name: /roomy/i }));
    expect(screen.getByRole('button', { name: /roomy/i })).toHaveClass('on');

    // Close panel
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText(/Tweaks/)).not.toBeInTheDocument();
  });
});
