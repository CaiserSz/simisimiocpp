/**
 * Health Check E2E Tests
 * Tests API health endpoints
 * 
 * Created: 2025-01-11
 * Purpose: E2E testing for health endpoints
 */

import { expect, test } from '@playwright/test';

test.describe('Health Endpoints', () => {
    test('should return healthy status', async({ request }) => {
        const response = await request.get('/health');
        expect(response.ok()).toBeTruthy();

        const data = await response.json();
        expect(data.status).toBe('ok');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('version');
    });

    test('should return metrics', async({ request }) => {
        const response = await request.get('/metrics');
        expect(response.ok()).toBeTruthy();

        const metrics = await response.text();
        expect(metrics).toContain('# HELP');
        expect(metrics).toContain('# TYPE');
    });

    test('should return detailed health', async({ request }) => {
        const response = await request.get('/health/detailed');
        expect(response.ok()).toBeTruthy();

        const data = await response.json();
        expect(data).toHaveProperty('status');
        expect(data).toHaveProperty('timestamp');
    });
});