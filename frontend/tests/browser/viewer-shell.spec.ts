import { expect, test } from '@playwright/test';

test('renders the viewer shell without private configuration', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('WaterTelemetry')).toBeVisible();
  await expect(page.getByText('Viewer Demo')).toBeVisible();
  await expect(page.getByText('Read-only', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
});
