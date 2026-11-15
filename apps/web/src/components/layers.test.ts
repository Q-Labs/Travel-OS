import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Atomic design: a component may import from its own level or below, never
// above (an organism may compose organisms; an atom may not use a molecule).
const LEVELS = ['atoms', 'molecules', 'organisms', 'templates', 'pages'] as const;
const here = __dirname;

const levelOf = (path: string) => LEVELS.indexOf(relative(here, path).split('/')[0] as (typeof LEVELS)[number]);

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

/** Imports in `text` (from file `from`) that point at a higher level. */
export function upwardImports(from: string, text: string): string[] {
  const own = levelOf(from);
  return [...text.matchAll(/from '(\.{1,2}\/[^']+)'/g)]
    .map((m) => m[1])
    .filter((spec) => levelOf(resolve(dirname(from), spec)) > own);
}

describe('component layering', () => {
  it('flags an import from a higher level and allows the same level or below', () => {
    const molecule = join(here, 'molecules', 'Example.tsx');
    expect(upwardImports(molecule, "import { TripCard } from '../organisms/TripCard';")).toEqual(['../organisms/TripCard']);
    expect(upwardImports(molecule, "import { Avatars } from './Avatars';\nimport { Icon } from '../atoms/Icon';")).toEqual([]);
    expect(upwardImports(molecule, "import { fmtMoney } from '../../lib/utils';")).toEqual([]);
  });

  it('no component imports from a level above its own', () => {
    const offenders = LEVELS.flatMap((level) =>
      sources(join(here, level)).flatMap((file) =>
        upwardImports(file, readFileSync(file, 'utf8')).map((spec) => `${relative(here, file)} → ${spec}`),
      ),
    );
    expect(offenders).toEqual([]);
  });
});
