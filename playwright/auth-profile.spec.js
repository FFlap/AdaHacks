import { expect, test } from '@playwright/test';

test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, 'E2E credentials are not configured.');

test('signs in and updates the profile', async ({ page }) => {
  const nextBio = `Boundary updated at ${new Date().toISOString()}`;

  await page.goto('/auth');
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(process.env.E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/profile$/);
  await page.getByLabel('Bio').fill(nextBio);
  await page.getByRole('button', { name: /save profile/i }).click();
  await expect(page.getByText('Profile saved.')).toBeVisible();

  await page.reload();
  await expect(page.getByDisplayValue(nextBio)).toBeVisible();
});
