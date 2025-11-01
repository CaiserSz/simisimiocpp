// Legacy test setup file - now using setup.updated.js for JSON storage testing
// This file is kept for compatibility but most tests should use the new setup

import logger from '../utils/logger.js';

// JSON Storage test setup - no external database needed
beforeAll(async () => {
  logger.info('JSON storage test environment initialized');
});

// Cleanup after each test
afterEach(async () => {
  // Clean up any test data files if needed
  // JSON storage cleanup is handled by individual test suites
});

// Cleanup after all tests
afterAll(async () => {
  logger.info('JSON storage test environment cleaned up');
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: (overrides = {}) => ({
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: 'customer',
    ...overrides
  }),
  
  // Create test station
  createTestStation: (overrides = {}) => ({
    id: 'test-station-1',
    chargePointVendor: 'TestVendor',
    chargePointModel: 'TestModel',
    protocol: 'ocpp1.6j',
    location: {
      coordinates: [29.0, 41.0],
      address: {
        street: 'Test Street 123',
        city: 'Test City',
        country: 'TR'
      }
    },
    ...overrides
  }),
  
  // Create test transaction
  createTestTransaction: (overrides = {}) => ({
    transactionId: 1234,
    stationId: 'test-station-1',
    connectorId: 1,
    idTag: 'test-tag',
    meterStart: 0,
    startTime: new Date(),
    status: 'active',
    ...overrides
  }),
  
  // Wait utility
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock OCPP message
  createOCPPMessage: (action, payload, messageType = 2) => [
    messageType,
    `test-${Date.now()}`,
    action,
    payload
  ]
};
