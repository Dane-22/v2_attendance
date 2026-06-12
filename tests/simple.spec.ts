const { test, expect } = require('@playwright/test');

test('simple test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/Attendance/);
});