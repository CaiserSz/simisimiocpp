import { Router } from 'express';
import { param, body } from 'express-validator';
import { USER_ROLES } from '../constants/user.constants.js';
import * as simulatorController from '../controllers/simulator.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { checkValidation } from '../validators/common.validator.js';
import {
    validateConnectorId,
    validateCreateStation,
    validateProfileId,
    validateStationId,
    validateSwitchProtocol,
    validateVehicleConnection
} from '../validators/station.validator.js';

const router = Router();

// Authentication middleware for all simulator routes
// TEMPORARY: Disable for dashboard testing
// router.use(authenticate);
// router.use(authorize([USER_ROLES.ADMIN, USER_ROLES.OPERATOR]));

/**
 * @swagger
 * /api/simulator/overview:
 *   get:
 *     summary: Get simulation overview
 *     description: Returns overview of the simulation including statistics and status
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Simulation overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Statistics'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/overview', simulatorController.getSimulationOverview);

/**
 * @swagger
 * /api/simulator/statistics:
 *   get:
 *     summary: Get simulation statistics
 *     description: Returns detailed statistics about the simulation
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Statistics'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
 * @swagger
 * /api/simulator/stations:
 *   get:
 *     summary: Get all stations
 *     description: Returns a list of all simulated charging stations
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Station'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stations', simulatorController.getStations);

/**
 * @swagger
 * /api/simulator/stations/{stationId}:
 *   get:
 *     summary: Get specific station
 *     description: Returns detailed information about a specific station
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Station identifier
 *     responses:
 *       200:
 *         description: Station retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Station'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stations/:stationId',
    ...validateStationId,
    checkValidation,
    simulatorController.getStation
);

/**
 * @swagger
 * /api/simulator/stations:
 *   post:
 *     summary: Create new station
 *     description: Creates a new charging station simulator
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StationConfig'
 *     responses:
 *       201:
 *         description: Station created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Station'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// TEMPORARY: Skip validation for dashboard testing
router.post('/stations', simulatorController.createStation);

/**
 * @route   POST /api/simulator/stations/from-profile
 * @desc    Create stations from profile
 * @access  Private (Admin/Operator)
 */
router.post('/stations/from-profile',
    ...validateProfileId,
    checkValidation,
    simulatorController.createStationsFromProfile
);

/**
 * @swagger
 * /api/simulator/stations/{stationId}/start:
 *   put:
 *     summary: Start station
 *     description: Starts a stopped charging station simulator
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Station identifier
 *     responses:
 *       200:
 *         description: Station started successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/stations/:stationId/start',
    ...validateStationId,
    checkValidation,
    simulatorController.startStation
);

/**
 * @swagger
 * /api/simulator/stations/{stationId}/stop:
 *   put:
 *     summary: Stop station
 *     description: Stops a running charging station simulator
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Station identifier
 *     responses:
 *       200:
 *         description: Station stopped successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/stations/:stationId/stop',
    ...validateStationId,
    checkValidation,
    simulatorController.stopStation
);

/**
 * @swagger
 * /api/simulator/stations/{stationId}:
 *   delete:
 *     summary: Remove station
 *     description: Removes a charging station simulator
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Station identifier
 *     responses:
 *       200:
 *         description: Station removed successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/stations/:stationId',
    ...validateStationId,
    checkValidation,
    simulatorController.removeStation
);

/**
 * @swagger
 * /api/simulator/stations/start-all:
 *   put:
 *     summary: Start all stations
 *     description: Starts all stopped charging station simulators
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All stations started successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/stations/start-all', simulatorController.startAllStations);

/**
 * @swagger
 * /api/simulator/stations/stop-all:
 *   put:
 *     summary: Stop all stations
 *     description: Stops all running charging station simulators
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All stations stopped successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
    ...validateStationId,
    ...validateSwitchProtocol,
    checkValidation,
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
 * @swagger
 * /api/simulator/stations/{stationId}/connectors/{connectorId}/vehicle/connect:
 *   post:
 *     summary: Simulate vehicle connection
 *     description: Simulates a vehicle connecting to a charging connector
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Station identifier
 *       - in: path
 *         name: connectorId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Connector identifier
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: [compact, sedan, suv, delivery]
 *                 description: Type of vehicle
 *               initialSoC:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Initial state of charge percentage
 *               targetSoC:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Target state of charge percentage
 *               userScenario:
 *                 type: string
 *                 enum: [normal, hasty, careful]
 *                 description: User charging scenario
 *     responses:
 *       200:
 *         description: Vehicle connected successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/stations/:stationId/connectors/:connectorId/vehicle/connect',
    ...validateStationId,
    ...validateConnectorId,
    ...validateVehicleConnection,
    checkValidation,
    simulatorController.simulateVehicleConnection
);

/**
 * @route   DELETE /api/simulator/stations/:stationId/connectors/:connectorId/vehicle
 * @desc    Simulate vehicle disconnection
 * @access  Private (Admin/Operator)
 */
