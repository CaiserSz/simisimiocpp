/**
 * Dashboard Authentication Flow E2E Test
 * Validates login + station creation + real-time updates
 */

import { expect, test } from '@playwright/test';
import { ensureDashboardAuthenticated } from './utils/auth.js';

test.describe('Dashboard Authentication Flow', () => {
    test('should login, create station, and receive updates', async({ page }) => {
        await page.goto('/dashboard');
        await ensureDashboardAuthenticated(page);

        const connectionBadge = page.locator('#connection-status');
        await expect(connectionBadge).toBeVisible();
        await expect(connectionBadge).toContainText('Connected', { timeout: 10000 });

        const stationId = `E2E_FLOW_${Date.now()}`;

        await page.fill('#station-id', stationId);
        await page.selectOption('#ocpp-version', '2.0.1');
        await page.fill('#vendor', 'FlowVendor');
        await page.fill('#max-power', '50');
        await page.click('button:has-text("Create & Start Station")');

        await expect(page.locator('text=Station created successfully')).toBeVisible({
            timeout: 10000,
        });

        const stationCard = page.locator('.station-card').filter({ hasText: stationId });
        await expect(stationCard).toBeVisible({ timeout: 10000 });

        // Cleanup station to keep environment tidy
        await page.evaluate(async(id) => {
            try {
                await fetch(`/api/simulator/stations/${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
            } catch (error) {
                console.warn('Cleanup failed for station', id, error);
            }
        }, stationId);
    });
});
