import { expect, test } from '@playwright/test';

test.describe('Pipeline dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/pipeline');
    await expect(page.getByText('Travel OS')).toBeVisible();
  });

  test('renders fixture trip cards in kanban board', async ({ page }) => {
    await expect(page.locator('.tcard-dest', { hasText: 'Kyoto' })).toBeVisible();
    await expect(page.locator('.tcard-dest', { hasText: 'Lisbon' })).toBeVisible();
    await expect(page.locator('.tcard-dest', { hasText: 'Reykjavík' })).toBeVisible();
  });

  test('renders pipeline stage column headers', async ({ page }) => {
    await expect(page.locator('.pipeline .name', { hasText: 'Dreaming' })).toBeVisible();
    await expect(page.locator('.pipeline .name', { hasText: 'Planning' })).toBeVisible();
    await expect(page.locator('.pipeline .name', { hasText: 'Booked' })).toBeVisible();
    await expect(page.locator('.pipeline .name', { hasText: 'Upcoming' })).toBeVisible();
  });

  test('renders metrics strip', async ({ page }) => {
    await expect(page.locator('.metrics').getByText('Next trip')).toBeVisible();
    await expect(page.locator('.metrics').getByText('Active plans')).toBeVisible();
    await expect(page.locator('.metrics').getByText('Trips in motion', { exact: true })).toBeVisible();
  });

  test('search filters trip cards in board and clearing restores them', async ({ page }) => {
    await page.getByPlaceholder('Search destinations…').fill('Lisbon');
    await expect(page.locator('.tcard-dest', { hasText: 'Kyoto' })).not.toBeVisible();
    await page.getByPlaceholder('Search destinations…').clear();
    await expect(page.locator('.tcard-dest', { hasText: 'Kyoto' })).toBeVisible();
  });

  test('category filter hides non-matching trip cards', async ({ page }) => {
    await page.getByRole('complementary').getByRole('button', { name: /Family/ }).click();
    await expect(page.locator('.tcard-dest', { hasText: 'Marrakech' })).not.toBeVisible();
    // Toggle off filter
    await page.getByRole('complementary').getByRole('button', { name: /Family/ }).click();
    await expect(page.locator('.tcard-dest', { hasText: 'Marrakech' })).toBeVisible();
  });

  test('add trip modal full 3-step workflow creates a new trip card', async ({ page }) => {
    await page.getByRole('button', { name: /New trip/i }).click();

    // Step 0: destination details
    await expect(page.getByLabel('Destination')).toBeVisible();
    await page.getByLabel('Destination').fill('Porto');
    await page.getByLabel('Country').fill('Portugal');
    await page.getByRole('button', { name: 'Next →' }).click();

    // Step 1: categories and travelers — click first category chip
    await expect(page.getByText('who and what')).toBeVisible();
    await page.locator('.cat-pick').first().locator('.c').first().click();
    await page.getByRole('button', { name: 'Next →' }).click();

    // Step 2: budget confirmation
    await expect(page.getByText('first details')).toBeVisible();
    await page.getByLabel('Rough budget').fill('4000');
    await page.getByRole('button', { name: 'Add trip' }).click();

    // Modal closes and the new trip appears in Dreaming column
    await expect(page.getByLabel('Destination')).not.toBeVisible();
    await expect(page.locator('.tcard-dest', { hasText: 'Porto' })).toBeVisible();
  });

  test('add trip modal Next is disabled on step 0 until required fields are filled', async ({ page }) => {
    await page.getByRole('button', { name: /New trip/i }).click();
    const nextBtn = page.getByRole('button', { name: 'Next →' });
    await expect(nextBtn).toBeDisabled();
    await page.getByLabel('Destination').fill('Porto');
    await expect(nextBtn).toBeDisabled();
    await page.getByLabel('Country').fill('Portugal');
    await expect(nextBtn).toBeEnabled();
  });

  test('add trip modal can be cancelled at step 0', async ({ page }) => {
    await page.getByRole('button', { name: /New trip/i }).click();
    await expect(page.getByLabel('Destination')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByLabel('Destination')).not.toBeVisible();
  });
});
