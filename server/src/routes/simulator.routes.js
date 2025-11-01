import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as simulatorController from '../controllers/simulator.controller.js';

const router = Router();

// Authentication middleware for all simulator routes
router.use(authenticate);
router.use(authorize(['admin', 'operator'])); // Only admin and operators can control simulator

/**
 * @route   GET /api/simulator/overview
 * @desc    Get simulation overview
 * @access  Private (Admin/Operator)
 */
router.get('/overview', simulatorController.getSimulationOverview);

/**
 * @route   GET /api/simulator/statistics
 * @desc    Get simulation statistics
 * @access  Private (Admin/Operator)
 */
router.get('/statistics', simulatorController.getStatistics);

/**
 * @route   GET /api/simulator/profiles
 * @desc    Get available station profiles
 * @access  Private (Admin/Operator)
 */
router.get('/profiles', simulatorController.getProfiles);

/**
 * @route   GET /api/simulator/scenarios
 * @desc    Get available scenarios
 * @access  Private (Admin/Operator)
 */
router.get('/scenarios', simulatorController.getScenarios);

/**
 * @route   GET /api/simulator/stations
 * @desc    Get all stations
 * @access  Private (Admin/Operator)
 */
router.get('/stations', simulatorController.getStations);

/**
 * @route   GET /api/simulator/stations/:stationId
 * @desc    Get specific station
 * @access  Private (Admin/Operator)
 */
router.get('/stations/:stationId', 
  param('stationId').notEmpty().withMessage('Station ID is required'),
  simulatorController.getStation
);

/**
 * @route   POST /api/simulator/stations
 * @desc    Create new station
 * @access  Private (Admin/Operator)
 */
router.post('/stations',
  [
    body('vendor').optional().isString().withMessage('Vendor must be a string'),
    body('model').optional().isString().withMessage('Model must be a string'),
    body('ocppVersion').isIn(['1.6J', '2.0.1']).withMessage('OCPP version must be 1.6J or 2.0.1'),
    body('connectorCount').optional().isInt({ min: 1, max: 10 }).withMessage('Connector count must be between 1 and 10'),
    body('maxPower').optional().isInt({ min: 1000 }).withMessage('Max power must be at least 1000W'),
    body('csmsUrl').matches(/^wss?:\/\/.+/).withMessage('CSMS URL must be a valid WebSocket URL (ws:// or wss://)'),
    body('heartbeatInterval').optional().isInt({ min: 60, max: 3600 }).withMessage('Heartbeat interval must be between 60 and 3600 seconds')
  ],
  simulatorController.createStation
);

/**
 * @route   POST /api/simulator/stations/from-profile
 * @desc    Create stations from profile
 * @access  Private (Admin/Operator)
 */
router.post('/stations/from-profile',
  [
    body('profileId').notEmpty().withMessage('Profile ID is required'),
    body('count').isInt({ min: 1, max: 100 }).withMessage('Count must be between 1 and 100'),
    body('options.csmsUrl').optional().isURL().withMessage('CSMS URL must be valid'),
    body('options.autoStart').optional().isBoolean().withMessage('Auto start must be boolean')
  ],
  simulatorController.createStationsFromProfile
);

/**
 * @route   PUT /api/simulator/stations/:stationId/start
 * @desc    Start station
 * @access  Private (Admin/Operator)
 */
router.put('/stations/:stationId/start',
  param('stationId').notEmpty().withMessage('Station ID is required'),
  simulatorController.startStation
);

/**
 * @route   PUT /api/simulator/stations/:stationId/stop
 * @desc    Stop station
 * @access  Private (Admin/Operator)
 */
router.put('/stations/:stationId/stop',
  param('stationId').notEmpty().withMessage('Station ID is required'),
  simulatorController.stopStation
);

/**
 * @route   DELETE /api/simulator/stations/:stationId
 * @desc    Remove station
 * @access  Private (Admin/Operator)
 */
router.delete('/stations/:stationId',
  param('stationId').notEmpty().withMessage('Station ID is required'),
  simulatorController.removeStation
);

/**
 * @route   PUT /api/simulator/stations/start-all
 * @desc    Start all stations
 * @access  Private (Admin/Operator)
 */
router.put('/stations/start-all', simulatorController.startAllStations);

/**
 * @route   PUT /api/simulator/stations/stop-all
 * @desc    Stop all stations
 * @access  Private (Admin/Operator)
 */
