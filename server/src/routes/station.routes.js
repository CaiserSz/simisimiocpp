import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getStations,
  getStation,
  createStation,
  updateStation,
  deleteStation,
  getStationConnectors,
  getStationConnector,
  addConnector,
  updateConnector,
  removeConnector,
  getStationTransactions,
  startTransaction,
  stopTransaction,
  getStationStatus,
  updateStationStatus,
  getStationMeterValues,
  getStationOcppLogs,
  remoteStartTransaction,
  remoteStopTransaction,
  resetStation,
  updateFirmware,
  getDiagnostics,
  getConfiguration,
  changeConfiguration,
} from '../controllers/station.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation middleware
const validateStationCreate = [
  body('id').isString().withMessage('Station ID is required'),
  body('chargePointVendor').isString().withMessage('Vendor is required'),
  body('chargePointModel').isString().withMessage('Model is required'),
  body('firmwareVersion').optional().isString(),
  body('location').isObject().withMessage('Location is required'),
  body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Invalid coordinates'),
  body('location.coordinates.*').isNumeric().withMessage('Coordinates must be numbers'),
  body('address').optional().isObject(),
  body('connectors').optional().isArray(),
  body('power').optional().isNumeric(),
  body('voltage').optional().isNumeric(),
  body('current').optional().isNumeric(),
  body('phase').optional().isNumeric(),
];

const validateStationUpdate = [
  body('chargePointVendor').optional().isString(),
  body('chargePointModel').optional().isString(),
  body('firmwareVersion').optional().isString(),
  body('location').optional().isObject(),
  body('location.coordinates').optional().isArray({ min: 2, max: 2 }),
  body('location.coordinates.*').optional().isNumeric(),
  body('address').optional().isObject(),
  body('power').optional().isNumeric(),
  body('voltage').optional().isNumeric(),
  body('current').optional().isNumeric(),
  body('phase').optional().isNumeric(),
  body('isActive').optional().isBoolean(),
  body('tags').optional().isArray(),
  body('metadata').optional().isObject(),
];

const validateConnector = [
  param('stationId').isString().withMessage('Station ID is required'),
  param('connectorId').isInt({ min: 1 }).withMessage('Connector ID must be a positive integer'),
];

const validateTransactionStart = [
  param('stationId').isString().withMessage('Station ID is required'),
  body('connectorId').isInt({ min: 1 }).withMessage('Connector ID is required'),
  body('idTag').isString().withMessage('ID Tag is required'),
  body('meterStart').optional().isInt({ min: 0 }),
  body('reservationId').optional().isInt({ min: 1 }),
];

const validateTransactionStop = [
  param('stationId').isString().withMessage('Station ID is required'),
  body('transactionId').isInt({ min: 1 }).withMessage('Transaction ID is required'),
  body('meterStop').isInt({ min: 0 }).withMessage('Meter stop value is required'),
  body('reason').optional().isIn(['EmergencyStop', 'EVDisconnected', 'HardReset', 'Local', 'Other', 'PowerLoss', 'Reboot', 'Remote', 'SoftReset', 'UnlockCommand', 'DeAuthorized']),
];

