/**
 * Station Creation E2E Tests
 * Tests station creation workflow
 * 
 * Created: 2025-01-11
 * Purpose: E2E testing for station creation
 */

import { expect, test } from '@playwright/test';
import { ensureDashboardAuthenticated } from './utils/auth.js';

test.describe.serial('Station Creation', () => {
    let stationId;

    test('should create a new station', async({ page }) => {
        await page.goto('/dashboard');
        await ensureDashboardAuthenticated(page);

        stationId = `E2E_STATION_${Date.now()}`;

        await page.fill('#station-id', stationId);
        await page.selectOption('#ocpp-version', '1.6J');
        await page.fill('#vendor', 'E2E_Vendor');
        await page.fill('#max-power', '22');

        await page.click('button:has-text("Create & Start Station")');

        const toast = page.locator('text=Station created successfully');
        await expect(toast).toBeVisible({ timeout: 10000 });

        const stationCard = page.locator('.station-card').filter({ hasText: stationId });
        await expect(stationCard).toBeVisible({ timeout: 10000 });
    });

    test('should start the created station', async({ page }) => {
        await page.goto('/dashboard');
        await ensureDashboardAuthenticated(page);

        const stationCard = page.locator('.station-card').filter({ hasText: stationId }).first();
        await expect(stationCard).toBeVisible({ timeout: 10000 });

        await stationCard.locator('button.btn-outline-success').click();

        await expect(page.locator('text=Station started successfully')).toBeVisible({
            timeout: 8000,
        });
    });

    test('should stop the created station', async({ page }) => {
        await page.goto('/dashboard');
        await ensureDashboardAuthenticated(page);

        const stationCard = page.locator('.station-card').filter({ hasText: stationId }).first();
        await expect(stationCard).toBeVisible({ timeout: 10000 });

        await stationCard.locator('button.btn-outline-warning').click();

        await expect(page.locator('text=Station stopped successfully')).toBeVisible({
            timeout: 8000,
        });
    });
});
