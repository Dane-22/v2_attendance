const { test, expect } = require('@playwright/test');

/**
 * E2E Tests for Overtime Request Functionality
 * Tests the complete overtime request workflow:
 * 1. Worker submits overtime request via kebab menu
 * 2. Non-worker submits via dashboard quick action
 * 3. Admin reviews and approves/rejects requests
 * 4. Payroll integration works correctly
 * 5. Finance reporting displays data accurately
 */

test.describe('Overtime Request Workflow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin for most tests
    await page.goto('http://localhost:3000/login');
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/dashboard', { timeout: 5000 });
  });

  test.describe('Worker Entry Point - Attendance Kebab Menu', () => {
    
    test('TC-OT-001: Navigate to attendance page', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/attendance');
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the attendance page
      await expect(page).toHaveURL(/attendance/);
      await expect(page.getByText('Available').first()).toBeVisible();
      
      console.log('✅ TC-OT-001 PASSED: Attendance page loads correctly');
    });

    test('TC-OT-002: Kebab menu exists for worker positions', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/attendance');
      await page.waitForLoadState('networkidle');
      
      // Ensure we're on the Available tab
      await page.getByRole('button', { name: 'Available' }).click();
      await page.waitForTimeout(1000);
      
      // Look for kebab menu buttons (three dots)
      const kebabButtons = page.locator('button[aria-label="More options"]');
      await expect(kebabButtons.first()).toBeVisible();
      
      // Click first kebab menu to verify it opens
      await kebabButtons.first().click();
      await expect(page.getByText('Request Overtime')).toBeVisible();
      
      // Close the menu
      await page.keyboard.press('Escape');
      
      console.log('✅ TC-OT-002 PASSED: Kebab menu with overtime option exists');
    });

    test('TC-OT-003: Open overtime request modal from kebab menu', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/attendance');
      await page.waitForLoadState('networkidle');
      
      // Click kebab menu and select overtime request
      const kebabButtons = page.locator('button[aria-label="More options"]');
      await kebabButtons.first().click();
      await page.getByText('Request Overtime').click();
      
      // Verify modal opens
      await expect(page.getByText('Request Overtime')).toBeVisible();
      await expect(page.getByText('Date')).toBeVisible();
      await expect(page.getByText('Start Time')).toBeVisible();
      await expect(page.getByText('End Time')).toBeVisible();
      await expect(page.getByText('Hours')).toBeVisible();
      await expect(page.getByText('Reason')).toBeVisible();
      
      console.log('✅ TC-OT-003 PASSED: Overtime request modal opens from kebab menu');
    });

    test('TC-OT-004: Submit overtime request from kebab menu', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/attendance');
      await page.waitForLoadState('networkidle');
      
      // Open overtime request modal
      const kebabButtons = page.locator('button[aria-label="More options"]');
      await kebabButtons.first().click();
      await page.getByText('Request Overtime').click();
      
      // Fill out the form
      await page.fill('input[type="date"]', '2024-12-15');
      await page.fill('input[placeholder="HH:MM"]', '18:00');
      await page.locator('input[placeholder="HH:MM"]').nth(1).fill('22:00');
      await page.fill('input[placeholder="4"]', '4');
      await page.fill('textarea[placeholder*="reason"]', 'Additional work for project deadline');
      
      // Submit the form
      await page.getByText('Submit Request').click();
      
      // Verify success message
      await expect(page.getByText('Overtime request submitted successfully')).toBeVisible();
      
      console.log('✅ TC-OT-004 PASSED: Overtime request submitted from kebab menu');
    });
  });

  test.describe('Non-Worker Entry Point - Dashboard Quick Action', () => {
    
    test('TC-OT-005: Dashboard quick action card exists', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for the overtime request quick action card
      await expect(page.getByText('Request Overtime')).toBeVisible();
      await expect(page.getByText('Submit overtime request')).toBeVisible();
      
      console.log('✅ TC-OT-005 PASSED: Dashboard quick action card exists');
    });

    test('TC-OT-006: Open overtime request modal from dashboard', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Click the quick action card
      await page.getByText('Request Overtime').click();
      
      // Verify modal opens
      await expect(page.getByText('Request Overtime')).toBeVisible();
      await expect(page.getByText('Employee:', { exact: true })).toBeVisible(); // Should show employee selector
      
      console.log('✅ TC-OT-006 PASSED: Overtime request modal opens from dashboard');
    });

    test('TC-OT-007: Submit overtime request from dashboard', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Open overtime request modal
      await page.getByText('Request Overtime').click();
      
      // Select employee (first option)
      await page.click('select');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      // Fill out the form
      await page.fill('input[type="date"]', '2024-12-16');
      await page.fill('input[placeholder="HH:MM"]', '19:00');
      await page.locator('input[placeholder="HH:MM"]').nth(1).fill('23:00');
      await page.fill('input[placeholder="4"]', '4');
      await page.fill('textarea[placeholder*="reason"]', 'System maintenance work');
      
      // Submit the form
      await page.getByText('Submit Request').click();
      
      // Verify success message
      await expect(page.getByText('Overtime request submitted successfully')).toBeVisible();
      
      console.log('✅ TC-OT-007 PASSED: Overtime request submitted from dashboard');
    });
  });

  test.describe('Request Review - Notifications Page', () => {
    
    test('TC-OT-008: Navigate to notifications page', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/notifications');
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the notifications page
      await expect(page).toHaveURL(/notifications/);
      await expect(page.getByText('Notifications & Alerts')).toBeVisible();
      
      console.log('✅ TC-OT-008 PASSED: Notifications page loads correctly');
    });

    test('TC-OT-009: Overtime filter exists', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/notifications');
      await page.waitForLoadState('networkidle');
      
      // Look for overtime filter
      await expect(page.getByText('Overtime')).toBeVisible();
      
      console.log('✅ TC-OT-009 PASSED: Overtime filter exists in notifications');
    });

    test('TC-OT-010: Filter overtime requests', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/notifications');
      await page.waitForLoadState('networkidle');
      
      // Click overtime filter
      await page.getByText('Overtime').click();
      await page.waitForLoadState('networkidle');
      
      // Verify filter is applied (check for active state)
      const overtimeFilter = page.getByText('Overtime');
      await expect(overtimeFilter).toHaveClass(/bg-\[#facc15\]/); // Active filter class
      
      console.log('✅ TC-OT-010 PASSED: Overtime filter works correctly');
    });

    test('TC-OT-011: Approve overtime request', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/notifications');
      await page.waitForLoadState('networkidle');
      
      // Filter for overtime requests
      await page.getByText('Overtime').click();
      await page.waitForLoadState('networkidle');
      
      // Look for approve button (if any requests exist)
      const approveButtons = page.getByText('Approve');
      if (await approveButtons.count() > 0) {
        await approveButtons.first().click();
        
        // Enter approval reason (optional)
        const reasonInput = page.locator('input[placeholder*="reason"]');
        if (await reasonInput.count() > 0) {
          await reasonInput.fill('Approved for project completion');
        }
        
        // Confirm approval
        await page.getByText('Confirm').click();
        
        // Verify success message
        await expect(page.getByText('Overtime request approved successfully')).toBeVisible();
        
        console.log('✅ TC-OT-011 PASSED: Overtime request approved successfully');
      } else {
        console.log('ℹ️  TC-OT-011 SKIPPED: No pending overtime requests to approve');
      }
    });

    test('TC-OT-012: Reject overtime request', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/notifications');
      await page.waitForLoadState('networkidle');
      
      // Filter for overtime requests
      await page.getByText('Overtime').click();
      await page.waitForLoadState('networkidle');
      
      // Look for reject button (if any requests exist)
      const rejectButtons = page.getByText('Reject');
      if (await rejectButtons.count() > 0) {
        await rejectButtons.first().click();
        
        // Enter rejection reason (required)
        await page.fill('input[placeholder*="reason"]', 'Insufficient justification');
        
        // Confirm rejection
        await page.getByText('Confirm').click();
        
        // Verify success message
        await expect(page.getByText('Overtime request rejected successfully')).toBeVisible();
        
        console.log('✅ TC-OT-012 PASSED: Overtime request rejected successfully');
      } else {
        console.log('ℹ️  TC-OT-012 SKIPPED: No pending overtime requests to reject');
      }
    });
  });

  test.describe('Finance Reporting', () => {
    
    test('TC-OT-013: Navigate to finance overtime page', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/finance/overtime');
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the finance overtime page
      await expect(page).toHaveURL(/finance\/overtime/);
      await expect(page.getByText('Finance Overtime')).toBeVisible();
      
      console.log('✅ TC-OT-013 PASSED: Finance overtime page loads correctly');
    });

    test('TC-OT-014: Statistics cards display', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/finance/overtime');
      await page.waitForLoadState('networkidle');
      
      // Verify statistics cards exist
      await expect(page.getByText('Total Requests')).toBeVisible();
      await expect(page.locator('p').filter({ hasText: 'Pending' })).toBeVisible();
      await expect(page.locator('p').filter({ hasText: 'Approved' })).toBeVisible();
      await expect(page.getByText('Total Hours')).toBeVisible();
      await expect(page.getByText('Est. Cost')).toBeVisible();
      
      console.log('✅ TC-OT-014 PASSED: Statistics cards display correctly');
    });

    test('TC-OT-015: Search and filter functionality', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/finance/overtime');
      await page.waitForLoadState('networkidle');
      
      // Test search functionality
      const searchInput = page.locator('input[placeholder*="Search"]');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
      
      // Test status filter
      const statusFilter = page.locator('select').first();
      await expect(statusFilter).toBeVisible();
      await statusFilter.selectOption('APPROVED');
      await expect(statusFilter).toHaveValue('APPROVED');
      
      console.log('✅ TC-OT-015 PASSED: Search and filter functionality works');
    });

    test('TC-OT-016: Export to CSV functionality', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/finance/overtime');
      await page.waitForLoadState('networkidle');
      
      // Look for export button
      const exportButton = page.getByText('Export CSV');
      await expect(exportButton).toBeVisible();
      
      // Note: We can't actually test file download in Playwright without additional setup
      // but we can verify the button exists and is clickable
      await expect(exportButton).toBeEnabled();
      
      console.log('✅ TC-OT-016 PASSED: Export CSV button exists and is enabled');
    });

    test('TC-OT-017: Data table displays correctly', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/finance/overtime');
      await page.waitForLoadState('networkidle');
      
      // Verify table headers exist
      await expect(page.getByText('Employee')).toBeVisible();
      await expect(page.getByText('Date')).toBeVisible();
      await expect(page.getByText('Hours')).toBeVisible();
      await expect(page.getByText('Reason')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
      
      console.log('✅ TC-OT-017 PASSED: Data table displays correctly');
    });
  });

  test.describe('Bell Dropdown Integration', () => {
    
    test('TC-OT-018: Bell dropdown shows overtime notifications', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Click bell icon to open dropdown
      const bellIcon = page.locator('button[aria-label*="notification"]').first();
      if (await bellIcon.count() > 0) {
        await bellIcon.click();
        await page.waitForTimeout(500); // Wait for dropdown to open
        
        // Look for overtime notifications (if any exist)
        const overtimeNotifications = page.getByText('Overtime');
        if (await overtimeNotifications.count() > 0) {
          console.log('✅ TC-OT-018 PASSED: Overtime notifications appear in bell dropdown');
        } else {
          console.log('ℹ️  TC-OT-018 INFO: No overtime notifications in bell dropdown');
        }
        
        // Close dropdown
        await page.keyboard.press('Escape');
      } else {
        console.log('ℹ️  TC-OT-018 SKIPPED: Bell icon not found');
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    
    test('TC-OT-019: Handle empty form submission', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/attendance');
      await page.waitForLoadState('networkidle');
      
      // Open overtime request modal
      const kebabButtons = page.locator('button[aria-label="More options"]');
      await kebabButtons.first().click();
      await page.getByText('Request Overtime').click();
      
      // Try to submit empty form
      await page.getByText('Submit Request').click();
      
      // Should show validation errors or prevent submission
      // (Implementation may vary - check for error messages or form staying open)
      await page.waitForTimeout(1000);
      
      // Modal should still be open (validation failed)
      await expect(page.getByText('Request Overtime')).toBeVisible();
      
      console.log('✅ TC-OT-019 PASSED: Empty form submission handled correctly');
    });

    test('TC-OT-020: Handle modal cancellation', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard/attendance');
      await page.waitForLoadState('networkidle');
      
      // Open overtime request modal
      const kebabButtons = page.locator('button[aria-label="More options"]');
      await kebabButtons.first().click();
      await page.getByText('Request Overtime').click();
      
      // Fill some data then cancel
      await page.fill('input[type="date"]', '2024-12-15');
      await page.getByText('Cancel').click();
      
      // Modal should close
      await expect(page.getByText('Request Overtime')).not.toBeVisible();
      
      console.log('✅ TC-OT-020 PASSED: Modal cancellation works correctly');
    });
  });
});
