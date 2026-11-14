import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Travel OS uses the Cobalt design system (@q-labs/cobalt). These guards fail
// when someone hand-rolls UI that Cobalt already provides, so the app cannot
// quietly grow a second design system again.

const here = __dirname;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

const files = sources(here).map((path) => ({ path: path.replace(`${here}/`, ''), text: readFileSync(path, 'utf8') }));

const hits = (pattern: RegExp) => files.filter((f) => pattern.test(f.text)).map((f) => f.path);

describe('Cobalt design system usage', () => {
  it.each([
    ['Button', /className=(\{`|")btn[ "`]/],
    ['Input', /<input\b/],
    ['ProgressMini', /className="mini-progress"/],
    ['Avatar', /className="(av|avatar)"/],
    ['NavItem', /className=\{?[^>]*nav-item/],
    ['Sidebar', /<aside className="sidebar"/],
    ['Topbar', /className="topbar"/],
    ['DashboardLayout', /className="app"/],
    ['LogoMark', /className="brand-mark"/],
    ['MetricCard', /className="metric[ "]/],
  ])('hand-rolls no replacement for Cobalt %s', (_component, pattern) => {
    expect(hits(pattern)).toEqual([]);
  });

  it('keeps no local copy of a component Cobalt provides', () => {
    const local = files.map((f) => f.path);
    expect(local.filter((p) => /(^|\/)(MiniProgress|Avatar|MetricTile|AppShell)\.tsx$/.test(p))).toEqual([]);
  });
});
