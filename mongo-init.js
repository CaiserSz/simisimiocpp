// Create admin user
db = db.getSiblingDB('admin');
db.createUser({
  user: process.env.MONGO_USER || 'admin',
  pwd: process.env.MONGO_PASSWORD || 'password',
  roles: [
    { role: 'userAdminAnyDatabase', db: 'admin' },
    { role: 'readWriteAnyDatabase', db: 'admin' },
    { role: 'dbAdminAnyDatabase', db: 'admin' },
    { role: 'clusterAdmin', db: 'admin' }
  ]
});

// Create application database and user
db = db.getSiblingDB(process.env.MONGO_DATABASE || 'charging_simulator');
db.createUser({
  user: process.env.MONGO_APP_USER || 'charging_user',
  pwd: process.env.MONGO_APP_PASSWORD || 'charging_password',
  roles: [
    { role: 'readWrite', db: process.env.MONGO_DATABASE || 'charging_simulator' }
  ]
});

// Create collections and indexes
db.createCollection('users');
db.createCollection('chargingStations');
db.createCollection('transactions');
db.createCollection('ocppMessages');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.chargingStations.createIndex({ chargePointId: 1 }, { unique: true });
db.transactions.createIndex({ transactionId: 1 }, { unique: true });
db.transactions.createIndex({ chargePointId: 1 });
db.ocppMessages.createIndex({ timestamp: -1 });

db.chargingStations.insertMany([
  {
    chargePointId: 'CP001',
    name: 'Ana İstasyon',
    model: 'ABB Terra 54',
    connectorType: 'CCS',
    maxPower: 50,
    status: 'available',
    lastHeartbeat: new Date(),
    location: {
      type: 'Point',
      coordinates: [28.9784, 41.0082] // Istanbul coordinates
    },
    ocppVersion: '2.0.1',
    firmwareVersion: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    chargePointId: 'CP002',
    name: 'Yan İstasyon',
    model: 'ABB Terra 24',
    connectorType: 'Type 2',
    maxPower: 22,
    status: 'available',
    lastHeartbeat: new Date(),
    location: {
      type: 'Point',
      coordinates: [28.9784, 41.0082] // Istanbul coordinates
    },
    ocppVersion: '2.0.1',
    firmwareVersion: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Create admin user for the application
db.users.insertOne({
  name: 'Admin',
  email: 'admin@example.com',
  password: '$2a$10$XFDq3wGhJlJExB1m0CxQrOQh5Y5Zk5X5X5X5X5X5X5X5X5X5X5X5X', // hashed 'admin123'
  role: 'admin',
  isActive: true,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});
