import { expect, test } from '@playwright/test';

test('renders the viewer shell without private configuration', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('WaterTelemetry')).toBeVisible();
  await expect(page.getByText('Viewer Demo')).toBeVisible();
  await expect(page.getByText('Read-only', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
});

test('supports the reference light theme without leaving the Viewer scope', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('.app-shell')).toHaveClass(/theme-light/);
  await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
});
