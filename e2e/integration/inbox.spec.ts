import { expect, test } from '@playwright/test';

test.describe('Inbox dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/inbox');
    await expect(page.getByText('Inbox.')).toBeVisible();
  });

  test('renders inbox items from fixture data', async ({ page }) => {
    const rows = page.locator('.inbox-row');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('dismissing an item removes it from the list', async ({ page }) => {
    const rows = page.locator('.inbox-row');
    const initialCount = await rows.count();
    await page.getByRole('button', { name: /Dismiss/i }).first().click();
    await expect(rows).toHaveCount(initialCount - 1);
  });

  test('inbox count in sidebar matches rendered items', async ({ page }) => {
    const rows = page.locator('.inbox-row');
    const rowCount = await rows.count();
    // the Inbox link carries its count as a badge: "Inbox 6"
    const inboxLink = page.getByRole('link', { name: /^Inbox/ });
    await expect(inboxLink).toContainText(String(rowCount));
  });

  test('inbox subtitle shows correct item count', async ({ page }) => {
    const rows = page.locator('.inbox-row');
    const rowCount = await rows.count();
    await expect(page.getByText(`${rowCount} items`)).toBeVisible();
  });
});