router.delete('/stations/:stationId/connectors/:connectorId/vehicle', [
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
router.post('/stations/:stationId/connectors/:connectorId/charging/start', [
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
router.post('/stations/:stationId/connectors/:connectorId/charging/stop', [
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
router.post('/stations/:stationId/connectors/:connectorId/scenario', [
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
router.post('/scenarios/:scenarioId/run', [
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

/**
 * @route   POST /api/simulator/stations/:stationId/clone
 * @desc    Clone station
 * @access  Private (Admin/Operator)
 */
router.post('/stations/:stationId/clone',
    param('stationId').notEmpty().withMessage('Station ID is required'),
    simulatorController.cloneStation
);

/**
 * @swagger
 * /api/simulator/health:
 *   get:
 *     summary: Get health summary
 *     description: Returns health status of all stations and simulation system
 *     tags: [Simulator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, warning, critical]
 *                     stations:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/health', simulatorController.getHealthSummary);

/**
 * @route   GET /api/simulator/stations/:stationId/health
 * @desc    Get station health
 * @access  Private (Admin/Operator)
 */
router.get('/stations/:stationId/health',
    param('stationId').notEmpty().withMessage('Station ID is required'),
    simulatorController.getStationHealth
);

/**
 * @route   GET /api/simulator/stations/:stationId/history
 * @desc    Get station history
 * @access  Private (Admin/Operator)
 */
router.get('/stations/:stationId/history',
    param('stationId').notEmpty().withMessage('Station ID is required'),
    simulatorController.getStationHistory
);

/**
 * @route   GET /api/simulator/groups
 * @desc    Get all groups
 * @access  Private (Admin/Operator)
 */
router.get('/groups', simulatorController.getGroups);

/**
 * @route   GET /api/simulator/groups/:groupId/stations
 * @desc    Get stations by group
 * @access  Private (Admin/Operator)
 */
router.get('/groups/:groupId/stations',
    param('groupId').notEmpty().withMessage('Group ID is required'),
    simulatorController.getStationsByGroup
);

/**
 * @route   GET /api/simulator/networks
 * @desc    Get all networks
 * @access  Private (Admin/Operator)
 */
router.get('/networks', simulatorController.getNetworks);

/**
 * @route   GET /api/simulator/networks/:networkId/stations
 * @desc    Get stations by network
 * @access  Private (Admin/Operator)
 */
router.get('/networks/:networkId/stations',
    param('networkId').notEmpty().withMessage('Network ID is required'),
    simulatorController.getStationsByNetwork
);

/**
 * @route   POST /api/simulator/batch/start
 * @desc    Batch start stations
 * @access  Private (Admin/Operator)
 */
router.post('/batch/start',
    body('stationIds').isArray().withMessage('stationIds must be an array'),
    body('stationIds.*').isString().withMessage('Each station ID must be a string'),
    simulatorController.batchStartStations
);

/**
 * @route   POST /api/simulator/batch/stop
 * @desc    Batch stop stations
 * @access  Private (Admin/Operator)
 */
router.post('/batch/stop',
    body('stationIds').isArray().withMessage('stationIds must be an array'),
    body('stationIds.*').isString().withMessage('Each station ID must be a string'),
    simulatorController.batchStopStations
);

/**
 * @route   POST /api/simulator/batch/update
 * @desc    Batch update stations
 * @access  Private (Admin/Operator)
 */
router.post('/batch/update',
    body('stationIds').isArray().withMessage('stationIds must be an array'),
    body('updates').isObject().withMessage('updates must be an object'),
    simulatorController.batchUpdateStations
);

/**
 * @route   GET /api/simulator/health/:status
 * @desc    Get stations by health status
 * @access  Private (Admin/Operator)
 */
router.get('/health/:status',
    param('status').isIn(['healthy', 'warning', 'critical']).withMessage('Invalid health status'),
    simulatorController.getStationsByHealthStatus
);

/**
 * @route   POST /api/simulator/backup
 * @desc    Create backup
 * @access  Private (Admin)
 */
router.post('/backup',
    authorize(['admin']),
    simulatorController.createBackup
);

/**
 * @route   GET /api/simulator/backups
 * @desc    List backups
 * @access  Private (Admin/Operator)
 */
router.get('/backups', simulatorController.listBackups);

/**
 * @route   POST /api/simulator/backup/restore
 * @desc    Restore from backup
 * @access  Private (Admin)
 */
router.post('/backup/restore',
    authorize(['admin']),
    body('backupFile').notEmpty().withMessage('backupFile is required'),
    simulatorController.restoreFromBackup
);

export default router;
