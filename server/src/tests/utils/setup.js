import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only_minimum_32_characters';
process.env.STORAGE_TYPE = 'json';
process.env.DATA_DIR = path.join(__dirname, '../../../test-data');
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.CSMS_MODE = process.env.CSMS_MODE || 'mock';
process.env.CSMS_URL = process.env.CSMS_URL || 'ws://localhost:9220';
process.env.ENABLE_AUTH = process.env.ENABLE_AUTH || 'true';

// Global test utilities
global.testUtils = {
    createTestUser: () => ({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
    }),

    createTestStation: () => ({
        stationId: `TEST_STATION_${Date.now()}`,
        vendor: 'TestVendor',
        model: 'TestModel',
        ocppVersion: '1.6J',
        connectorCount: 2,
        maxPower: 22000,
        csmsUrl: 'ws://localhost:9220'
    }),

    createTestVehicle: () => ({
        vehicleType: 'sedan',
        initialSoC: 30,
        targetSoC: 80,
        batteryCapacity: 75
    }),

    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    generateValidJWT: () => {
        return jwt.sign({
                id: 'test_user',
                username: 'testuser',
                email: 'test@example.com',
                role: 'admin'
            },
            process.env.JWT_SECRET, { expiresIn: '1h' }
        );
    },

    async cleanupTestData() {
        try {
            const testDataDir = process.env.DATA_DIR;
            const files = await fs.readdir(testDataDir);

            for (const file of files) {
                if (file.startsWith('test-') || file.includes('test')) {
                    await fs.unlink(path.join(testDataDir, file));
                }
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    }
};

// Setup test database directory
const setupTestEnvironment = async() => {
    try {
        await fs.mkdir(process.env.DATA_DIR, { recursive: true });
    } catch (error) {
        // Directory already exists
    }
};

// Cleanup function for after tests
const cleanupTestEnvironment = async() => {
    try {
        await global.testUtils.cleanupTestData();
    } catch (error) {
        console.warn('Test cleanup warning:', error.message);
    }
};

// Global setup
beforeAll(async() => {
    await setupTestEnvironment();
});

// Global cleanup
afterAll(async() => {
    await cleanupTestEnvironment();
});

// Per-test cleanup
afterEach(async() => {
    // Clean up any test-specific data
    await global.testUtils.cleanupTestData();
});

// Mock external dependencies for testing (if needed, add to individual test files)
// Note: Mocks should be defined in individual test files that need them

// Enhanced error handling for tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Note: Test timeout can be configured in jest config or per test file

// Configure Jest to handle ES modules properly
// Note: Mock clearing should be done in individual test files if needed

export default {
    testUtils: global.testUtils,
    setupTestEnvironment,
    cleanupTestEnvironment
};
