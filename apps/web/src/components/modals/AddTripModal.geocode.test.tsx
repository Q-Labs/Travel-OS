import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const geocode = vi.fn();
const addTrip = vi.fn();

vi.mock('../../lib/clients/openMeteo', () => ({ geocode: (...a: unknown[]) => geocode(...a) }));
vi.mock('../../app/AppContext', () => ({
  useApp: () => ({ addTrip, setShowModal: vi.fn() }),
}));

import { AddTripModal } from './AddTripModal';

const PLACE = { lat: 38.7, lon: -9.1, country: 'Portugal', region: 'Lisbon', timezone: 'Europe/Lisbon' };

beforeEach(() => {
  geocode.mockReset();
  addTrip.mockReset();
  vi.stubGlobal('fetch', vi.fn());
});

function typeDestination(value: string) {
  const input = screen.getByLabelText('Destination');
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
  return input;
}

describe('AddTripModal destination autofill', () => {
  it('fills region and country from the geocoder', async () => {
    geocode.mockResolvedValue(PLACE);
    render(<AddTripModal />);
    typeDestination('Lisbon');

    await waitFor(() => expect(screen.getByLabelText('Country')).toHaveValue('Portugal'));
    expect(screen.getByLabelText(/Region \/ venue/)).toHaveValue('Lisbon');
    expect(geocode).toHaveBeenCalledWith('Lisbon', expect.any(Function));
  });

  it('does not overwrite values the user already typed', async () => {
    geocode.mockResolvedValue(PLACE);
    render(<AddTripModal />);
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'Portvgal' } });
    fireEvent.change(screen.getByLabelText(/Region \/ venue/), { target: { value: 'Alfama' } });
    typeDestination('Lisbon');

    await waitFor(() => expect(geocode).toHaveBeenCalled());
    expect(screen.getByLabelText('Country')).toHaveValue('Portvgal');
    expect(screen.getByLabelText(/Region \/ venue/)).toHaveValue('Alfama');
  });

  it('leaves the form alone when the destination is unknown', async () => {
    geocode.mockResolvedValue(null);
    render(<AddTripModal />);
    typeDestination('Atlantis');

    await waitFor(() => expect(geocode).toHaveBeenCalled());
    expect(screen.getByLabelText('Country')).toHaveValue('');
  });

  it('does not call the geocoder for a blank destination', () => {
    render(<AddTripModal />);
    fireEvent.blur(screen.getByLabelText('Destination'));
    expect(geocode).not.toHaveBeenCalled();
  });

  it('shows a hint while the lookup is in flight', async () => {
    let resolve!: (v: unknown) => void;
    geocode.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<AddTripModal />);
    typeDestination('Lisbon');

    expect(await screen.findByText(/looking up/)).toBeInTheDocument();
    resolve(PLACE);
    await waitFor(() => expect(screen.queryByText(/looking up/)).not.toBeInTheDocument());
  });
});
