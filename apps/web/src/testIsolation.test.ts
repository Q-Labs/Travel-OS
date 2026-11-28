import { describe, expect, it, vi } from 'vitest';

// A test that fails after installing a spy or a stub must not leave it in place
// for the next test, or one real failure shows up as several confusing ones.
// vite.config.ts sets restoreMocks and unstubGlobals so that nothing has to
// remember to undo its own spies; these tests fail if that setting goes.
describe('spies and stubs do not outlive a failing test', () => {
  it.fails('installs a spy and a stub, then fails before cleaning up', () => {
    vi.spyOn(window, 'setTimeout');
    vi.stubGlobal('fetch', vi.fn());
    expect(true).toBe(false);
  });

  it('finds the real setTimeout again in the next test', () => {
    expect(vi.isMockFunction(window.setTimeout)).toBe(false);
  });

  it('finds the real fetch again in the next test', () => {
    expect(vi.isMockFunction(globalThis.fetch)).toBe(false);
  });
});
