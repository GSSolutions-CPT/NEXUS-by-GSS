import { test, expect } from '@playwright/test';

test.describe('Nexus VMS Portal Smoke Tests', () => {
  test('landing page loads and displays Nexus branding', async ({ page }) => {
    // Navigate to the root URL
    await page.goto('/');

    // Verify the page title contains "Nexus" or specifically "Nexus Portal"
    // Note: The title in the HTML head is usually controlled by layout.tsx or page metadata,
    // but we can verify the visible heading.
    const heading = page.getByRole('heading', { name: /Nexus Portal/i });
    await expect(heading).toBeVisible();

    // Verify the "Authorized Personnel Only" security banner
    const securityBanner = page.getByText(/Authorized Personnel Only/i);
    await expect(securityBanner).toBeVisible();

    // Verify the Sign In button is present
    const signInButton = page.getByRole('button', { name: /Sign In to Nexus/i });
    await expect(signInButton).toBeVisible();
  });

  test('login form validation', async ({ page }) => {
    await page.goto('/');
    
    // Try to login without credentials
    await page.getByRole('button', { name: /Sign In to Nexus/i }).click();

    // The form has "required" attributes on inputs, so the browser should block it,
    // but we can check if the inputs are focused or if HTML5 validation is active.
    const emailInput = page.getByPlaceholder(/admin@globalsecurity.co.za/i);
    await expect(emailInput).toBeVisible();
  });
});
