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

  test('changing the accent recolours what the user sees, and cobalt restores it', async ({ page }) => {
    // Read a real Cobalt button inside the app, not a variable on <html>: the
    // override only counts if it reaches the components.
    const newTrip = page.getByRole('button', { name: /New trip/ });
    const background = () => newTrip.evaluate((el) => getComputedStyle(el).backgroundColor);

    // Cobalt's Button animates its background (120ms), so wait for it to settle.
    await expect.poll(background).toBe('rgb(37, 99, 235)'); // Cobalt #2563EB
    await page.locator('button[title="Emerald"]').click();
    await expect.poll(background).toBe('rgb(31, 138, 91)'); // #1F8A5B
    await page.locator('button[title="Cobalt"]').click();
    await expect.poll(background).toBe('rgb(37, 99, 235)');
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
