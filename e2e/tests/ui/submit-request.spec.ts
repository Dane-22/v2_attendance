import { test, expect } from '@playwright/test';

test.describe('Submit Overtime Request UI', () => {
  test('should successfully submit an overtime request', async ({ page }) => {
    // Mock the backend API for overtime request
    await page.route('**/api/overtime-requests', async (route) => {
      console.log('MOCK HIT: overtime-requests');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Overtime request created successfully',
          data: { id: 999, status: 'PENDING' }
        })
      });
    });

    // Navigate to the submit request page
    await page.goto('/dashboard/submit-request');

    // Wait for the page to load
    await expect(page.locator('h1').filter({ hasText: 'Submit Request' })).toBeVisible();

    // Wait for React to hydrate completely
    await page.waitForTimeout(3000);

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    // Select the employee using the autocomplete input
    const employeeInput = page.getByPlaceholder('Start typing employee name...');
    await employeeInput.fill('Test Employee');
    
    // Fill in Date (future date to avoid duplicate errors)
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 100) + 1);
    const dateStr = date.toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(dateStr);

    // Fill in Start Time and End Time
    const timeInputs = page.locator('input[type="time"]');
    await timeInputs.nth(0).fill('17:00');
    await timeInputs.nth(1).fill('19:00');

    // Fill in Reason
    await page.locator('textarea').fill('E2E UI Testing Reason');

    // Submit the form
    await page.getByRole('button', { name: 'Submit Overtime Request' }).click();

    // Expect the success toast
    const successToast = page.locator('h3', { hasText: 'Overtime Request Submitted Successfully' });
    await expect(successToast).toBeVisible({ timeout: 10000 });
  });
});
