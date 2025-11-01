import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import logger from '../utils/logger.js';

let mongoServer;

// Setup test database
beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  logger.info('Test database connected');
});

// Cleanup after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
  
  logger.info('Test database disconnected');
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
