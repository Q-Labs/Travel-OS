import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Handbook D26: every component has a story file beside it, so its states can
// be seen in Storybook. This guard fails when a component is added without one,
// the same way layers.test.ts fails on an upward import.

const here = __dirname;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const isComponent = (path: string) => /\.tsx$/.test(path) && !/\.(test|stories)\./.test(path);

/** The components in `paths` that have no `Name.stories.tsx` beside them. */
export function missingStories(paths: string[]): string[] {
  const stories = new Set(paths.filter((p) => /\.stories\.tsx$/.test(p)));
  return paths.filter(isComponent).filter((p) => !stories.has(p.replace(/\.tsx$/, '.stories.tsx')));
}

describe('component stories', () => {
  it('flags a component with no story and allows one that has a story', () => {
    const all = ['/c/atoms/Icon.tsx', '/c/atoms/Icon.stories.tsx', '/c/atoms/CatPip.tsx', '/c/atoms/CatPip.test.tsx'];
    expect(missingStories(all)).toEqual(['/c/atoms/CatPip.tsx']);
    expect(missingStories(['/c/atoms/Icon.tsx', '/c/atoms/Icon.stories.tsx'])).toEqual([]);
  });

  it('ignores tests, stories and files that are not components', () => {
    expect(missingStories(['/c/a.test.tsx', '/c/b.stories.tsx', '/c/layers.test.ts', '/c/c.ts'])).toEqual([]);
  });

  it('gives every component under components/ a story file beside it', () => {
    const missing = missingStories(files(here)).map((p) => relative(here, p));
    expect(missing, `components with no story: ${missing.join(', ')}`).toEqual([]);
  });
});
