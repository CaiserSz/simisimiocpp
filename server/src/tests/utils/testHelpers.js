/**
 * Test Helpers
 * Reusable test utilities and fixtures
 * 
 * Created: 2025-01-11
 * Purpose: Centralized test helpers for consistency
 */

import { SimulationManager } from '../../simulator/SimulationManager.js';

/**
 * Create a test simulation manager with cleanup
 */
export async function createTestSimulationManager() {
    const manager = new SimulationManager();

    // Return manager with cleanup function
    return {
        manager,
        cleanup: async() => {
            await manager.removeAllStations();
            await manager.shutdown();
        }
    };
}

/**
 * Create a test station with cleanup
 */
export async function createTestStation(config = {}) {
    const manager = new SimulationManager();
    const stationConfig = {
        stationId: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        vendor: 'TestVendor',
        model: 'TestModel',
        ocppVersion: '1.6J',
        connectorCount: 2,
        maxPower: 22000,
        csmsUrl: 'ws://localhost:9220',
        ...config
    };

    const station = await manager.createStation(stationConfig);

    return {
        station,
        manager,
        cleanup: async() => {
            await station.stop();
            await manager.removeStation(station.stationId);
            await manager.shutdown();
        }
    };
}

/**
 * Wait for station to be online
 */
export async function waitForStationOnline(station, timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (station.isOnline) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Station ${station.stationId} did not come online within ${timeout}ms`);
}

/**
 * Wait for OCPP message response
 */
export async function waitForOCPPResponse(simulator, messageId, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`OCPP response timeout for message ${messageId}`));
        }, timeout);

        // Check if response already received
        if (!simulator.pendingRequests || !simulator.pendingRequests.has(messageId)) {
            clearTimeout(timer);
            resolve();
            return;
        }

        // Wait for response
        const originalResolve = simulator.pendingRequests.get(messageId)?.resolve;
        if (originalResolve) {
            simulator.pendingRequests.set(messageId, {
                ...simulator.pendingRequests.get(messageId),
                resolve: (payload) => {
                    clearTimeout(timer);
                    originalResolve(payload);
                    resolve(payload);
                }
            });
        }
    });
}

/**
 * Mock CSMS response helper
 */
export function createMockCSMSResponse(messageId, payload = {}) {
    return [3, messageId, payload];
}

/**
 * Mock CSMS error response helper
 */
export function createMockCSMSError(messageId, errorCode = 'InternalError', description = 'Mock error') {
    return [4, messageId, errorCode, description, {}];
}

/**
 * Test data fixtures
 */
export const testFixtures = {
    stationConfigs: {
        basic: {
            stationId: 'TEST_BASIC',
            vendor: 'TestVendor',
            model: 'TestModel',
            ocppVersion: '1.6J',
            connectorCount: 2,
            maxPower: 22000
        },
        fastCharger: {
            stationId: 'TEST_FAST',
            vendor: 'FastVendor',
            model: 'FastModel',
            ocppVersion: '2.0.1',
            connectorCount: 4,
            maxPower: 150000
        }
    },

    vehicleProfiles: {
        compact: {
            vehicleType: 'compact',
            batteryCapacity: 40,
            maxChargingPower: 7400
        },
        sedan: {
            vehicleType: 'sedan',
            batteryCapacity: 60,
            maxChargingPower: 11000
        },
        suv: {
            vehicleType: 'suv',
            batteryCapacity: 100,
            maxChargingPower: 22000
        }
    },

    ocppMessages: {
        bootNotification: {
            action: 'BootNotification',
            payload: {
                chargePointVendor: 'TestVendor',
                chargePointModel: 'TestModel',
                chargePointSerialNumber: 'TEST_SN_001',
                firmwareVersion: '1.0.0'
            }
        },
        heartbeat: {
            action: 'Heartbeat',
            payload: {}
        },
        statusNotification: {
            action: 'StatusNotification',
            payload: {
                connectorId: 1,
                status: 'Available',
                errorCode: 'NoError'
            }
        }
    }
};

/**
 * Performance test helpers
 */
export const performanceHelpers = {
    /**
     * Measure execution time
     */
    measureTime: async(fn) => {
        const start = process.hrtime.bigint();
        const result = await fn();
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        return { result, duration };
    },

    /**
     * Memory snapshot
     */
    takeMemorySnapshot: () => {
        const usage = process.memoryUsage();
        return {
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            rss: usage.rss,
            external: usage.external
        };
    },

    /**
     * Compare memory snapshots
     */
    compareMemorySnapshots: (before, after) => {
        return {
            heapUsed: after.heapUsed - before.heapUsed,
            heapTotal: after.heapTotal - before.heapTotal,
            rss: after.rss - before.rss,
            external: after.external - before.external
        };
    }
};

export default {
    createTestSimulationManager,
    createTestStation,
    waitForStationOnline,
    waitForOCPPResponse,
    createMockCSMSResponse,
    createMockCSMSError,
    testFixtures,
    performanceHelpers
};