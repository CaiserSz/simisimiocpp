import mongoose from 'mongoose';

const meterValueSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  sampledValue: [{
    value: { type: String, required: true },
    context: { type: String, enum: ['Interruption.Begin', 'Interruption.End', 'Sample.Clock', 'Sample.Periodic', 'Transaction.Begin', 'Transaction.End', 'Trigger', 'Other'], default: 'Sample.Periodic' },
    format: { type: String, enum: ['Raw', 'SignedData'], default: 'Raw' },
    measurand: { 
      type: String, 
      enum: [
        'Energy.Active.Export.Register',
        'Energy.Active.Import.Register',
        'Energy.Reactive.Export.Register',
        'Energy.Reactive.Import.Register',
        'Energy.Active.Export.Interval',
        'Energy.Active.Import.Interval',
        'Energy.Reactive.Export.Interval',
        'Energy.Reactive.Import.Interval',
        'Power.Active.Export',
        'Power.Active.Import',
        'Power.Offered',
        'Power.Reactive.Export',
        'Power.Reactive.Import',
        'Power.Factor',
        'Current.Import',
        'Current.Export',
        'Current.Offered',
        'Voltage',
        'Frequency',
        'Temperature',
        'SoC',
        'RPM'
      ],
      required: true
    },
    phase: { type: String, enum: ['L1', 'L2', 'L3', 'N', 'L1-N', 'L2-N', 'L3-N', 'L1-L2', 'L2-L3', 'L3-L1'] },
    location: { type: String, enum: ['Cable', 'EV', 'Inlet', 'Outlet', 'Body'], default: 'Outlet' },
    unit: { type: String, enum: ['Wh', 'kWh', 'varh', 'kvarh', 'W', 'kW', 'VA', 'kVA', 'var', 'kvar', 'A', 'V', 'K', 'Celcius', 'Fahrenheit', 'Percent'], required: true }
  }]
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, index: true },
  idTag: { type: String, required: true, index: true },
  stationId: { type: String, required: true, index: true },
  connectorId: { type: Number, required: true },
  meterStart: { type: Number, required: true },
  meterStop: { type: Number },
  startTimestamp: { type: Date, required: true, index: true },
  stopTimestamp: { type: Date, index: true },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'reserved', 'cancelled', 'suspendedEVSE', 'suspendedEV'],
    default: 'active'
  },
  stopReason: { 
    type: String,
    enum: [
      'EmergencyStop',
      'EVDisconnected',
      'HardReset',
      'Local',
      'Other',
      'PowerLoss',
      'Reboot',
      'Remote',
      'SoftReset',
      'UnlockCommand',
      'DeAuthorized'
    ]
  },
  remoteStartId: { type: Number },
  chargingProfile: { type: mongoose.Schema.Types.Mixed },
  meterValues: [meterValueSchema],
  totalEnergyKwh: { type: Number },
  totalDurationSec: { type: Number },
  totalCost: { 
    amount: { type: Number },
    currency: { type: String, default: 'TRY' }
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stationData: {
    chargePointVendor: String,
    chargePointModel: String,
    connectorType: String,
    maxPowerKw: Number,
    maxCurrentA: Number,
    maxVoltageV: Number,
  },
  userData: {
    idTag: String,
    name: String,
    email: String,
    phone: String,
  },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
transactionSchema.index({ stationId: 1, status: 1 });
transactionSchema.index({ idTag: 1, status: 1 });
transactionSchema.index({ startTimestamp: -1 });
transactionSchema.index({ stopTimestamp: -1 });

// Virtual for duration in seconds
transactionSchema.virtual('durationSeconds').get(function() {
  if (!this.startTimestamp) return 0;
  const end = this.stopTimestamp || new Date();
  return Math.floor((end - this.startTimestamp) / 1000);
});

// Virtual for energy consumed in kWh
transactionSchema.virtual('energyKwh').get(function() {
  if (this.meterStop !== undefined && this.meterStart !== undefined) {
    return (this.meterStop - this.meterStart) / 1000; // Assuming meter values are in Wh
  }
  return 0;
});

// Pre-save hook to calculate totals
const calculateTotals = function(next) {
  if (this.isModified('meterStop') && this.meterStop !== undefined && this.meterStart !== undefined) {
    this.totalEnergyKwh = (this.meterStop - this.meterStart) / 1000; // Convert Wh to kWh
  }
  
  if (this.startTimestamp && (this.isModified('stopTimestamp') || this.isNew)) {
    const end = this.stopTimestamp || new Date();
    this.totalDurationSec = Math.floor((end - this.startTimestamp) / 1000);
  }
  
  // Simple cost calculation (can be replaced with more complex tariff logic)
  if (this.totalEnergyKwh) {
    const ratePerKwh = 2.5; // Default rate in TRY/kWh
    this.totalCost = {
      amount: parseFloat((this.totalEnergyKwh * ratePerKwh).toFixed(2)),
      currency: 'TRY'
    };
  }
  
  next();
};

transactionSchema.pre('save', calculateTotals);

// Static method to find active transactions
transactionSchema.statics.findActive = function(conditions = {}) {
  return this.find({ ...conditions, status: 'active' });
};

// Static method to find completed transactions
transactionSchema.statics.findCompleted = function(conditions = {}) {
  return this.find({ ...conditions, status: 'completed' });
};

// Method to stop a transaction
transactionSchema.methods.complete = async function(stopParams = {}) {
  if (this.status !== 'active') {
    throw new Error('Only active transactions can be completed');
  }
  
  this.status = 'completed';
  this.stopTimestamp = stopParams.timestamp || new Date();
  this.stopReason = stopParams.reason || 'Local';
  this.meterStop = stopParams.meterStop;
  
  if (stopParams.meterValues) {
    this.meterValues = this.meterValues || [];
    this.meterValues.push(...stopParams.meterValues);
  }
  
  return this.save();
};

// Method to add meter values to a transaction
transactionSchema.methods.addMeterValues = function(meterValues) {
  if (this.status !== 'active') {
    throw new Error('Can only add meter values to active transactions');
  }
  
  this.meterValues = this.meterValues || [];
  this.meterValues.push(...meterValues);
  
  // Update the last meter value
  if (meterValues.length > 0) {
    const lastMeterValue = meterValues[meterValues.length - 1];
    const activeEnergy = lastMeterValue.sampledValue.find(
      sv => sv.measurand === 'Energy.Active.Import.Register' && sv.location === 'Outlet'
    );
    
    if (activeEnergy) {
      this.meterStop = parseInt(activeEnergy.value, 10);
    }
  }
  
  return this.save();
};

export const Transaction = mongoose.model('Transaction', transactionSchema);
