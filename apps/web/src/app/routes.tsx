import { redirect } from 'react-router-dom';
import { getSession } from '../lib/db';

/**
 * Sends a visitor with no session to `/login`. A dev server started with
 * `VITE_E2E_BYPASS_AUTH=true` lets everyone through, which is how the
 * end-to-end tests reach signed-in pages without credentials; that check is
 * removed from production builds.
 */
export async function authGuardLoader() {
  /* v8 ignore next -- e2e-only bypass; import.meta.env.DEV is replaced with false in prod builds, dead-code eliminating this branch */
  if (import.meta.env.DEV && import.meta.env['VITE_E2E_BYPASS_AUTH'] === 'true') return {};
  const session = await getSession();
  if (!session) return redirect('/login');
  return {};
}
