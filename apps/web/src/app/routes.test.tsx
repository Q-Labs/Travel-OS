import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/db', () => ({
  getSession: vi.fn(),
}));

import { getSession } from '../lib/db';
import { authGuardLoader } from './routes';

describe('authGuardLoader', () => {
  it('returns {} when a session exists', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { id: 'u1' } } as Awaited<ReturnType<typeof getSession>>);
    expect(await authGuardLoader()).toEqual({});
  });

  it('returns a redirect Response when no session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const result = await authGuardLoader();
    expect(result).toBeInstanceOf(Response);
  });
});
