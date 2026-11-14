import { expect, test } from '@playwright/test';

test.describe('TweaksPanel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/pipeline');
    await expect(page.getByText('Travel OS')).toBeVisible();
    await page.getByRole('button', { name: 'Tweaks' }).click();
    await expect(page.locator('.tweaks-panel')).toBeVisible();
  });

  test('renders theme, accent, and density controls', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible();
    await expect(page.locator('.tweaks-panel').getByText('Accent')).toBeVisible();
    await expect(page.locator('.tweaks-panel').getByText('Density')).toBeVisible();
  });

  test('is dark by default, as Cobalt is dark-first', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('switching to light and back updates data-theme on the html element', async ({ page }) => {
    await page.getByRole('button', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('changing the accent overrides Cobalt\'s accent token and cobalt restores it', async ({ page }) => {
    const getAccent = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--accent-default').trim().toLowerCase()
      );

    expect(await getAccent()).toBe('#2563eb');
    await page.locator('button[title="Emerald"]').click();
    expect(await getAccent()).toBe('#1f8a5b');
    await page.locator('button[title="Cobalt"]').click();
    expect(await getAccent()).toBe('#2563eb');
  });

  test('panel closes when Tweaks button is clicked again', async ({ page }) => {
    await page.getByRole('button', { name: 'Tweaks' }).click();
    await expect(page.locator('.tweaks-panel')).not.toBeVisible();
  });

  test('close button dismisses the panel', async ({ page }) => {
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('.tweaks-panel')).not.toBeVisible();
  });
});
