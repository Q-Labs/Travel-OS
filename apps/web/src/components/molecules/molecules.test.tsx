import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TODAY } from '../../lib/data';
import { Avatars } from './Avatars';
import { CategoryPips } from './CategoryPips';
import { DocumentCard } from './DocumentCard';
import { EmptyState } from './EmptyState';
import { MetricTile } from './MetricTile';
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
    const { container } = render(<Avatars ids={['t1', 't2', 't3', 't4', 't5', 'nobody']} max={2} />);
    expect(container.querySelectorAll('.av')).toHaveLength(3);
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('Avatars shows no overflow count when everyone fits', () => {
    const { container } = render(<Avatars ids={['t1']} />);
    expect(container.querySelectorAll('.av')).toHaveLength(1);
  });

  it('CategoryPips labels each category', () => {
    render(<CategoryPips cats={['family', 'race']} />);
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Race')).toBeInTheDocument();
  });

  it('MetricTile renders label, value and hint, and can be emphasised', () => {
    const { container, rerender } = render(<MetricTile label="Next trip" value="12" hint="Lisbon" />);
    expect(container.querySelector('.metric')).not.toHaveClass('pop');
    expect(container.querySelector('.label')).toHaveTextContent('Next trip');
    expect(container.querySelector('.value')).toHaveTextContent('12');
    expect(container.querySelector('.hint')).toHaveTextContent('Lisbon');
    rerender(<MetricTile label="Next trip" value="12" hint="Lisbon" pop hintStyle={{ marginTop: 8 }} />);
    expect(container.querySelector('.metric')).toHaveClass('pop');
    expect(container.querySelector('.hint')).toHaveStyle({ marginTop: '8px' });
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
    expect(container.querySelector('.mini-progress')).toBeNull();
    rerender(<TripStat label="Budget" value="$1 / $2" subvalue="half" progress={50} />);
    expect(screen.getByText('half')).toBeInTheDocument();
    expect(container.querySelector('.mini-progress > div')).toHaveStyle({ width: '50%' });
  });

  it('ProgressRow pairs a label and value with a bar', () => {
    const { container } = render(<ProgressRow label="Packing" value="3/4 packed" progress={75} />);
    expect(screen.getByText('Packing')).toBeInTheDocument();
    expect(screen.getByText('3/4 packed')).toBeInTheDocument();
    expect(container.querySelector('.mini-progress > div')).toHaveStyle({ width: '75%' });
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
