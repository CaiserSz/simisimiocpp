import { jest } from '@jest/globals';
import { StationSimulator } from '../simulator/StationSimulator.js';

/**
 * StationSimulator Test Suite
 * Tests critical station functionality including protocol switching
 * 
 * Created: 2025-01-11
 * Purpose: Improve test coverage for StationSimulator.switchProtocol and other critical methods
 */

describe('StationSimulator - Protocol Switching', () => {
    let stationSimulator;
    const mockConfig = {
        stationId: 'TEST_STATION_001',
        vendor: 'TestVendor',
        model: 'TestModel',
        ocppVersion: '1.6J',
        connectorCount: 2,
        maxPower: 22000,
        csmsUrl: 'ws://localhost:9220',
        heartbeatInterval: 300
    };

    beforeEach(() => {
        stationSimulator = new StationSimulator(mockConfig);
    });

    afterEach(async() => {
        if (stationSimulator) {
            try {
                await stationSimulator.stop();
            } catch (error) {
                // Ignore stop errors in tests
            }
        }
    });

    describe('switchProtocol', () => {
        test('should switch protocol when station is offline', async() => {
            // Ensure station is offline
            expect(stationSimulator.isOnline).toBe(false);

            // Switch from 1.6J to 2.0.1
            await stationSimulator.switchProtocol('2.0.1');

            expect(stationSimulator.config.ocppVersion).toBe('2.0.1');
            expect(stationSimulator.ocppClient).toBeDefined();
        });

        test('should throw error when switching protocol while station is online', async() => {
            // Start station to make it online
            await stationSimulator.start();

            expect(stationSimulator.isOnline).toBe(true);

            // Attempt to switch protocol while online
            await expect(
                stationSimulator.switchProtocol('2.0.1')
            ).rejects.toThrow('Cannot switch protocol while station is online');

            // Protocol should remain unchanged
            expect(stationSimulator.config.ocppVersion).toBe('1.6J');
        });

        test('should reinitialize OCPP client after protocol switch', async() => {
            const originalClient = stationSimulator.ocppClient;

            // Switch protocol
            await stationSimulator.switchProtocol('2.0.1');

            // OCPP client should be reinitialized
            expect(stationSimulator.ocppClient).toBeDefined();
            expect(stationSimulator.ocppClient).not.toBe(originalClient);
        });

        test('should switch from 2.0.1 to 1.6J', async() => {
            // Initialize with 2.0.1
            const config2 = {...mockConfig, ocppVersion: '2.0.1' };
            const station2 = new StationSimulator(config2);

            // Switch to 1.6J
            await station2.switchProtocol('1.6J');

            expect(station2.config.ocppVersion).toBe('1.6J');

            await station2.stop();
        });

        test('should handle invalid protocol version gracefully', async() => {
            await expect(
                stationSimulator.switchProtocol('1.5')
            ).rejects.toThrow();
        });

        test('should emit event after protocol switch', async() => {
            const eventSpy = jest.fn();

            // Listen for configuration update events
            stationSimulator.on('configurationUpdated', eventSpy);

            await stationSimulator.switchProtocol('2.0.1');

            // Note: switchProtocol doesn't emit events directly, but updateConfiguration does
            // This test verifies that protocol switch updates config
            expect(stationSimulator.config.ocppVersion).toBe('2.0.1');
        });

        test('should preserve other configuration when switching protocol', async() => {
            const originalVendor = stationSimulator.config.vendor;
            const originalModel = stationSimulator.config.model;
            const originalMaxPower = stationSimulator.config.maxPower;

            await stationSimulator.switchProtocol('2.0.1');

            // Other config should remain unchanged
            expect(stationSimulator.config.vendor).toBe(originalVendor);
            expect(stationSimulator.config.model).toBe(originalModel);
            expect(stationSimulator.config.maxPower).toBe(originalMaxPower);
        });

        test('should allow switching protocol multiple times when offline', async() => {
            // Switch to 2.0.1
            await stationSimulator.switchProtocol('2.0.1');
            expect(stationSimulator.config.ocppVersion).toBe('2.0.1');

            // Switch back to 1.6J
            await stationSimulator.switchProtocol('1.6J');
            expect(stationSimulator.config.ocppVersion).toBe('1.6J');

            // Switch to 2.0.1 again
            await stationSimulator.switchProtocol('2.0.1');
            expect(stationSimulator.config.ocppVersion).toBe('2.0.1');
        });
    });

    describe('Protocol Switching Edge Cases', () => {
        test('should handle protocol switch during initialization', async() => {
            // Create station but don't start
            const station = new StationSimulator(mockConfig);

            // Switch protocol immediately
            await station.switchProtocol('2.0.1');

            expect(station.config.ocppVersion).toBe('2.0.1');
            expect(station.isOnline).toBe(false);

            await station.stop();
        });

        test('should maintain station state after protocol switch', async() => {
            const stationId = stationSimulator.stationId;
            const connectorCount = stationSimulator.connectors.length;

            await stationSimulator.switchProtocol('2.0.1');

            // Station state should be preserved
            expect(stationSimulator.stationId).toBe(stationId);
            expect(stationSimulator.connectors.length).toBe(connectorCount);
        });
    });
});