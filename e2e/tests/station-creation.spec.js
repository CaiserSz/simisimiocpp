/**
 * Station Creation E2E Tests
 * Tests station creation workflow
 * 
 * Created: 2025-01-11
 * Purpose: E2E testing for station creation
 */

import { expect, test } from '@playwright/test';

test.describe('Station Creation', () => {
    test('should create a new station', async({ page }) => {
        await page.goto('/dashboard');

        // Fill station creation form
        await page.fill('input[placeholder*="Station ID"]', 'E2E_TEST_001');
        await page.selectOption('select', '1.6J');
        await page.fill('input[placeholder*="Vendor"]', 'E2E_Vendor');
        await page.fill('input[placeholder*="Max Power"]', '22');

        // Submit form
        await page.click('button:has-text("Create & Start")');

        // Wait for success toast
        await expect(page.locator('text=Station created successfully')).toBeVisible({
            timeout: 5000,
        });

        // Verify station appears in grid
        await expect(page.locator('text=E2E_TEST_001')).toBeVisible();
    });

    test('should start a station', async({ page }) => {
        await page.goto('/dashboard');

        // Find station and click start button
        const stationCard = page.locator('.station-card').first();
        await stationCard.locator('button:has-text("Start")').click();

        // Wait for success toast
        await expect(page.locator('text=started successfully')).toBeVisible({
            timeout: 5000,
        });
    });

    test('should stop a station', async({ page }) => {
        await page.goto('/dashboard');

        // Find station and click stop button
        const stationCard = page.locator('.station-card').first();
        await stationCard.locator('button:has-text("Stop")').click();

        // Wait for success toast
        await expect(page.locator('text=stopped successfully')).toBeVisible({
            timeout: 5000,
        });
    });
});