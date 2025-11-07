/**
 * Station Validation Schemas
 * 
 * Created: 2025-01-11
 * Purpose: Centralized validation for station-related endpoints
 */

import { body, param, query } from 'express-validator';
import { OCPP_VERSIONS, OCPP_CONNECTOR_STATUS } from '../constants/ocpp.constants.js';
import { STATION_TYPES, POWER_LIMITS } from '../constants/station.constants.js';

/**
 * Station ID parameter validation
 */
export const validateStationId = [
    param('stationId')
        .trim()
        .notEmpty()
        .withMessage('Station ID is required')
        .matches(/^[A-Za-z0-9_-]+$/)
        .withMessage('Station ID contains invalid characters')
];

/**
 * Connector ID parameter validation
 */
export const validateConnectorId = [
    param('connectorId')
        .isInt({ min: 1 })
        .withMessage('Connector ID must be a positive integer')
];

/**
 * Create station validation schema
 */
export const validateCreateStation = [
    body('stationId')
        .optional()
        .trim()
        .matches(/^[A-Za-z0-9_-]+$/)
        .withMessage('Station ID contains invalid characters'),
    
    body('vendor')
        .trim()
        .notEmpty()
        .withMessage('Vendor is required')
        .isLength({ max: 50 })
        .withMessage('Vendor name must be less than 50 characters'),
    
    body('model')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Model name must be less than 50 characters'),
    
    body('ocppVersion')
        .optional()
        .isIn(Object.values(OCPP_VERSIONS))
        .withMessage(`OCPP version must be one of: ${Object.values(OCPP_VERSIONS).join(', ')}`),
    
    body('maxPower')
        .optional()
        .isInt({ min: POWER_LIMITS.MIN, max: POWER_LIMITS.MAX })
        .withMessage(`Max power must be between ${POWER_LIMITS.MIN}W and ${POWER_LIMITS.MAX}W`),
    
    body('connectorCount')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Connector count must be between 1 and 10'),
    
    body('csmsUrl')
        .optional()
        .isURL({ protocols: ['ws', 'wss'] })
        .withMessage('CSMS URL must be a valid WebSocket URL (ws:// or wss://)')
];

/**
 * Update station config validation schema
 */
export const validateUpdateStationConfig = [
    body('maxPower')
        .optional()
        .isInt({ min: POWER_LIMITS.MIN, max: POWER_LIMITS.MAX })
        .withMessage(`Max power must be between ${POWER_LIMITS.MIN}W and ${POWER_LIMITS.MAX}W`),
    
    body('heartbeatInterval')
        .optional()
        .isInt({ min: 60, max: 3600 })
        .withMessage('Heartbeat interval must be between 60 and 3600 seconds'),
    
    body('connectorCount')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Connector count must be between 1 and 10')
];

/**
 * Switch protocol validation schema
 */
export const validateSwitchProtocol = [
    body('ocppVersion')
        .isIn(Object.values(OCPP_VERSIONS))
        .withMessage(`OCPP version must be one of: ${Object.values(OCPP_VERSIONS).join(', ')}`)
];

/**
 * Vehicle connection validation schema
 */
export const validateVehicleConnection = [
    body('vehicleType')
        .optional()
        .isIn(['sedan', 'suv', 'truck', 'motorcycle', 'bus'])
        .withMessage('Invalid vehicle type'),
    
    body('initialSoC')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Initial SoC must be between 0 and 100'),
    
    body('targetSoC')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Target SoC must be between 0 and 100')
];

/**
 * Connector status validation schema
 */
export const validateConnectorStatus = [
    body('status')
        .isIn(Object.values(OCPP_CONNECTOR_STATUS))
        .withMessage(`Status must be one of: ${Object.values(OCPP_CONNECTOR_STATUS).join(', ')}`)
];

/**
 * Profile ID validation
 */
export const validateProfileId = [
    param('profileId')
        .trim()
        .notEmpty()
        .withMessage('Profile ID is required')
        .isIn(Object.values(STATION_TYPES))
        .withMessage(`Profile ID must be one of: ${Object.values(STATION_TYPES).join(', ')}`)
];

/**
 * Scenario ID validation
 */
export const validateScenarioId = [
    param('scenarioId')
        .trim()
        .notEmpty()
        .withMessage('Scenario ID is required')
];

/**
 * Pagination query validation
 */
export const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];

export default {
    validateStationId,
    validateConnectorId,
    validateCreateStation,
    validateUpdateStationConfig,
    validateSwitchProtocol,
    validateVehicleConnection,
    validateConnectorStatus,
    validateProfileId,
    validateScenarioId,
    validatePagination
};

