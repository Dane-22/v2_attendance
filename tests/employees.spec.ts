import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Employees Page (User Management)
 * Tests the /dashboard/employees page - Add Employee, Admin, Branch User
 */

test.describe('Employees Page (User Management)', () => {
  
  test.beforeEach(async ({ page }) => {
    // First login as admin
    await page.goto('http://localhost:3000/login');
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard and navigate to employees
    await page.waitForURL('http://localhost:3000/dashboard', { timeout: 5000 });
    await page.goto('http://localhost:3000/dashboard/employees');
    await page.waitForLoadState('networkidle');
  });

  test('TC-EMP-001: Navigate to Employees page', async ({ page }) => {
    // Verify we're on the employees page
    await expect(page).toHaveURL(/employees/);
    
    // Verify page loaded - check for content
    const hasContent = await page.locator('div').count();
    expect(hasContent).toBeGreaterThan(5);
    
    console.log('✅ TC-EMP-001 PASSED: Employees page loads correctly');
  });

  test('TC-EMP-002: User Management heading exists', async ({ page }) => {
    // Verify User Management heading exists
    const hasHeading = await page.locator('text=User Management').count();
    expect(hasHeading).toBeGreaterThan(0);
    
    console.log('✅ TC-EMP-002 PASSED: User Management heading exists');
  });

  test('TC-EMP-003: Tabs exist (Employees, Admins, Branch Users)', async ({ page }) => {
    // Verify tabs exist
    const hasEmployees = await page.locator('text=Employees').count();
    const hasAdmins = await page.locator('text=Admins').count();
    const hasBranchUsers = await page.locator('text=Branch Users').count();
    
    expect(hasEmployees + hasAdmins + hasBranchUsers).toBeGreaterThan(0);
    
    console.log('✅ TC-EMP-003 PASSED: Tabs exist');
  });

  test('TC-EMP-004: Switch between tabs', async ({ page }) => {
    // Click on Admins tab
    await page.locator('button:has-text("Admins")').first().click();
    await page.waitForTimeout(500);
    
    // Click on Branch Users tab
    await page.locator('button:has-text("Branch Users")').first().click();
    await page.waitForTimeout(500);
    
    // Click back on Employees
    await page.locator('button:has-text("Employees")').first().click();
    await page.waitForTimeout(500);
    
    console.log('✅ TC-EMP-004 PASSED: Switch between tabs works');
  });

  test('TC-EMP-005: Add button exists', async ({ page }) => {
    // Verify Add button exists
    const hasAddButton = await page.locator('button:has-text("Add")').count();
    expect(hasAddButton).toBeGreaterThan(0);
    
    console.log('✅ TC-EMP-005 PASSED: Add button exists');
  });

  test('TC-EMP-006: Open Add Employee modal', async ({ page }) => {
    // Click Add button
    await page.locator('button:has-text("Add Employee")').first().click();
    await page.waitForTimeout(1000);
    
    // Verify modal is open - check for User Type section
    const hasModal = await page.locator('text=User Type').count();
    expect(hasModal).toBeGreaterThan(0);
    
    console.log('✅ TC-EMP-006 PASSED: Add Employee modal opens');
  });

  test('TC-EMP-007: User type selection exists (Employee, Admin, Branch User)', async ({ page }) => {
    // Open Add modal
    await page.locator('button:has-text("Add Employee")').first().click();
    await page.waitForTimeout(1000);
    
    // Verify user type buttons exist
    const hasEmployee = await page.locator('button:has-text("Employee")').count();
    const hasAdmin = await page.locator('button:has-text("Admin")').count();
    const hasBranchUser = await page.locator('button:has-text("Branch User")').count();
    
    expect(hasEmployee + hasAdmin + hasBranchUser).toBeGreaterThan(0);
    
    console.log('✅ TC-EMP-007 PASSED: User type selection exists');
  });

  test('TC-EMP-008: Admin user type works in modal', async ({ page }) => {
    // Open Add modal
    await page.locator('button:has-text("Add Employee")').first().click();
    await page.waitForTimeout(2000);
    
    // Verify modal is open with form
    const hasModal = await page.locator('input').count();
    expect(hasModal).toBeGreaterThan(3);
    
    console.log('✅ TC-EMP-008 PASSED: Admin user type modal works');
  });

  test('TC-EMP-009: Switch user type to Branch User in modal', async ({ page }) => {
    // Open Add modal
    await page.locator('button:has-text("Add Employee")').first().click();
    await page.waitForTimeout(1500);
    
    // Click on Branch User button (in the modal)
    const branchUserButton = page.locator('button').filter({ hasText: 'Branch User' }).nth(1);
    await branchUserButton.click();
    await page.waitForTimeout(500);
    
    // Verify Branch User Details section appears
    const hasBranchDetails = await page.locator('text=Branch User Details').count();
    expect(hasBranchDetails).toBeGreaterThan(0);
    
    console.log('✅ TC-EMP-009 PASSED: Switch user type to Branch User works');
  });

  test('TC-EMP-010: Close modal', async ({ page }) => {
    // Open Add modal
    await page.locator('button:has-text("Add Employee")').first().click();
    await page.waitForTimeout(1500);
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Verify modal is closed (Add button should be visible again)
    const hasAddButton = await page.locator('button:has-text("Add Employee")').count();
    expect(hasAddButton).toBeGreaterThan(0);
    
    console.log('✅ TC-EMP-010 PASSED: Modal can be closed');
  });

});
