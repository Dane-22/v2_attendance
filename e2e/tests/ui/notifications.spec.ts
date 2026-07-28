import { test, expect } from '@playwright/test';

test.describe('Notifications Page UI', () => {
  test('should load the notifications page and display components', async ({ page }) => {
    await page.goto('/dashboard/notifications');

    // Wait for the page title
    await expect(page.locator('h1').filter({ hasText: 'Notifications & Alerts' })).toBeVisible();

    // Verify filter tabs exist
    await expect(page.getByRole('button', { name: 'All' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unread' }).first()).toBeVisible();

    // Wait for notifications to load or the empty state
    const emptyState = page.locator('text=No Notifications Found');
    const notificationCards = page.locator('.divide-y > div');

    // We either have notifications or an empty state
    // Wait for the loading state to disappear
    await expect(page.locator('text=Loading notifications...')).not.toBeVisible({ timeout: 10000 });
    
    // We either have notifications or an empty state
    const isReady = await emptyState.isVisible();
    if (isReady) {
      await expect(emptyState).toBeVisible();
    } else {
      // Check for at least one notification card
      await expect(page.locator('.divide-y > div').first()).toBeVisible();
    }
  });
});