router.put('/stations/stop-all', simulatorController.stopAllStations);

/**
 * @route   DELETE /api/simulator/stations/remove-all
 * @desc    Remove all stations
 * @access  Private (Admin/Operator)
 */
router.delete('/stations/remove-all', simulatorController.removeAllStations);

/**
 * @route   PUT /api/simulator/stations/:stationId/protocol
 * @desc    Switch station protocol
 * @access  Private (Admin/Operator)
 */
router.put('/stations/:stationId/protocol',
  [
    param('stationId').notEmpty().withMessage('Station ID is required'),
    body('protocol').isIn(['1.6J', '2.0.1']).withMessage('Protocol must be 1.6J or 2.0.1')
  ],
  simulatorController.switchStationProtocol
);

/**
 * @route   PUT /api/simulator/stations/:stationId/config
 * @desc    Update station configuration
 * @access  Private (Admin/Operator)
 */
router.put('/stations/:stationId/config',
  param('stationId').notEmpty().withMessage('Station ID is required'),
  simulatorController.updateStationConfig
);

/**
 * @route   POST /api/simulator/stations/:stationId/connectors/:connectorId/vehicle/connect
 * @desc    Simulate vehicle connection
 * @access  Private (Admin/Operator)
 */
router.post('/stations/:stationId/connectors/:connectorId/vehicle/connect',
  [
    param('stationId').notEmpty().withMessage('Station ID is required'),
    param('connectorId').isInt({ min: 1 }).withMessage('Connector ID must be a positive integer'),
    body('vehicleType').optional().isIn(['compact', 'sedan', 'suv', 'delivery']).withMessage('Invalid vehicle type'),
    body('initialSoC').optional().isFloat({ min: 0, max: 100 }).withMessage('Initial SoC must be between 0 and 100'),
    body('targetSoC').optional().isFloat({ min: 0, max: 100 }).withMessage('Target SoC must be between 0 and 100'),
    body('userScenario').optional().isIn(['normal', 'hasty', 'careful']).withMessage('Invalid user scenario')
  ],
  simulatorController.simulateVehicleConnection
);

/**
 * @route   DELETE /api/simulator/stations/:stationId/connectors/:connectorId/vehicle
 * @desc    Simulate vehicle disconnection
 * @access  Private (Admin/Operator)
 */
router.delete('/stations/:stationId/connectors/:connectorId/vehicle',
  [
    param('stationId').notEmpty().withMessage('Station ID is required'),
    param('connectorId').isInt({ min: 1 }).withMessage('Connector ID must be a positive integer')
  ],
  simulatorController.simulateVehicleDisconnection
);

/**
 * @route   POST /api/simulator/stations/:stationId/connectors/:connectorId/charging/start
 * @desc    Start charging session
 * @access  Private (Admin/Operator)
 */
router.post('/stations/:stationId/connectors/:connectorId/charging/start',
  [
    param('stationId').notEmpty().withMessage('Station ID is required'),
    param('connectorId').isInt({ min: 1 }).withMessage('Connector ID must be a positive integer'),
    body('idTag').notEmpty().withMessage('ID tag is required'),
    body('chargingProfile').optional().isObject().withMessage('Charging profile must be an object')
  ],
  simulatorController.startChargingSession
);

/**
 * @route   POST /api/simulator/stations/:stationId/connectors/:connectorId/charging/stop
 * @desc    Stop charging session
 * @access  Private (Admin/Operator)
 */
router.post('/stations/:stationId/connectors/:connectorId/charging/stop',
  [
    param('stationId').notEmpty().withMessage('Station ID is required'),
    param('connectorId').isInt({ min: 1 }).withMessage('Connector ID must be a positive integer')
  ],
  simulatorController.stopChargingSession
);

/**
 * @route   POST /api/simulator/stations/:stationId/connectors/:connectorId/scenario
 * @desc    Execute user scenario
 * @access  Private (Admin/Operator)
 */
router.post('/stations/:stationId/connectors/:connectorId/scenario',
  [
    param('stationId').notEmpty().withMessage('Station ID is required'),
    param('connectorId').isInt({ min: 1 }).withMessage('Connector ID must be a positive integer'),
    body('scenario').isIn(['emergency_stop', 'user_disconnect', 'change_target_soc', 'payment_issue']).withMessage('Invalid scenario')
  ],
  simulatorController.simulateUserScenario
);

