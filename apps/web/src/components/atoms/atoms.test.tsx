import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';
import { CatPip } from './CatPip';
import { BOOKING_ICONS, Icon } from './Icon';
import { MiniProgress } from './MiniProgress';
import { SourceChip } from './SourceChip';
import { StageDot } from './StageDot';
import { VendorMark } from './VendorMark';

describe('atoms', () => {
  it('renders every icon and maps each booking category to one', () => {
    const { container } = render(
      <div>{Object.values(Icon).map((Glyph, i) => <Glyph key={i} />)}</div>,
    );
    expect(container.querySelectorAll('svg')).toHaveLength(Object.keys(Icon).length);
    expect(Object.keys(BOOKING_ICONS)).toEqual(['flight', 'lodging', 'transport', 'dining', 'activity', 'other']);
  });

  it('StageDot takes its colour from the stage token', () => {
    const { container } = render(<StageDot stage="booked" />);
    expect(container.querySelector('.stage-dot')).toHaveStyle({ background: 'var(--stage-booked)' });
  });

  it('MiniProgress fills the bar to the given percentage', () => {
    const { container } = render(<MiniProgress value={42} />);
    expect(container.querySelector('.mini-progress > div')).toHaveStyle({ width: '42%' });
  });

  it('CatPip uses the stylesheet size unless one is given', () => {
    const { container, rerender } = render(<CatPip color="red" title="Family" />);
    const pip = () => container.querySelector('.cat-pip') as HTMLElement;
    expect(pip()).toHaveAttribute('title', 'Family');
    expect(pip().style.width).toBe('');
    rerender(<CatPip color="red" size={10} />);
    expect(pip()).toHaveStyle({ width: '10px', height: '10px' });
    expect(pip()).not.toHaveAttribute('title');
  });

  it('Avatar shows its content and can be muted for overflow counts', () => {
    const { rerender } = render(<Avatar title="Quincy">QI</Avatar>);
    expect(screen.getByTitle('Quincy')).toHaveTextContent('QI');
    expect(screen.getByTitle('Quincy').style.background).toBe('');
    rerender(<Avatar muted>+2</Avatar>);
    expect(screen.getByText('+2')).toHaveStyle({ background: 'var(--ink-3)' });
  });

  it('SourceChip labels known sources, falls back to Manual, and renders nothing without a source', () => {
    const { container, rerender } = render(<SourceChip source="gmail" />);
    expect(screen.getByTitle('From Gmail')).toHaveTextContent('Gmail');
    rerender(<SourceChip source="carrier-pigeon" />);
    expect(screen.getByTitle('From Manual')).toBeInTheDocument();
    rerender(<SourceChip />);
    expect(container).toBeEmptyDOMElement();
  });

  it('SourceChip shows a count in place of the tooltip', () => {
    const { container } = render(<SourceChip source="email" count={3} />);
    expect(container.querySelector('.src-chip')).toHaveTextContent('Forwarded · 3');
    expect(container.querySelector('.src-chip')).not.toHaveAttribute('title');
  });

  it('VendorMark uses the vendor glyph, or the first letter for unknown vendors', () => {
    const { container, rerender } = render(<VendorMark vendor="Airbnb" />);
    expect(container.querySelector('.vendor-mark')).toHaveTextContent('A');
    rerender(<VendorMark vendor="Zephyr Rail" />);
    expect(container.querySelector('.vendor-mark')).toHaveTextContent('Z');
    expect(container.querySelector('.vendor-mark')).toHaveStyle({ background: 'var(--ink-3)' });
  });
});
