import { test, expect } from '@playwright/test';

test.describe('Payroll Page UI', () => {
  test('should load the payroll page and summary cards', async ({ page }) => {
    await page.goto('/dashboard/payroll');

    // Wait for the page title
    await expect(page.locator('h1').filter({ hasText: 'Weekly payroll runs with review-first controls' })).toBeVisible();

    // Verify summary cards (Gross payroll, Net payroll, etc.)
    await expect(page.locator('text=Gross payroll').first()).toBeVisible();
    await expect(page.locator('text=Net payroll').first()).toBeVisible();

    // Verify the table or empty state loads
    const tableHeader = page.locator('text=Payroll records');
    const emptyState = page.locator('text=No payroll records found for this view yet');
    
    // Wait for either the table or the empty state to appear
    await expect(tableHeader.first().or(emptyState)).toBeVisible({ timeout: 10000 });
    
    const hasEmptyState = await emptyState.isVisible();
    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
    } else {
      await expect(tableHeader.first()).toBeVisible();
    }
  });
});
