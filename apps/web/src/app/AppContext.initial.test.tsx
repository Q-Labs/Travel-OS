import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/db', () => ({
  subscribeAuthChange: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  subscribeInbox: vi.fn(),
  hasSeededData: vi.fn(),
  seedFromFixtures: vi.fn(),
  fetchTrips: vi.fn(),
  fetchTripDetails: vi.fn(),
  fetchInsights: vi.fn(),
  fetchInboxItems: vi.fn(),
  fetchInboxToken: vi.fn(),
  upsertTrip: vi.fn(),
  upsertTripDetail: vi.fn(),
  deleteInsight: vi.fn(),
  deleteInboxItem: vi.fn(),
}));

import { INBOX, INSIGHTS, TRIPS, TRIP_DETAILS } from '../lib/data';
import { AppProvider, useApp } from './AppContext';

function Counts() {
  const { trips, tripDetails, insights, inbox, inboxToken } = useApp();
  return <p>{[trips.length, Object.keys(tripDetails).length, insights.length, inbox.length, inboxToken ?? 'none'].join(' / ')}</p>;
}

describe('AppProvider starting state', () => {
  it('starts on the fixtures, with no inbox token, when given nothing', () => {
    render(
      <AppProvider>
        <Counts />
      </AppProvider>,
    );
    const counts = [TRIPS.length, Object.keys(TRIP_DETAILS).length, INSIGHTS.length, INBOX.length, 'none'].join(' / ');
    expect(screen.getByText(counts)).toBeInTheDocument();
  });

  it('starts on what it is given, so a story or test can show an empty app', () => {
    render(
      <AppProvider initial={{ trips: [], tripDetails: {}, insights: [], inbox: [], inboxToken: 'abc123' }}>
        <Counts />
      </AppProvider>,
    );
    expect(screen.getByText('0 / 0 / 0 / 0 / abc123')).toBeInTheDocument();
  });

  it('falls back to the fixtures for whatever it is not given', () => {
    render(
      <AppProvider initial={{ inbox: [] }}>
        <Counts />
      </AppProvider>,
    );
    const counts = [TRIPS.length, Object.keys(TRIP_DETAILS).length, INSIGHTS.length, 0, 'none'].join(' / ');
    expect(screen.getByText(counts)).toBeInTheDocument();
  });
});
