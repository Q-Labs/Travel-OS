import { redirect } from 'react-router-dom';
import { getSession } from '../lib/db';

// No-op kept for router.tsx compatibility; AppLayout reads from AppContext instead.
export const tripsLoader = () => ({});

export async function authGuardLoader() {
  /* v8 ignore next -- e2e-only bypass; import.meta.env.DEV is replaced with false in prod builds, dead-code eliminating this branch */
  if (import.meta.env.DEV && import.meta.env['VITE_E2E_BYPASS_AUTH'] === 'true') return {};
  const session = await getSession();
  if (!session) return redirect('/login');
  return {};
}
