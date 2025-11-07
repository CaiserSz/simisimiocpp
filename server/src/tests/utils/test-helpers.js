/**
 * Test Helpers
 * 
 * Created: 2025-01-11
 * Purpose: Reusable test utility functions
 */

/**
 * Create a mock Express request object
 */
export const createMockRequest = (overrides = {}) => {
    return {
        body: {},
        params: {},
        query: {},
        headers: {},
        ip: '127.0.0.1',
        user: null,
        id: 'test-request-id',
        ...overrides
    };
};

/**
 * Create a mock Express response object
 */
export const createMockResponse = () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
        locals: {}
    };
    return res;
};

/**
 * Create a mock Express next function
 */
export const createMockNext = () => {
    return jest.fn();
};

/**
 * Wait for a specified amount of time
 */
export const wait = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Create test user data
 */
export const createTestUser = (overrides = {}) => {
    return {
        id: `test-user-${Date.now()}`,
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'testpassword123',
        role: 'user',
        isActive: true,
        ...overrides
    };
};

/**
 * Create test station config
 */
export const createTestStationConfig = (overrides = {}) => {
    return {
        stationId: `TEST_${Date.now()}`,
        vendor: 'TestVendor',
        model: 'TestModel',
        ocppVersion: '1.6J',
        maxPower: 22000,
        connectorCount: 2,
        csmsUrl: 'ws://localhost:9220',
        ...overrides
    };
};

export default {
    createMockRequest,
    createMockResponse,
    createMockNext,
    wait,
    createTestUser,
    createTestStationConfig
};

