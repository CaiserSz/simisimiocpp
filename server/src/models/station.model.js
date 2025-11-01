import mongoose from 'mongoose';

const connectorSchema = new mongoose.Schema({
  connectorId: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Reserved', 'Unavailable', 'Faulted'],
    default: 'Unavailable',
  },
  lastMeterValue: { type: Number, default: 0 },
  lastMeterTimestamp: { type: Date },
  currentTransactionId: { type: String },
  currentChargingProfile: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const stationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  chargePointVendor: { type: String, required: true },
  chargePointModel: { type: String, required: true },
  firmwareVersion: String,
  meterSerialNumber: String,
  meterType: String,
  lastHeartbeat: { type: Date },
  ipAddress: String,
  ocppProtocol: { type: String, default: 'ocpp2.0.1' },
  status: {
    type: String,
    enum: ['Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted'],
    default: 'Unavailable',
  },
  connectors: [connectorSchema],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
  },
  address: {
    street: String,
    city: String,
    country: String,
    postalCode: String,
  },
  lastBootNotification: { type: Date },
  lastStatusNotification: { type: Date },
  lastMeterValue: { type: Date },
  power: { type: Number, default: 22 }, // kW
  voltage: { type: Number, default: 230 }, // V
  current: { type: Number, default: 32 }, // A
  phase: { type: Number, default: 3 },
  isOnline: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  tags: [String],
  metadata: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
stationSchema.index({ id: 1 });
stationSchema.index({ status: 1 });
stationSchema.index({ isOnline: 1 });
stationSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for connector count
stationSchema.virtual('connectorCount').get(function() {
  return this.connectors.length;
});

// Virtual for active transactions
stationSchema.virtual('activeTransactions', {
  ref: 'Transaction',
  localField: 'id',
  foreignField: 'stationId',
  match: { status: { $in: ['active', 'charging'] } },
  count: true,
});

// Update station status based on connectors
stationSchema.methods.updateStatus = function() {
  if (!this.connectors || this.connectors.length === 0) {
    this.status = 'Unavailable';
    return;
  }

  const statusPriority = {
    'Faulted': 6,
    'Unavailable': 5,
    'Charging': 4,
    'SuspendedEVSE': 3,
    'SuspendedEV': 2,
    'Preparing': 1,
    'Available': 0,
  };

  // Get the highest priority status from all connectors
  const highestStatus = this.connectors.reduce((highest, connector) => {
    const currentPriority = statusPriority[connector.status] || 0;
    return currentPriority > statusPriority[highest] ? connector.status : highest;
  }, 'Available');

  this.status = highestStatus;
  this.isOnline = this.lastHeartbeat && (Date.now() - this.lastHeartbeat.getTime() < 5 * 60 * 1000);
};

// Add a connector to the station
stationSchema.methods.addConnector = function(connectorData) {
  const maxConnectorId = this.connectors.reduce((max, conn) => 
    Math.max(max, conn.connectorId), 0);
  
  const newConnector = {
    connectorId: maxConnectorId + 1,
    status: 'Available',
    ...connectorData,
  };
  
  this.connectors.push(newConnector);
  this.updateStatus();
  return newConnector;
};

// Update connector status
stationSchema.methods.updateConnectorStatus = function(connectorId, status, errorCode) {
  const connector = this.connectors.find(c => c.connectorId === connectorId);
  if (!connector) {
    throw new Error(`Connector ${connectorId} not found`);
  }
  
  connector.status = status;
  if (errorCode) {
    connector.lastError = {
      code: errorCode,
      timestamp: new Date(),
    };
  }
  
  this.updateStatus();
  return connector;
};

// Start a transaction
stationSchema.methods.startTransaction = function(connectorId, idTag, meterStart = 0) {
  const connector = this.connectors.find(c => c.connectorId === connectorId);
  if (!connector) {
    throw new Error(`Connector ${connectorId} not found`);
  }
  
  if (connector.status !== 'Available') {
    throw new Error(`Connector ${connectorId} is not available`);
  }
  
  const transactionId = Math.floor(Math.random() * 1000000).toString();
  
  connector.status = 'Charging';
  connector.currentTransactionId = transactionId;
  connector.lastMeterValue = meterStart;
  connector.lastMeterTimestamp = new Date();
  
  this.updateStatus();
  
  return {
    transactionId,
    idTag,
    connectorId,
    meterStart,
    timestamp: new Date(),
  };
};

// Stop a transaction
stationSchema.methods.stopTransaction = function(transactionId, meterStop, reason = 'Local') {
  const connector = this.connectors.find(c => c.currentTransactionId === transactionId);
  if (!connector) {
    throw new Error(`No active transaction with ID ${transactionId}`);
  }
  
  const transaction = {
    transactionId,
    connectorId: connector.connectorId,
    meterStart: connector.lastMeterValue,
    meterStop: meterStop,
    startTimestamp: connector.lastMeterTimestamp,
    stopTimestamp: new Date(),
    reason,
  };
  
  connector.status = 'Available';
  connector.currentTransactionId = null;
  connector.lastMeterValue = meterStop;
  connector.lastMeterTimestamp = new Date();
  
  this.updateStatus();
  
  return transaction;
};

// Pre-save hook to update status before saving
stationSchema.pre('save', function(next) {
  this.updateStatus();
  next();
});

export const Station = mongoose.model('Station', stationSchema);