/**
 * @route   POST /api/simulator/scenarios/:scenarioId/run
 * @desc    Run predefined scenario
 * @access  Private (Admin/Operator)
 */
router.post('/scenarios/:scenarioId/run',
  [
    param('scenarioId').notEmpty().withMessage('Scenario ID is required'),
    body('clearExisting').optional().isBoolean().withMessage('Clear existing must be boolean'),
    body('manualStop').optional().isBoolean().withMessage('Manual stop must be boolean')
  ],
  simulatorController.runScenario
);

/**
 * @route   GET /api/simulator/export
 * @desc    Export simulation configuration
 * @access  Private (Admin/Operator)
 */
router.get('/export', simulatorController.exportConfiguration);

/**
 * @route   POST /api/simulator/import
 * @desc    Import simulation configuration
 * @access  Private (Admin/Operator)
 */
router.post('/import',
  body('stations').isArray().withMessage('Stations must be an array'),
  simulatorController.importConfiguration
);

// Vehicle scenario presets endpoint
/**
 * @route   GET /api/simulator/vehicle-scenarios
 * @desc    Get predefined vehicle scenarios
 * @access  Private (Admin/Operator)
 */
router.get('/vehicle-scenarios', (req, res) => {
  res.json({
    success: true,
    data: {
      scenarios: {
        'quick_charge': {
          name: 'Quick Charge',
          description: 'Fast charging session (20% → 80%)',
          vehicleType: 'compact',
          initialSoC: 20,
          targetSoC: 80,
          userScenario: 'hasty',
          estimatedDuration: '45 minutes'
        },
        'full_charge': {
          name: 'Full Charge',
          description: 'Complete charging session (15% → 100%)',
          vehicleType: 'sedan',
          initialSoC: 15,
          targetSoC: 100,
          userScenario: 'normal',
          estimatedDuration: '4-6 hours'
        },
        'top_up': {
          name: 'Top Up',
          description: 'Quick top-up session (70% → 90%)',
          vehicleType: 'suv',
          initialSoC: 70,
          targetSoC: 90,
          userScenario: 'careful',
          estimatedDuration: '30 minutes'
        },
        'delivery_charge': {
          name: 'Delivery Vehicle',
          description: 'Commercial vehicle charging (25% → 95%)',
          vehicleType: 'delivery',
          initialSoC: 25,
          targetSoC: 95,
          userScenario: 'normal',
          estimatedDuration: '2-3 hours'
        }
      }
    }
  });
});

// Real-time data endpoints
/**
 * @route   GET /api/simulator/realtime/stations
 * @desc    Get real-time station data
 * @access  Private (Admin/Operator)
 */
router.get('/realtime/stations', (req, res) => {
  const stations = simulatorController.simulationManager.getAllStationsStatus();
  
  // Transform data for real-time dashboard
  const realtimeData = Object.values(stations).map(station => ({
    stationId: station.stationId,
    status: station.status,
    isOnline: station.isOnline,
    protocol: station.config.ocppVersion,
    connectors: station.connectors.map(c => ({
      connectorId: c.connectorId,
      status: c.status,
      currentPower: Math.round(c.currentPower),
      energyDelivered: Math.round(c.energyDelivered * 100) / 100,
      hasActiveTransaction: !!c.transaction,
      vehicle: station.connectors.find(conn => conn.connectorId === c.connectorId)?.vehicle || null
    })),
    location: station.config.location || 'unknown',
    vendor: station.config.vendor,
    model: station.config.model
  }));

  res.json({
    success: true,
    data: {
      stations: realtimeData,
      timestamp: new Date().toISOString(),
      statistics: simulatorController.simulationManager.getStatistics()
    }
  });
});

/**
 * @route   GET /api/simulator/health
 * @desc    Get simulator health status
 * @access  Private (Admin/Operator)
 */
router.get('/health', (req, res) => {
  const statistics = simulatorController.simulationManager.getStatistics();
  
  res.json({
    success: true,
    data: {
      status: 'healthy',
      simulator: {
        isRunning: statistics.isRunning,
        totalStations: statistics.totalStations,
        activeStations: statistics.activeStations,
        uptime: statistics.uptime
      },
      protocols: statistics.protocolDistribution,
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
