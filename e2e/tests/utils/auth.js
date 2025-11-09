import { expect } from '@playwright/test';

const DEFAULT_EMAIL = 'admin@simulator.local';
const DEFAULT_PASSWORD = 'admin123';

export async function ensureDashboardAuthenticated(page) {
    const email = process.env.PLAYWRIGHT_ADMIN_EMAIL || DEFAULT_EMAIL;
    const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD || DEFAULT_PASSWORD;

    const loginModal = page.locator('#login-modal');
    const loginButton = page.locator('#login-btn');

    const modalVisible = await loginModal.isVisible().catch(() => false);
    const buttonVisible = await loginButton.isVisible().catch(() => false);

    if (!modalVisible && buttonVisible) {
        await loginButton.click();
    }

    if (await loginModal.isVisible().catch(() => false)) {
        await loginModal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

        await page.fill('#login-email', email);
        await page.fill('#login-password', password);
        await page.click('#login-form button[type="submit"]');

        await loginModal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
        await expect(page.locator('#logout-btn')).toBeVisible({ timeout: 10000 });
    }
}

export default ensureDashboardAuthenticated;
