import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// NEXUS VMS — End-to-End Playwright Test Suite
// Covers: Landing, Login, Auth Guards, API Security, Static Pages,
//         Guest Pages, 404s, Security Headers, PWA Assets
// ═══════════════════════════════════════════════════════════════

test.describe('1. Landing Page — Portal Gateway', () => {
    test('renders the Nexus Portal Gateway with all login options', async ({ page }) => {
        await page.goto('/');

        // Page title
        await expect(page).toHaveTitle(/Nexus/i);

        // The main heading
        await expect(page.locator('h1')).toHaveText('Nexus Portal');

        // The three gateway options
        await expect(page.getByText('SuperAdmin Gateway')).toBeVisible();
        await expect(page.getByText('Resident Portal')).toBeVisible();
        await expect(page.getByText('Security Terminal')).toBeVisible();
    });

    test('admin link navigates to /login/admin', async ({ page }) => {
        await page.goto('/');
        await page.getByText('SuperAdmin Gateway').click();
        await page.waitForURL('**/login/admin');
        expect(page.url()).toContain('/login/admin');
    });

    test('owner link navigates to /login/owner', async ({ page }) => {
        await page.goto('/');
        await page.getByText('Resident Portal').click();
        await page.waitForURL('**/login/owner');
        expect(page.url()).toContain('/login/owner');
    });

    test('guard link navigates to /login/guard', async ({ page }) => {
        await page.goto('/');
        await page.getByText('Security Terminal').click();
        await page.waitForURL('**/login/guard');
        expect(page.url()).toContain('/login/guard');
    });

    test('GSS branding footer is visible', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Global Security Solutions')).toBeVisible();
    });
});

