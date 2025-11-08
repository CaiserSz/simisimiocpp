/**
 * Jest Test Setup
 * Global test configuration and utilities
 * 
 * Created: 2025-01-11
 * Purpose: Centralized test setup and teardown
 */

// Note: jest.setTimeout is configured in jest.config.js (testTimeout: 30000)

// Global test utilities
global.testUtils = {
    /**
     * Wait for a condition to be true
     */
    waitFor: async (condition, timeout = 5000, interval = 100) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (await condition()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error(`Condition not met within ${timeout}ms`);
    },

    /**
     * Create a mock station configuration
     */
    createMockStationConfig: (overrides = {}) => {
        return {
            stationId: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            vendor: 'TestVendor',
            model: 'TestModel',
            ocppVersion: '1.6J',
            connectorCount: 2,
            maxPower: 22000,
            csmsUrl: 'ws://localhost:9220',
            ...overrides
        };
    },

    /**
     * Create a mock OCPP message
     */
    createMockOCPPMessage: (action, payload = {}) => {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        return [2, messageId, action, payload];
    },

    /**
     * Cleanup helper for async operations
     */
    cleanup: async (cleanupFn) => {
        try {
            await cleanupFn();
        } catch (error) {
            // Ignore cleanup errors in tests
        }
    }
};

// Global beforeAll - setup test environment
beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
});

// Global afterAll - cleanup test environment
afterAll(async () => {
    // Cleanup any remaining resources
    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }
});

// Global beforeEach - reset mocks
beforeEach(() => {
    // Note: jest.clearAllMocks() is handled by Jest config (clearMocks: true)
});

// Global afterEach - cleanup after each test
afterEach(() => {
    // Note: jest.clearAllTimers() can be called if needed
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason) => {
    // Log but don't fail tests
    if (process.env.VERBOSE_TESTS === 'true') {
        console.error('Unhandled Rejection in test:', reason);
    }
});

// Export test utilities
export default global.testUtils;
