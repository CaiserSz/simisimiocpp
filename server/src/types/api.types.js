/**
 * API Type Definitions (JSDoc)
 * 
 * Created: 2025-01-11
 * Purpose: Type definitions for API requests and responses using JSDoc
 */

/**
 * @typedef {Object} User
 * @property {string} id - User ID
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {string} role - User role (admin, operator, user, guest)
 * @property {string[]} permissions - User permissions
 * @property {boolean} isActive - Whether user is active
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {string} createdAt - Creation timestamp (ISO 8601)
 * @property {string} updatedAt - Last update timestamp (ISO 8601)
 * @property {string|null} lastLogin - Last login timestamp (ISO 8601)
 */

/**
 * @typedef {Object} StationConfig
 * @property {string} [stationId] - Station ID (auto-generated if not provided)
 * @property {string} vendor - Vendor name
 * @property {string} [model] - Station model
 * @property {string} [ocppVersion] - OCPP version ('1.6J' or '2.0.1')
 * @property {number} [maxPower] - Maximum power in watts
 * @property {number} [connectorCount] - Number of connectors (1-10)
 * @property {string} [csmsUrl] - CSMS WebSocket URL
 * @property {number} [heartbeatInterval] - Heartbeat interval in seconds
 * @property {string} [groupId] - Group ID
 * @property {string} [networkId] - Network ID
 * @property {Object} [location] - Location information
 */

/**
 * @typedef {Object} StationStatus
 * @property {string} stationId - Station ID
 * @property {boolean} isOnline - Whether station is online
 * @property {string} status - Station status
 * @property {Object} connectors - Connector statuses
 * @property {Object} ocpp - OCPP connection status
 * @property {Object} health - Health information
 * @property {number} healthScore - Health score (0-100)
 */

/**
 * @typedef {Object} ConnectorStatus
 * @property {number} connectorId - Connector ID
 * @property {string} status - Connector status
 * @property {Object|null} vehicle - Connected vehicle information
 * @property {number} [currentPower] - Current power in watts
 * @property {number} [energyDelivered] - Energy delivered in kWh
 */

/**
 * @typedef {Object} VehicleConfig
 * @property {string} [vehicleType] - Vehicle type (sedan, suv, truck, etc.)
 * @property {number} [initialSoC] - Initial state of charge (0-100)
 * @property {number} [targetSoC] - Target state of charge (0-100)
 * @property {string} [userScenario] - User scenario (normal, hasty, careful)
 */

/**
 * @typedef {Object} SimulationStatistics
 * @property {number} totalStations - Total number of stations
 * @property {number} activeStations - Number of active stations
 * @property {number} totalSessions - Total charging sessions
 * @property {number} totalEnergyDelivered - Total energy delivered (kWh)
 * @property {number} averageSessionDuration - Average session duration (minutes)
 * @property {Object} protocolDistribution - Distribution by OCPP version
 */

/**
 * @typedef {Object} APIResponse
 * @property {boolean} success - Whether request was successful
 * @property {*} [data] - Response data
 * @property {Object} [error] - Error information
 * @property {Object} [meta] - Metadata (requestId, timestamp, etc.)
 */

/**
 * @typedef {Object} APIError
 * @property {string} code - Error code
 * @property {string} message - Error message
 * @property {*} [details] - Additional error details
 * @property {string} [stack] - Stack trace (development only)
 */

/**
 * @typedef {Object} PaginationMeta
 * @property {number} page - Current page number
 * @property {number} limit - Items per page
 * @property {number} total - Total number of items
 * @property {number} totalPages - Total number of pages
 * @property {boolean} hasNext - Whether there is a next page
 * @property {boolean} hasPrev - Whether there is a previous page
 */

/**
 * @typedef {Object} OCPPMessage
 * @property {number} messageType - Message type (2=CALL, 3=CALLRESULT, 4=CALLERROR)
 * @property {string} messageId - Unique message ID
 * @property {string} action - OCPP action name
 * @property {*} payload - Message payload
 */

/**
 * @typedef {Object} StationProfile
 * @property {string} name - Profile name
 * @property {string} vendor - Vendor name
 * @property {string} model - Station model
 * @property {number} connectorCount - Number of connectors
 * @property {number} maxPower - Maximum power (watts)
 * @property {string} ocppVersion - OCPP version
 * @property {number} heartbeatInterval - Heartbeat interval (seconds)
 * @property {string[]} supportedStandards - Supported connector standards
 * @property {string} location - Location type
 * @property {string} description - Profile description
 */

/**
 * @typedef {Object} ScenarioConfig
 * @property {string} name - Scenario name
 * @property {string} description - Scenario description
 * @property {number} duration - Duration in seconds
 * @property {Object[]} stations - Station configurations
 * @property {Object[]} vehicleScenarios - Vehicle scenario configurations
 * @property {Object[]} events - Scenario events
 */

export default {};