export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: [
        '**/src/tests/**/*.test.js',
        '**/src/__tests__/**/*.test.js'
    ],
    testTimeout: 30000,

    // Parallelization configuration
    maxWorkers: process.env.CI ? '50%' : '75%', // Use 75% of CPU cores in local, 50% in CI

    // Test isolation and cleanup
    resetMocks: true,
    restoreMocks: true,
    clearMocks: true,

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/tests/**',
        '!src/__tests__/**',
        '!src/app.js',
        '!src/**/*.test.js',
        '!src/**/index.js',
        '!src/mock/**' // Exclude mock CSMS from coverage
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json', 'text-summary'],
    coverageThreshold: {
        global: {
            branches: 75, // Increased from 70
            functions: 75, // Increased from 70
            lines: 75, // Increased from 70
            statements: 75 // Increased from 70
        }
    },

    // Setup and teardown
    setupFilesAfterEnv: ['<rootDir>/src/tests/utils/setup.js'],

    // Module configuration
    moduleFileExtensions: ['js', 'json'],
    testPathIgnorePatterns: ['/node_modules/', '/coverage/'],

    // Output configuration
    verbose: true,
    detectOpenHandles: true,
    forceExit: true,

    // Performance optimization
    cache: true,
    cacheDirectory: '<rootDir>/.jest-cache',

    // Test execution optimization
    bail: false, // Don't bail on first failure
    errorOnDeprecated: true,

    // Worker configuration
    workerIdleMemoryLimit: '500MB', // Kill workers if memory exceeds 500MB

    // Globals (for ESM compatibility)
    globals: {
        'ts-jest': {
            useESM: true
        }
    }
};
