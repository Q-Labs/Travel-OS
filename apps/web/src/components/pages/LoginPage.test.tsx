import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../lib/db', () => ({
  signInWithMagicLink: vi.fn(),
}));

import { signInWithMagicLink } from '../../lib/db';
import { LoginPage } from './LoginPage';

const mockSignIn = signInWithMagicLink as ReturnType<typeof vi.fn>;

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app/pipeline" element={<div data-testid="app-pipeline">app</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

describe('LoginPage', () => {
  it('renders email input and disabled submit button when empty', () => {
    renderLogin();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeDisabled();
  });

  it('enables submit button when email is entered', () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    expect(screen.getByRole('button', { name: /send magic link/i })).not.toBeDisabled();
  });

  it('shows confirmation screen with email after successful sign-in', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('shows error alert when sign-in fails', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('rate limited') });
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('rate limited');
  });

  it('keeps submit button enabled after an error so the user can retry', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('oops') });
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /send magic link/i })).not.toBeDisabled();
  });

  it('renders left mosaic panel with destination tiles', () => {
    renderLogin();
    expect(screen.getByText('Kyoto')).toBeInTheDocument();
    expect(screen.getByText('Iceland')).toBeInTheDocument();
    expect(screen.getByText('Lisbon')).toBeInTheDocument();
  });

  it('renders Welcome back heading and social login buttons', () => {
    renderLogin();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with apple/i })).toBeInTheDocument();
  });

  it('shows mode toggle chips and defaults to magic link mode', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: 'Magic link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Password' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  it('switches to password mode showing password field and Sign in button', () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Password' }));
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });

  it('password mode: shows loading spinner when submitting', async () => {
    vi.useFakeTimers();
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Password' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    });
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    await act(async () => { vi.runAllTimers(); });
    expect(screen.getByTestId('app-pipeline')).toBeInTheDocument();
  });

  it('sent state shows Skip for now link and Different email button', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /skip for now/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /different email/i })).toBeInTheDocument();
  });

  it('password field accepts input when in password mode', () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Password' }));
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
    expect(screen.getByLabelText('Password')).toHaveValue('secret123');
  });

  it('Magic link chip switches back from password mode', () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Password' }));
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Magic link' }));
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });

  it('Different email button returns to the form', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /different email/i }));
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });
});
