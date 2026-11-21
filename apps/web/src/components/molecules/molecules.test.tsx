import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TODAY } from '../../lib/data';
import { Avatars } from './Avatars';
import { CategoryPips } from './CategoryPips';
import { DocumentCard } from './DocumentCard';
import { EmptyState } from './EmptyState';
import { ParsedCard } from './ParsedCard';
import { ProgressRow } from './ProgressRow';
import { TripStat } from './TripStat';

const isoDaysFromToday = (days: number) => {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

describe('molecules', () => {
  it('Avatars shows travelers up to the max and counts the rest', () => {
    render(<Avatars ids={['t1', 't2', 't3', 't4', 't5', 'nobody']} max={2} />);
    expect(screen.getByTitle('Quincy')).toHaveTextContent('Q');
    expect(screen.getByTitle('Maren')).toHaveTextContent('M');
    expect(screen.queryByTitle('Ezra')).not.toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('Avatars shows no overflow count when everyone fits', () => {
    render(<Avatars ids={['t1']} />);
    expect(screen.getByTitle('Quincy')).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('CategoryPips labels each category', () => {
    render(<CategoryPips cats={['family', 'race']} />);
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Race')).toBeInTheDocument();
  });

  it('EmptyState shows a title and a line of guidance', () => {
    render(<EmptyState title="Inbox zero." body="New confirmations will show up here." />);
    expect(screen.getByText('Inbox zero.')).toBeInTheDocument();
    expect(screen.getByText('New confirmations will show up here.')).toBeInTheDocument();
  });

  it('ParsedCard shows cost, confirmation and note when the parse has them', () => {
    render(
      <ParsedCard parsed={{ type: 'flight', title: 'EWR → LIS', dates: 'Sep 12', cost: 1180, confirmation: 'UA-7G2K1', note: 'Two seats' }} />,
    );
    expect(screen.getByText('EWR → LIS')).toBeInTheDocument();
    expect(screen.getByText('$1,180')).toBeInTheDocument();
    expect(screen.getByText('UA-7G2K1')).toBeInTheDocument();
    expect(screen.getByText('Two seats')).toBeInTheDocument();
  });

  it('ParsedCard leaves out cost, confirmation and note when absent, and survives an unknown type', () => {
    const { container } = render(
      <ParsedCard parsed={{ type: 'mystery' as never, title: 'Saved listing', dates: 'TBD', cost: 0, confirmation: null }} />,
    );
    expect(screen.getByText('Saved listing')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelectorAll('.parsed-card > div')).toHaveLength(2);
    expect(container.querySelectorAll('.parsed-card span')).toHaveLength(1);
  });

  it('TripStat shows optional subvalue and progress only when given', () => {
    const { container, rerender } = render(<TripStat label="Nights" value="5" />);
    expect(container.querySelector('small')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
    rerender(<TripStat label="Budget" value="$1 / $2" subvalue="half" progress={50} />);
    expect(screen.getByText('half')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('ProgressRow pairs a label and value with a bar', () => {
    render(<ProgressRow label="Packing" value="3/4 packed" progress={75} />);
    expect(screen.getByText('Packing')).toBeInTheDocument();
    expect(screen.getByText('3/4 packed')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });

  it('DocumentCard warns when a document expires within six months', () => {
    const { container, rerender } = render(
      <DocumentCard document={{ type: 'passport', title: 'Quincy passport', expiry: isoDaysFromToday(30) }} />,
    );
    expect(container.querySelector('.document-card')).toHaveClass('warning');
    expect(screen.getByText(/Renew soon/)).toBeInTheDocument();
    rerender(<DocumentCard document={{ type: 'passport', title: 'Quincy passport', expiry: isoDaysFromToday(900) }} />);
    expect(container.querySelector('.document-card')).not.toHaveClass('warning');
    rerender(<DocumentCard document={{ type: 'confirmation', title: 'Boarding pass' }} />);
    expect(screen.getByText('No expiry date')).toBeInTheDocument();
  });
});
