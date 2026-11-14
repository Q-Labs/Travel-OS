import { expect, test } from '@playwright/test';

test.describe('Visual snapshots', () => {
  // The dashboard greeting ("Good afternoon") follows the wall clock, so pin it:
  // otherwise the snapshot only matches at the hour it was taken.
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-04-20T14:00:00'));
  });

  test('login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.brand-name')).toBeVisible();
    // Allow mosaic tile animation delays to elapse
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot('login-page.png', { maxDiffPixelRatio: 0.02 });
  });

  test('pipeline dashboard', async ({ page }) => {
    await page.goto('/app/pipeline');
    await expect(page.locator('.tcard-dest', { hasText: 'Kyoto' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('pipeline-dashboard.png', { maxDiffPixelRatio: 0.02 });
  });

  test('inbox dashboard', async ({ page }) => {
    await page.goto('/app/inbox');
    await expect(page.locator('.inbox-row').first()).toBeVisible();
    await expect(page).toHaveScreenshot('inbox-dashboard.png', { maxDiffPixelRatio: 0.02 });
  });

  test('calendar dashboard', async ({ page }) => {
    await page.goto('/app/calendar');
    await expect(page.getByText('Calendar.')).toBeVisible();
    await expect(page).toHaveScreenshot('calendar-dashboard.png', { maxDiffPixelRatio: 0.02 });
  });

  test('archive dashboard', async ({ page }) => {
    await page.goto('/app/archive');
    await expect(page.getByText('Archive.')).toBeVisible();
    await expect(page).toHaveScreenshot('archive-dashboard.png', { maxDiffPixelRatio: 0.02 });
  });

  test('add trip modal step 0', async ({ page }) => {
    await page.goto('/app/pipeline');
    await page.getByRole('button', { name: /New trip/i }).click();
    await expect(page.getByLabel('Destination')).toBeVisible();
    await expect(page).toHaveScreenshot('add-trip-modal-step-0.png', { maxDiffPixelRatio: 0.02 });
  });

  test('add trip modal step 1', async ({ page }) => {
    await page.goto('/app/pipeline');
    await page.getByRole('button', { name: /New trip/i }).click();
    await page.getByLabel('Destination').fill('Porto');
    await page.getByLabel('Country').fill('Portugal');
    await page.getByRole('button', { name: 'Next →' }).click();
    await expect(page.getByText('who and what')).toBeVisible();
    await expect(page).toHaveScreenshot('add-trip-modal-step-1.png', { maxDiffPixelRatio: 0.02 });
  });

  test('add trip modal step 2', async ({ page }) => {
    await page.goto('/app/pipeline');
    await page.getByRole('button', { name: /New trip/i }).click();
    await page.getByLabel('Destination').fill('Porto');
    await page.getByLabel('Country').fill('Portugal');
    await page.getByRole('button', { name: 'Next →' }).click();
    await page.locator('.cat-pick').first().locator('.c').first().click();
    await page.getByRole('button', { name: 'Next →' }).click();
    await expect(page.getByText('first details')).toBeVisible();
    await expect(page).toHaveScreenshot('add-trip-modal-step-2.png', { maxDiffPixelRatio: 0.02 });
  });

  test('tweaks panel open', async ({ page }) => {
    await page.goto('/app/pipeline');
    await page.getByRole('button', { name: 'Tweaks' }).click();
    await expect(page.locator('.tweaks-panel')).toBeVisible();
    await expect(page).toHaveScreenshot('tweaks-panel.png', { maxDiffPixelRatio: 0.02 });
  });
});