// Station routes
router
  .route('/')
  .get(
    query('status').optional().isIn(['available', 'charging', 'unavailable', 'faulted']),
    query('location').optional().isString(),
    query('distance').optional().isInt({ min: 1, max: 100000 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
    getStations
  )
  .post(
    authorize(['admin', 'operator']),
    ...validateStationCreate,
    createStation
  );

router
  .route('/:id')
  .get(
    param('id').isString().withMessage('Station ID is required'),
    getStation
  )
  .put(
    authorize(['admin', 'operator']),
    param('id').isString().withMessage('Station ID is required'),
    ...validateStationUpdate,
    updateStation
  )
  .delete(
    authorize(['admin']),
    param('id').isString().withMessage('Station ID is required'),
    deleteStation
  );

// Station status
router.get(
  '/:id/status',
  param('id').isString().withMessage('Station ID is required'),
  getStationStatus
);

router.put(
  '/:id/status',
  authorize(['admin', 'operator']),
  param('id').isString().withMessage('Station ID is required'),
  body('status').isIn(['available', 'unavailable', 'faulted']),
  updateStationStatus
);

// Station connectors
router.get(
  '/:stationId/connectors',
  param('stationId').isString().withMessage('Station ID is required'),
  getStationConnectors
);

router.post(
  '/:stationId/connectors',
  authorize(['admin', 'operator']),
  param('stationId').isString().withMessage('Station ID is required'),
  body('connectorId').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['available', 'occupied', 'reserved', 'unavailable', 'faulted']),
  body('type').optional().isString(),
  body('maxPower').optional().isNumeric(),
  body('maxCurrent').optional().isNumeric(),
  body('maxVoltage').optional().isNumeric(),
  addConnector
);

router
  .route('/:stationId/connectors/:connectorId')
  .get(
    ...validateConnector,
    getStationConnector
  )
  .put(
    authorize(['admin', 'operator']),
    ...validateConnector,
    body('status').optional().isIn(['available', 'occupied', 'reserved', 'unavailable', 'faulted']),
    body('maxPower').optional().isNumeric(),
    body('maxCurrent').optional().isNumeric(),
    body('maxVoltage').optional().isNumeric(),
    updateConnector
  )
  .delete(
    authorize(['admin']),
    ...validateConnector,
    removeConnector
  );

// Station transactions
router.get(
  '/:stationId/transactions',
  param('stationId').isString().withMessage('Station ID is required'),
  query('status').optional().isIn(['active', 'completed', 'cancelled']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  getStationTransactions
);

router.post(
  '/:stationId/transactions/start',
  ...validateTransactionStart,
  startTransaction
);

router.post(
  '/:stationId/transactions/stop',
  ...validateTransactionStop,
  stopTransaction
);

// Remote commands
router.post(
  '/:stationId/remote/start',
  authorize(['admin', 'operator']),
  param('stationId').isString().withMessage('Station ID is required'),
  body('connectorId').isInt({ min: 1 }).withMessage('Connector ID is required'),
  body('idTag').isString().withMessage('ID Tag is required'),
  body('chargingProfile').optional().isObject(),
  remoteStartTransaction
);

router.post(
  '/:stationId/remote/stop',
  authorize(['admin', 'operator']),
  param('stationId').isString().withMessage('Station ID is required'),
  body('transactionId').isInt({ min: 1 }).withMessage('Transaction ID is required'),
  remoteStopTransaction
);

// Station management
router.post(
  '/:stationId/reset',
  authorize(['admin', 'operator']),
  param('stationId').isString().withMessage('Station ID is required'),
  body('type').isIn(['soft', 'hard']).withMessage('Reset type must be either soft or hard'),
  resetStation
);

router.post(
  '/:stationId/update-firmware',
  authorize(['admin']),
  param('stationId').isString().withMessage('Station ID is required'),
  body('location').isURL().withMessage('Firmware URL is required'),
  body('retries').optional().isInt({ min: 0 }),
  body('retryInterval').optional().isInt({ min: 0 }),
  updateFirmware
);

// Station diagnostics and configuration
router.get(
  '/:stationId/diagnostics',
  authorize(['admin', 'operator']),
  param('stationId').isString().withMessage('Station ID is required'),
  query('type').optional().isString(),
  getDiagnostics
);

router.get(
  '/:stationId/configuration',
  authorize(['admin', 'operator']),
  param('stationId').isString().withMessage('Station ID is required'),
  query('key').optional().isString(),
  getConfiguration
);

router.put(
  '/:stationId/configuration',
  authorize(['admin']),
  param('stationId').isString().withMessage('Station ID is required'),
  body('key').isString().withMessage('Configuration key is required'),
  body('value').notEmpty().withMessage('Configuration value is required'),
  changeConfiguration
);

// Station logs and meter values
router.get(
  '/:stationId/logs',
  authorize(['admin', 'operator']),
  param('stationId').isString().withMessage('Station ID is required'),
  query('type').optional().isIn(['error', 'warning', 'info', 'debug']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  getStationOcppLogs
);

router.get(
  '/:stationId/meter-values',
  authorize(['admin', 'operator']),
  param('stationId').isString().withMessage('Station ID is required'),
  query('connectorId').optional().isInt({ min: 0 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  getStationMeterValues
);

export default router;
