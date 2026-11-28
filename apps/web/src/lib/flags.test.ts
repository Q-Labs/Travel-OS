import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Feature flags are build-time values read from VITE_FLAG_<NAME>. Each is off
// unless it is set to exactly "true". The flag values are fixed when the module
// is first evaluated, so each case resets the module registry and imports it
// again under the environment it wants.

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadFlags(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  return (await import('./flags')).FLAGS;
}

describe('FLAGS', () => {
  it('has every flag off when no value is set', async () => {
    const flags = await loadFlags({ VITE_FLAG_TWEAKS: undefined, VITE_FLAG_SIGNIN_GOOGLE: undefined });
    expect(flags).toEqual({ tweaks: false, signinGoogle: false });
  });

  it('turns on only the flag that is set to true', async () => {
    const flags = await loadFlags({ VITE_FLAG_TWEAKS: 'true' });
    expect(flags.tweaks).toBe(true);
    expect(flags.signinGoogle).toBe(false);
  });

  it('reads each flag from its own variable', async () => {
    const flags = await loadFlags({ VITE_FLAG_SIGNIN_GOOGLE: 'true' });
    expect(flags.signinGoogle).toBe(true);
    expect(flags.tweaks).toBe(false);
  });

  it.each(['TRUE', 'True', '1', 'yes', 'on', 'false', ' true', ''])(
    'keeps a flag off when its value is %j rather than exactly "true"',
    async (value) => {
      const flags = await loadFlags({ VITE_FLAG_TWEAKS: value });
      expect(flags.tweaks).toBe(false);
    },
  );
});

describe('where flags are read', () => {
  const srcRoot = join(__dirname, '..');

  function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return sources(path);
      return /\.tsx?$/.test(name) ? [path] : [];
    });
  }

  it('keeps VITE_FLAG_ in lib/flags.ts and its test only, so components ask the module', () => {
    const readers = sources(srcRoot)
      .filter((path) => readFileSync(path, 'utf8').includes('VITE_FLAG_'))
      .map((path) => path.replace(`${srcRoot}/`, ''))
      .sort();
    expect(readers).toEqual(['lib/flags.test.ts', 'lib/flags.ts']);
  });

  it('names the issue that owns every flag in a comment beside it', () => {
    const lines = readFileSync(join(__dirname, 'flags.ts'), 'utf8').split('\n');
    const flagLines = lines.flatMap((line, index) => (/^\s+\w+:\s*isOn\(/.test(line) ? [index] : []));
    expect(flagLines.length).toBeGreaterThan(0);
    for (const index of flagLines) {
      const above = lines[index - 1]?.trim() ?? '';
      expect(above, `no owning issue above: ${lines[index]?.trim()}`).toMatch(/^\/\/.*#\d+/);
    }
  });
});
