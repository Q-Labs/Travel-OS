import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithMagicLink, signInWithOAuth, signInWithPassword } from '../../lib/db';
import { AuthLayout } from '../templates/AuthLayout';
import { Button, Input, LogoMark } from '@q-labs/cobalt';

type LoginStep = 'form' | 'sent' | 'error';
type LoginMode = 'magic' | 'password';

const MOSAIC_TILES = [
  { label: 'Kyoto', hue: 18 },
  { label: 'Iceland', hue: 195 },
  { label: 'Lisbon', hue: 32 },
  { label: 'Oaxaca', hue: 350 },
  { label: 'Patagonia', hue: 210 },
  { label: 'Marrakech', hue: 12 },
];

/**
 * The sign-in page: email with a magic link or a password, plus the outside
 * provider buttons, beside a mosaic of destinations. It shows a confirmation
 * once a link is sent, or the error, and disables every sign-in control while
 * one is in flight so two flows cannot race.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<LoginMode>('magic');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<LoginStep>('form');
  // Which sign-in action is in flight. While one runs, every sign-in control is
  // disabled, so two flows (e.g. Google then Apple) can never race.
  const [pending, setPending] = useState<'submit' | 'google' | 'apple' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fail = (message: string) => {
    setErrorMessage(message);
    setStep('error');
    setPending(null);
  };

  // A Supabase call can also throw (network, misconfiguration) rather than
  // return { error }; both end in the same alert so the form is never stuck.
  const failFrom = (err: unknown) => fail(err instanceof Error ? err.message : 'Something went wrong. Try again.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending('submit');
    try {
      if (mode === 'password') {
        const { error } = await signInWithPassword(email.trim(), password);
        if (error) return fail(error.message);
        navigate('/app/pipeline');
        return;
      }
      const { error } = await signInWithMagicLink(email.trim());
      if (error) return fail(error.message);
      setPending(null);
      setStep('sent');
    } catch (err) {
      failFrom(err);
    }
  };

  // On success the browser leaves for the provider, so only a failure to start
  // the flow comes back here.
  const handleSocial = async (provider: 'google' | 'apple') => {
    setPending(provider);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) fail(error.message);
    } catch (err) {
      failFrom(err);
    }
  };

  const busy = pending !== null;
  const canSubmit = email.trim() !== '' && (mode === 'magic' || password !== '');

  return (
    <AuthLayout
      aside={
        <>
        <div className="login-mosaic">
          {MOSAIC_TILES.map((tile, i) => (
            <div
              key={tile.label}
              className="mosaic-tile"
              style={{
                background: `linear-gradient(135deg, oklch(52% 0.14 ${tile.hue}) 0%, oklch(36% 0.1 ${tile.hue + 30}) 100%)`,
                animationDelay: `${i * 0.18}s`,
              }}
            >
              <span className="mosaic-label">{tile.label}</span>
            </div>
          ))}
        </div>
        <div className="login-left-foot">
          <p className="login-tagline">Every trip, in one place.</p>
          <p className="login-tagline-sub">
            Pipeline, itinerary, bookings, budget — from dreaming to landing.
          </p>
        </div>
        </>
      }
    >
      <div className="brand login-brand">
        <LogoMark name="quincy-os" size={28} />
        <div className="brand-name">Travel <em>OS</em></div>
      </div>

      {step === 'sent' ? (
        <div className="login-sent">
          <h2 className="login-heading">Check your email</h2>
          <p className="login-sub">
            We sent a link to <strong>{email}</strong>. Click it to sign in — no password needed.
          </p>
          <div className="login-sent-actions">
            <Button variant="ghost"  onClick={() => setStep('form')}>← Different email</Button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="login-heading">Welcome back</h2>
          <p className="login-sub">Sign in to your travel dashboard</p>

          <div className="login-social">
            <button type="button" className="login-social-btn" disabled={busy} onClick={() => void handleSocial('google')}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button type="button" className="login-social-btn" disabled={busy} onClick={() => void handleSocial('apple')}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                <path d="M12.5 0c.07.8-.22 1.6-.7 2.2-.5.63-1.26 1.1-2.04 1.05-.1-.82.25-1.67.73-2.25C11 .42 11.8-.02 12.5 0zM15.9 12.1c-.5 1.1-1.07 2.17-1.77 3.03-.7.87-1.37 1.6-2.32 1.62-.93.03-1.24-.56-2.32-.56-1.07 0-1.4.54-2.28.59-.93.05-1.68-.76-2.38-1.62C3.48 13.4 2.5 11.03 2.5 8.75c0-3.1 2.02-4.74 4.02-4.77 1.01-.02 1.97.68 2.58.68.62 0 1.78-.84 3-.72.51.02 1.94.21 2.86 1.57-.07.05-1.71.99-1.69 2.97.02 2.35 2.06 3.13 2.08 3.14l-.45 1.48z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <div className="login-divider"><span>or</span></div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field">
              <label htmlFor="login-email">Email address</label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div className="login-mode-toggle">
              <button
                type="button"
                className={`chip${mode === 'magic' ? ' on' : ''}`}
                onClick={() => setMode('magic')}
              >
                Magic link
              </button>
              <button
                type="button"
                className={`chip${mode === 'password' ? ' on' : ''}`}
                onClick={() => setMode('password')}
              >
                Password
              </button>
            </div>

            {mode === 'password' && (
              <div className="field">
                <label htmlFor="login-password">Password</label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {step === 'error' && (
              <p role="alert" className="login-error">
                {errorMessage}
              </p>
            )}

            <Button variant="primary" className="login-submit"
              type="submit"
              disabled={!canSubmit || busy}
            >
              {pending === 'submit' ? (
                <span className="login-loading">
                  <span className="parse-dot" />
                  {mode === 'magic' ? 'Sending link…' : 'Signing in…'}
                </span>
              ) : mode === 'magic' ? (
                'Send magic link'
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <p className="login-signup">
            No account?{' '}
            <Button variant="ghost" className="login-signup-btn" >Start free →</Button>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