test.describe('2. Login Pages — Form Rendering', () => {
    test('admin login page renders with email and password fields', async ({ page }) => {
        await page.goto('/login/admin');

        await expect(page.locator('h1')).toContainText('System Admin');
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.getByRole('button', { name: /Authenticate/i })).toBeVisible();
    });

    test('owner login page renders with sign-in form', async ({ page }) => {
        await page.goto('/login/owner');

        await expect(page.locator('h1')).toContainText('Resident Portal');
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    });

    test('guard login page renders with login form', async ({ page }) => {
        await page.goto('/login/guard');

        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('admin login shows error with invalid credentials', async ({ page }) => {
        await page.goto('/login/admin');

        await page.locator('input[type="email"]').fill('fake@invalid.com');
        await page.locator('input[type="password"]').fill('wrongpassword123');
        await page.getByRole('button', { name: /Authenticate/i }).click();

        // Wait for error message
        await expect(page.locator('text=/Invalid|credentials|error/i')).toBeVisible({ timeout: 10000 });
    });

    test('admin login has "Forgot password?" link that switches to reset mode', async ({ page }) => {
        await page.goto('/login/admin');

        await page.getByText('Forgot password?').click();
        await expect(page.locator('text=/Admin Reset/i')).toBeVisible();
        await expect(page.getByRole('button', { name: /Send Reset Link/i })).toBeVisible();
    });

    test('owner login has "Forgot password?" link', async ({ page }) => {
        await page.goto('/login/owner');
        await expect(page.getByText('Forgot password?')).toBeVisible();
    });

    test('admin login has "Back to Main Portals" link', async ({ page }) => {
        await page.goto('/login/admin');
        await expect(page.getByText(/Back to Main Portals|Back/i)).toBeVisible();
    });
});

test.describe('3. Route Protection — Unauthenticated Redirects', () => {
    test('unauthenticated user visiting /admin is redirected to login', async ({ page }) => {
        const response = await page.goto('/admin');

        // The proxy should redirect unauthenticated users to /login/admin
        // After redirect chain, we should be on a login page
        expect(page.url()).toContain('/login/admin');
        expect(response?.status()).toBeLessThan(400);
    });

    test('unauthenticated user visiting /owner is redirected to login', async ({ page }) => {
        await page.goto('/owner');
        expect(page.url()).toContain('/login/owner');
    });

    test('unauthenticated user visiting /guard is redirected to login', async ({ page }) => {
        await page.goto('/guard');
        expect(page.url()).toContain('/login/guard');
    });

    test('unauthenticated user visiting /admin/users is redirected', async ({ page }) => {
        await page.goto('/admin/users');
        expect(page.url()).toContain('/login/admin');
    });

    test('unauthenticated user visiting /admin/units is redirected', async ({ page }) => {
        await page.goto('/admin/units');
        expect(page.url()).toContain('/login/admin');
    });

    test('unauthenticated user visiting /owner/visitors is redirected', async ({ page }) => {
        await page.goto('/owner/visitors');
        expect(page.url()).toContain('/login/owner');
    });

    test('unauthenticated user visiting /guard/parcels is redirected', async ({ page }) => {
        await page.goto('/guard/parcels');
        expect(page.url()).toContain('/login/guard');
    });
});

test.describe('4. API Security — Unauthenticated Rejection', () => {
    test('GET /api/visitors returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.get('/api/visitors', { timeout: 30000 });
        expect(response.status()).toBe(401);
        const json = await response.json();
        expect(json.error).toBeDefined();
    });

    test('POST /api/visitors returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.post('/api/visitors', {
            data: { firstName: 'Test', lastName: 'Visitor', phone: '+27123456789' }
        });
        expect(response.status()).toBe(401);
    });

    test('DELETE /api/visitors returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.delete('/api/visitors?id=fake-uuid');
        expect(response.status()).toBe(401);
    });

    test('POST /api/opendoor returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.post('/api/opendoor');
        expect(response.status()).toBe(401);
        const json = await response.json();
        expect(json.error).toBeDefined();
    });

    test('GET /api/notifications returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.get('/api/notifications');
        expect(response.status()).toBe(401);
    });

    test('PATCH /api/notifications returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.patch('/api/notifications', {
            data: { id: 'fake', read: true }
        });
        expect(response.status()).toBe(401);
    });

    test('GET /api/parcels returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.get('/api/parcels');
        expect(response.status()).toBe(401);
    });

    test('POST /api/parcels returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.post('/api/parcels', {
            data: { unit_id: 'some-uuid', courier_name: 'DHL' }
        });
        expect(response.status()).toBe(401);
    });

    test('GET /api/maintenance returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.get('/api/maintenance');
        expect(response.status()).toBe(401);
    });

    test('POST /api/maintenance returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.post('/api/maintenance', {
            data: { title: 'Test Ticket', description: 'Test description here', category: 'General', priority: 'Low' }
        });
        expect(response.status()).toBe(401);
    });

    test('GET /api/admin/units returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.get('/api/admin/units');
        expect(response.status()).toBe(401);
    });

    test('GET /api/admin/users returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.get('/api/admin/users');
        expect(response.status()).toBe(401);
    });

    test('POST /api/guard/lockdown returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.post('/api/guard/lockdown', {
            data: { action: 'lock' }
        });
        expect(response.status()).toBe(401);
    });

    test('POST /api/guard/pulse-gate returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.post('/api/guard/pulse-gate', {
            data: { door: 1, action: 'pulse' }
        });
        expect(response.status()).toBe(401);
    });

    test('POST /api/visitors/bulk returns 401 for unauthenticated requests', async ({ request }) => {
        const response = await request.post('/api/visitors/bulk', {
            data: { visitors: [] }
        });
        expect(response.status()).toBe(401);
    });

    test('GET /api/admin/bridge-health responds without crashing', async ({ request }) => {
        // Note: This endpoint currently has no auth check — it should return status info or 503
        const response = await request.get('/api/admin/bridge-health');
        // Should not 500 crash
        expect(response.status()).not.toBe(500);
        const json = await response.json();
        expect(json.status).toBeDefined();
    });
});

