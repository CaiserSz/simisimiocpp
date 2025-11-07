export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: [
        '**/src/tests/**/*.test.js',
        '**/src/__tests__/**/*.test.js'
    ],
    testTimeout: 30000,
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/tests/**',
        '!src/__tests__/**',
        '!src/app.js',
        '!src/**/*.test.js',
        '!src/**/index.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    setupFilesAfterEnv: ['<rootDir>/src/tests/utils/setup.js'],
    // Note: moduleNameMapper removed - Jest ESM handles imports natively
    moduleFileExtensions: ['js', 'json'],
    testPathIgnorePatterns: ['/node_modules/', '/coverage/'],
    verbose: true,
    detectOpenHandles: true,
    forceExit: true
};