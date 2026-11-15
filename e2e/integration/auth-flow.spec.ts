import { expect, test } from '@playwright/test';

test.describe('Login page', () => {
  test('renders email input, mode chips, and social buttons', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Magic link', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Apple/i })).toBeVisible();
    await expect(page.locator('.brand-name')).toBeVisible();
  });

  test('switching to Password mode shows password field and Sign in button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Password')).not.toBeVisible();
    await page.getByRole('button', { name: 'Password' }).click();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Sign in$/ })).toBeVisible();
  });

  test('submit button is disabled without an email and, in password mode, a password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Password' }).click();
    await expect(page.getByRole('button', { name: /^Sign in$/ })).toBeDisabled();
    await page.getByLabel('Email address').fill('test@example.com');
    // a password is required too
    await expect(page.getByRole('button', { name: /^Sign in$/ })).toBeDisabled();
    await page.getByLabel('Password').fill('hunter2');
    await expect(page.getByRole('button', { name: /^Sign in$/ })).toBeEnabled();
  });

  test('mosaic tiles are rendered with destination labels', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Kyoto')).toBeVisible();
    await expect(page.getByText('Iceland')).toBeVisible();
    await expect(page.getByText('Lisbon')).toBeVisible();
  });
});