test.describe('5. Auth Flow — Logout Endpoint', () => {
    test('GET /auth/logout redirects to root', async ({ request }) => {
        const response = await request.get('/auth/logout', { maxRedirects: 0 });
        expect(response.status()).toBe(302);
        const location = response.headers()['location'] || '';
        expect(location.endsWith('/') || location === '/').toBe(true);
    });

    test('POST /auth/logout redirects to root', async ({ request }) => {
        const response = await request.post('/auth/logout', { maxRedirects: 0 });
        expect(response.status()).toBe(302);
    });
});

test.describe('6. Static Pages', () => {
    test('privacy policy page loads', async ({ page }) => {
        const response = await page.goto('/privacy');
        expect(response?.status()).toBe(200);
    });

    test('terms of service page loads', async ({ page }) => {
        const response = await page.goto('/terms');
        expect(response?.status()).toBe(200);
    });

    test('password reset page loads', async ({ page }) => {
        const response = await page.goto('/auth/reset-password');
        expect(response?.status()).toBe(200);
        // Should show verifying state or expired link state
        await expect(page.locator('text=/Verifying|Set New Password|Link Expired/i')).toBeVisible({ timeout: 10000 });
    });
});

test.describe('7. Guest Pages', () => {
    test('guest page with invalid ID shows error or not-found gracefully', async ({ page }) => {
        const response = await page.goto('/guest/00000000-0000-0000-0000-000000000000');
        // Should not crash (either shows "not found" styled page or guest layout)
        expect(response?.status()).toBeLessThan(500);
    });

    test('guest API with invalid ID returns error', async ({ request }) => {
        const response = await request.get('/api/guest/00000000-0000-0000-0000-000000000000');
        // Should return 404 or 400, not 500
        expect(response.status()).not.toBe(500);
    });
});

test.describe('8. 404 Handling', () => {
    test('non-existent page shows styled 404', async ({ page }) => {
        const response = await page.goto('/this-page-does-not-exist-12345');
        expect(response?.status()).toBe(404);
        await expect(page.locator('text=404')).toBeVisible();
    });
});

test.describe('9. Security Headers', () => {
    test('response includes HSTS header', async ({ request }) => {
        const response = await request.get('/');
        const hsts = response.headers()['strict-transport-security'];
        expect(hsts).toContain('max-age=63072000');
        expect(hsts).toContain('includeSubDomains');
    });

    test('response includes X-Content-Type-Options', async ({ request }) => {
        const response = await request.get('/');
        expect(response.headers()['x-content-type-options']).toBe('nosniff');
    });

    test('response includes X-Frame-Options', async ({ request }) => {
        const response = await request.get('/');
        expect(response.headers()['x-frame-options']).toBe('DENY');
    });

    test('response includes Referrer-Policy', async ({ request }) => {
        const response = await request.get('/');
        expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    test('response includes Permissions-Policy', async ({ request }) => {
        const response = await request.get('/');
        const pp = response.headers()['permissions-policy'];
        expect(pp).toContain('camera=()');
        expect(pp).toContain('microphone=()');
    });
});

test.describe('10. PWA Assets', () => {
    test('manifest.json is accessible', async ({ request }) => {
        const response = await request.get('/manifest.json');
        expect(response.status()).toBe(200);
        const json = await response.json();
        expect(json.name).toBe('Nexus by GSS');
        expect(json.short_name).toBe('Nexus');
        expect(json.icons).toBeDefined();
        expect(json.icons.length).toBeGreaterThan(0);
    });

    test('service worker is accessible', async ({ request }) => {
        const response = await request.get('/sw.js');
        expect(response.status()).toBe(200);
        const body = await response.text();
        expect(body).toContain('addEventListener');
    });

    test('PWA icons are accessible', async ({ request }) => {
        const res192 = await request.get('/logo-192.png');
        expect(res192.status()).toBe(200);

        const res512 = await request.get('/logo-512.png');
        expect(res512.status()).toBe(200);
    });
});
