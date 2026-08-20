import { expect, test } from '@playwright/test';

test('renders the viewer shell without private configuration', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('WATER OPERATIONS INTELLIGENCE')).toBeVisible();
  await expect(page.getByText('ASP.NET Core 10')).toBeVisible();
});
