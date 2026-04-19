import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and login
    await page.goto('/login/admin');
    await page.fill('input[type="email"]', 'owner@nexustest.co.za');
    await page.fill('input[type="password"]', 'Nexus@Password123');
    await page.click('button:has-text("Authenticate")');
    
    // Wait for the URL to change to the admin area
    await expect(page).toHaveURL('http://localhost:3000/admin', { timeout: 30000 });
  });

  test('should create and delete a new unit', async ({ page }) => {
    await page.goto('/admin/units');
    
    // Ensure the page is loaded
    await page.waitForSelector('h1:has-text("Units & Properties")');

    // Open modal
    await page.click('button:has-text("Add New Unit")');
    
    // Wait for modal to appear
    await page.waitForSelector('h2:has-text("Add New Unit")');
    
    // Fill form
    const unitName = `Test Unit ${Date.now()}`;
    await page.fill('#unit-name', unitName);
    await page.fill('#unit-floor', 'Floor 10');
    
    // Select Residential type specifically in the modal
    // Using a more specific selector to avoid the 'Residential' tab
    await page.click('div.fixed.inset-0 button:has-text("Residential")');
    
    // Submit
    await page.click('button:has-text("Create Unit")');
    
    // Verify success message with a longer timeout as it might take time for DB to respond
    await expect(page.locator('text=successfully')).toBeVisible({ timeout: 15000 });
    
    // Verify in list
    await expect(page.locator(`text=${unitName}`)).toBeVisible();
    
    // Delete
    const row = page.locator('tr', { hasText: unitName });
    
    // Handle dialog BEFORE clicking
    page.once('dialog', dialog => dialog.accept());
    await row.locator('button[title="Delete unit"]').click();
    
    // Verify deletion
    await expect(page.locator('text=deleted successfully')).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${unitName}`)).not.toBeVisible();
  });

  test('should invite and delete a new user', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Ensure the page is loaded
    await page.waitForSelector('h1:has-text("User Management")');

    // Open modal
    await page.click('button:has-text("Invite User")');
    
    // Wait for modal
    await page.waitForSelector('h2:has-text("Invite New User")');
    
    // Fill form
    const email = `testuser_${Date.now()}@nexustest.co.za`;
    await page.fill('#first-name', 'Test');
    await page.fill('#last-name', 'User');
    await page.fill('#email-address', email);
    await page.selectOption('#user-role', 'Guard');
    
    // Submit
    await page.click('button:has-text("Create User")');
    
    // Verify invite link success state
    await expect(page.locator('text=User Created')).toBeVisible({ timeout: 15000 });
    
    // Close modal via "Done" button
    await page.click('button:has-text("Done")');
    
    // Sometimes the list needs a second to refresh or a reload if not using real-time sync
    await page.reload();
    await page.waitForSelector('h1:has-text("User Management")');
    
    // Verify in list with a longer timeout
    await expect(page.locator(`text=${email}`)).toBeVisible({ timeout: 15000 });
    
    // Delete
    const row = page.locator('tr', { hasText: email });
    
    // Handle dialog BEFORE clicking
    page.once('dialog', dialog => dialog.accept());
    await row.locator('button[title="Delete user"]').click();
    
    // Verify deletion
    await expect(page.locator('text=has been removed')).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${email}`)).not.toBeVisible();
  });
});
