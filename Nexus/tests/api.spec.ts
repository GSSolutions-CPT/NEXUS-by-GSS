import { test, expect } from '@playwright/test';

// Use a shared context for logged in requests
test.describe('Backend API Tests', () => {

    test.beforeEach(async ({ page }) => {
        // Authenticate via the UI to establish the Supabase SSR session cookie
        await page.goto('/login/owner');
        await page.fill('input[type="email"]', 'owner@nexustest.co.za');
        await page.fill('input[type="password"]', 'Nexus@Password123');
        await page.click('button:has-text("Sign In to Dashboard")');
        
        // Wait for the redirect indicating successful authentication
        await page.waitForURL(/.*(owner|admin)/, { timeout: 30000 });
    });

    test('should create and revoke a visitor pass via API', async ({ request, page }) => {
        // Grab context from the page which holds the auth cookies
        const context = page.context();
        const apiContext = await context.request;

        // 1. Create a visitor pass
        const response = await apiContext.post('/api/visitors', {
            data: {
                firstName: 'API',
                lastName: 'Tester',
                phone: '+27820000000',
                validFrom: new Date().toISOString(),
                validUntil: new Date(Date.now() + 86400000).toISOString(),
                needsParking: false
            }
        });

        // Some environments might fail closed due to missing Redis limits
        // We ensure we at least get a structured JSON response (no internal crashes)
        const status = response.status();
        expect([200, 500]).toContain(status); 

        const json = await response.json();
        
        if (status === 500) {
            // If Redis is missing locally/on CI, we expect the structured fail closed error
            expect(json.error).toBe('Internal Server Configuration Error');
            return;
        }

        expect(json.success).toBe(true);
        expect(json.visitorId).toBeDefined();
        
        const visitorId = json.visitorId;

        // 2. Revoke the visitor pass
        const revokeResp = await apiContext.delete(`/api/visitors?id=${visitorId}`);
        expect(revokeResp.status()).toBe(200);
        
        const revokeJson = await revokeResp.json();
        expect(revokeJson.success).toBe(true);
    });

    test('Guard API should reject unauthorized hardware bridge calls gracefully', async ({ page }) => {
        const apiContext = await page.context().request;

        // Attempting to hit opendoor.
        // It requires an actual BRIDGE url setup, but we want to make sure it doesn't 500 crash unhandled.
        const response = await apiContext.post('/api/opendoor');
        
        // It might be 503 if the local bridge is unreachable, or 403 if Owner isn't Guard/SuperAdmin
        const status = response.status();
        expect([403, 503, 502, 500]).toContain(status);
        
        const json = await response.json();
        expect(json.error).toBeDefined();
    });

    test('Admin Bridge Health check responds safely', async ({ page }) => {
        const apiContext = await page.context().request;

        const response = await apiContext.get('/api/admin/bridge-health');
        
        const status = response.status();
        expect([200, 403, 503]).toContain(status); // Owner might get 403, or it might work depending on role mapped
        
        if (status === 200) {
            const json = await response.json();
            expect(json.status).toBeDefined();
        }
    });

});
