---
name: verify
description: Run-and-drive recipe for runtime-verifying changes to Travel OS (a React + Vite single-page app on Supabase; the dev server with a sign-in bypass is what there is to drive).
---

# Verifying Travel OS at runtime

Green unit tests are necessary, not sufficient. Before opening a PR, run the change in the app and look at it. These are the steps that worked.

## Why the dev server, not the built bundle

The sign-in bypass (`VITE_E2E_BYPASS_AUTH=true`) is gated by `import.meta.env.DEV` and is removed from production builds. A `vite preview` of `dist/` shows only the login page, so every signed-in screen is reachable only through the dev server. The Playwright suite does the same: its `webServer` runs `npm run dev` with the bypass on port 5173.

## Build check

```bash
npm run build          # tsc -b, then vite build into dist/
```

This proves the production bundle compiles. It does not prove the screens work.

## Serve and drive

```bash
VITE_E2E_BYPASS_AUTH=true npm run dev -- --port 5173 --strictPort > /tmp/dev.log 2>&1 &
until [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5173/)" = 200 ]; do sleep 1; done
```

Stop it with `pkill -f "[v]ite --port 5173"`. The brackets matter: a bare pattern also matches the shell running the command and kills it.

In a cloud session Chromium is pre-installed at `/opt/pw-browsers/chromium`. Do not run `playwright install`. This repo pins its own Playwright version, which looks for a different browser build, so pass the path explicitly. From the repo root:

```bash
node --input-type=module <<'JS'
import { chromium } from '@playwright/test'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto('http://127.0.0.1:5173/')   // redirects to /app/pipeline
// click through the change, assert what you expect, then:
await page.screenshot({ path: '/tmp/verify.png' })
await browser.close()
JS
```

Run the script from the repo root so `@playwright/test` resolves. Put the screenshot outside the repo.

## The Playwright suite

`npm run test:e2e` runs `e2e/integration` and `e2e/visual` (nine snapshots, Chromium, 1280 × 800). On a normal machine, install the browser once with `npx playwright install chromium`. In a cloud session the suite uses Playwright's own browser path, which is not the pre-installed build, so it may not launch there; I have not tried installing it. CI runs it, so a green `playwright` job on the PR counts. After an intentional UI change, regenerate baselines with `npx playwright test --update-snapshots e2e/visual/` and commit the PNGs with the reason.

## What to check

Routes: `/app/pipeline`, `/app/inbox`, `/app/calendar`, `/app/archive`, `/app/trip/<id>` (for example `/app/trip/tr-lisbon`). Fixture data comes from `apps/web/src/lib/data.ts` when no Supabase credentials are set.

1. **Pipeline board:** open `/app/pipeline`. The kanban columns render with trip cards. Click a card: it opens that trip's detail page and the tabs switch.
2. **Navigation:** the sidebar links go to Inbox, Calendar and Archive, the page heading changes, and the active link follows the route.
3. **The screen you changed:** drive it as a user would, including empty and error states, and take a screenshot.
4. **Appearance:** open the Tweaks panel and check the change in both dark (the default) and light.

For a UI change, check it against the Front-End Checklist and fix Critical and High findings from this change.

## What this sandbox cannot do

- There are no Supabase credentials here, so the real sign-in, the Realtime updates and every write to the database cannot be tried. The bypass skips auth and the app runs on fixtures.
- The serverless functions in `api/` (inbox ingest, insights refresh, calendar feed) are covered by their unit tests only. Outbound internet is allow-listed, so the Claude API and Open-Meteo calls cannot be tried live.
- Nothing here checks migrations against a real Postgres. Do not claim that for a change under `supabase/`.

Say which of these you could not check when you write the Verification section of the PR.

## Clean up

Stop the dev server. `git status` must show only the files you meant to change. Remove any temporary route, flag or script you added for the check.
