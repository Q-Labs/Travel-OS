import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const state = { theme: 'dark' as 'dark' | 'light', accent: 'cobalt' as 'cobalt' | 'emerald' | 'violet' | 'rust' };
vi.mock('./AppContext', () => ({ useApp: () => state }));

import { CobaltRoot } from './CobaltRoot';

const provider = () => screen.getByText('app').closest('[data-theme]') as HTMLElement;

describe('CobaltRoot', () => {
  it('wraps the app in the Cobalt provider using the current theme', () => {
    state.theme = 'dark';
    state.accent = 'cobalt';
    const { rerender } = render(<CobaltRoot><p>app</p></CobaltRoot>);
    expect(provider()).toHaveAttribute('data-theme', 'dark');
    state.theme = 'light';
    rerender(<CobaltRoot><p>app</p></CobaltRoot>);
    expect(provider()).toHaveAttribute('data-theme', 'light');
  });

  it('puts the accent override on the same element as data-theme, so it beats Cobalt\'s theme rules', () => {
    state.theme = 'dark';
    state.accent = 'emerald';
    render(<CobaltRoot><p>app</p></CobaltRoot>);
    expect(provider().style.getPropertyValue('--accent-default')).toBe('#1F8A5B');
    expect(provider().style.getPropertyValue('--text-accent')).toContain('#1F8A5B');
  });

  it('adds no override for Cobalt\'s own accent', () => {
    state.accent = 'cobalt';
    render(<CobaltRoot><p>app</p></CobaltRoot>);
    expect(provider().style.getPropertyValue('--accent-default')).toBe('');
  });
});
