import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const state = { theme: 'dark' as 'dark' | 'light' };
vi.mock('./AppContext', () => ({ useApp: () => state }));

import { CobaltRoot } from './CobaltRoot';

describe('CobaltRoot', () => {
  it('wraps the app in the Cobalt provider using the current theme', () => {
    state.theme = 'dark';
    const { rerender } = render(<CobaltRoot><p>app</p></CobaltRoot>);
    expect(screen.getByText('app').closest('[data-theme]')).toHaveAttribute('data-theme', 'dark');
    state.theme = 'light';
    rerender(<CobaltRoot><p>app</p></CobaltRoot>);
    expect(screen.getByText('app').closest('[data-theme]')).toHaveAttribute('data-theme', 'light');
  });
});
