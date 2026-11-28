import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { KanbanBoard } from './KanbanBoard';
import type { Trip } from '../../lib/types';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'tr-lisbon', destination: 'Lisbon', region: 'Estremadura', country: 'Portugal',
    stage: 'booked', categories: ['couple'],
    start_date: '2026-06-01', end_date: '2026-06-08', date_approx: null,
    budget_total: 1000, budget_spent: 0, budget_currency: 'USD',
    travelers: ['t1'], cover: { hue: 30, label: 'x' }, notes: '', nights: 7,
    ...overrides,
  };
}

function column(label: string): HTMLElement {
  return screen.getByText(label).closest('.column') as HTMLElement;
}

function pickUpLisbon() {
  const card = screen.getByText('Lisbon').closest('.tcard') as HTMLElement;
  fireEvent.dragStart(card, { dataTransfer: { effectAllowed: '', setData: vi.fn() } });
}

function board(trips: Trip[]) {
  return render(<KanbanBoard trips={trips} categoryFilter={[]} onOpen={vi.fn()} onMove={vi.fn()} />);
}

describe('KanbanBoard', () => {
  it('shows no card for a trip whose stage is not a pipeline column', () => {
    board([makeTrip(), makeTrip({ id: 'tr-old', destination: 'Oslo', stage: 'archived' })]);
    expect(screen.getByText('Lisbon')).toBeInTheDocument();
    expect(screen.queryByText('Oslo')).not.toBeInTheDocument();
  });

  it('keeps the drop highlight while the pointer moves within one column', () => {
    board([makeTrip()]);
    pickUpLisbon();
    fireEvent.dragOver(column('Planning'));
    fireEvent.dragOver(column('Planning'));
    expect(column('Planning')).toHaveClass('drop-target');
  });

  it('leaving a column other than the highlighted one keeps the highlight', () => {
    board([makeTrip()]);
    pickUpLisbon();
    fireEvent.dragOver(column('Planning'));
    fireEvent.dragLeave(column('Dreaming'));
    expect(column('Planning')).toHaveClass('drop-target');

    fireEvent.dragLeave(column('Planning'));
    expect(column('Planning')).not.toHaveClass('drop-target');
  });
});
