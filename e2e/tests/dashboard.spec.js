/**
 * Dashboard E2E Tests
 * Tests dashboard functionality
 * 
 * Created: 2025-01-11
 * Purpose: E2E testing for dashboard
 */

import { expect, test } from '@playwright/test';

test.describe('Dashboard', () => {
    test('should load dashboard successfully', async({ page }) => {
        await page.goto('/dashboard');

        // Check page title
        await expect(page).toHaveTitle(/EV Station Simulator/);

        // Check main heading
        await expect(page.locator('text=EV Station Simulator')).toBeVisible();
    });

    test('should display system overview cards', async({ page }) => {
        await page.goto('/dashboard');

        // Check all overview cards
        await expect(page.locator('text=Total Stations')).toBeVisible();
        await expect(page.locator('text=Online')).toBeVisible();
        await expect(page.locator('text=Active Sessions')).toBeVisible();
        await expect(page.locator('text=Total Power')).toBeVisible();
    });

    test('should show connection status', async({ page }) => {
        await page.goto('/dashboard');

        // Wait for WebSocket connection
        await page.waitForTimeout(2000);

        // Check connection badge (should be "Connected" or "Disconnected")
        const connectionBadge = page.locator('#connection-status');
        await expect(connectionBadge).toBeVisible();
    });

    test('should have metrics chart', async({ page }) => {
        await page.goto('/dashboard');

        // Check metrics chart exists
        const chart = page.locator('#metrics-chart');
        await expect(chart).toBeVisible();
    });
});