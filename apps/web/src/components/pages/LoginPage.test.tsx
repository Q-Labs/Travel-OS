import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../lib/db', () => ({
  signInWithMagicLink: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

import { signInWithMagicLink, signInWithOAuth, signInWithPassword } from '../../lib/db';
import { LoginPage } from './LoginPage';

const mockSignIn = signInWithMagicLink as ReturnType<typeof vi.fn>;
const mockPassword = signInWithPassword as ReturnType<typeof vi.fn>;
const mockOAuth = signInWithOAuth as ReturnType<typeof vi.fn>;

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

  const fillPasswordForm = () => {
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Password' }));
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2' } });
  };

  it('password mode: signs in through Supabase and opens the app', async () => {
    mockPassword.mockResolvedValue({ error: null });
    renderLogin();
    fillPasswordForm();
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect(screen.getByTestId('app-pipeline')).toBeInTheDocument());
    expect(mockPassword).toHaveBeenCalledWith('user@example.com', 'hunter2');
  });

  it('password mode: shows a signing-in state while the request is pending', async () => {
    let resolve: (v: { error: null }) => void = () => {};
    mockPassword.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderLogin();
    fillPasswordForm();
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
    expect(screen.queryByTestId('app-pipeline')).not.toBeInTheDocument();
    await act(async () => { resolve({ error: null }); });
  });

  it('password mode: wrong credentials show the error and let the user retry', async () => {
    mockPassword.mockResolvedValue({ error: new Error('Invalid login credentials') });
    renderLogin();
    fillPasswordForm();
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials');
    expect(screen.queryByTestId('app-pipeline')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).not.toBeDisabled();
  });

  it('magic link submits the trimmed email', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: '  user@example.com ' } });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('user@example.com'));
  });

  it.each([
    ['Continue with Google', 'google'],
    ['Continue with Apple', 'apple'],
  ])('%s starts the %s OAuth flow', async (label, provider) => {
    mockOAuth.mockResolvedValue({ error: null });
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: label }));
    await waitFor(() => expect(mockOAuth).toHaveBeenCalledWith(provider));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the error when a social provider cannot be started', async () => {
    mockOAuth.mockResolvedValue({ error: new Error('provider is not enabled') });
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Apple' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('provider is not enabled');
  });

  it('locks every sign-in control while a social flow starts, so two flows cannot race', async () => {
    mockOAuth.mockReturnValue(new Promise(() => {}));
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Apple' }));
    expect(mockOAuth).toHaveBeenCalledTimes(1);
    // the email button is disabled but does not claim to be sending anything
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeDisabled();
    expect(screen.queryByText(/sending link|signing in/i)).not.toBeInTheDocument();
  });

  it.each([
    ['magic link', () => mockSignIn, /send magic link/i, false],
    ['password', () => mockPassword, /^sign in$/i, true],
  ] as const)('a %s call that throws shows the error and frees the form', async (_name, mock, submit, password) => {
    mock().mockRejectedValue(new Error('network down'));
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } });
    if (password) {
      fireEvent.click(screen.getByRole('button', { name: 'Password' }));
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2' } });
    }
    fireEvent.click(screen.getByRole('button', { name: submit }));
    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
    expect(screen.getByRole('button', { name: submit })).not.toBeDisabled();
  });

  it('a social call that throws something other than an Error still reports a failure', async () => {
    mockOAuth.mockRejectedValue('boom');
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Try again.');
    expect(screen.getByRole('button', { name: 'Continue with Google' })).not.toBeDisabled();
  });

  it('password mode will not submit without a password', () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Password' }));
    expect(screen.getByLabelText('Password')).toBeRequired();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2' } });
    expect(screen.getByRole('button', { name: /^sign in$/i })).not.toBeDisabled();
  });

  it('sent state offers a different email and no way around auth', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: /skip for now/i })).not.toBeInTheDocument();
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
