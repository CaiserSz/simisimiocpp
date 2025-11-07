/**
 * Station Type Definitions (JSDoc)
 * 
 * Created: 2025-01-11
 * Purpose: Type definitions for station-related entities
 */

/**
 * @typedef {Object} Station
 * @property {string} stationId - Unique station identifier
 * @property {string} vendor - Vendor name
 * @property {string} model - Station model
 * @property {string} ocppVersion - OCPP protocol version
 * @property {number} maxPower - Maximum power in watts
 * @property {number} connectorCount - Number of connectors
 * @property {string} csmsUrl - CSMS WebSocket URL
 * @property {number} heartbeatInterval - Heartbeat interval in seconds
 * @property {boolean} isOnline - Whether station is online
 * @property {string} status - Station status
 * @property {Object} health - Health information
 * @property {Object[]} connectors - Connector information
 * @property {Object} metrics - Performance metrics
 * @property {Object[]} history - Event history
 */

/**
 * @typedef {Object} Connector
 * @property {number} connectorId - Connector ID (1-based)
 * @property {string} status - Connector status
 * @property {Object|null} vehicle - Connected vehicle
 * @property {number} currentPower - Current power in watts
 * @property {number} energyDelivered - Energy delivered in kWh
 * @property {number} voltage - Voltage in volts
 * @property {number} current - Current in amperes
 * @property {string} lastStatusUpdate - Last status update timestamp
 */

/**
 * @typedef {Object} Vehicle
 * @property {string} id - Vehicle ID
 * @property {string} type - Vehicle type
 * @property {number} batteryCapacity - Battery capacity in kWh
 * @property {number} currentSoC - Current state of charge (0-100)
 * @property {number} targetSoC - Target state of charge (0-100)
 * @property {number} maxChargingPower - Maximum charging power in watts
 * @property {Object} profile - Vehicle charging profile
 * @property {number} estimatedChargingTime - Estimated charging time in minutes
 */

/**
 * @typedef {Object} StationHealth
 * @property {string} status - Health status (healthy, warning, critical, offline)
 * @property {number} score - Health score (0-100)
 * @property {Object} metrics - Health metrics
 * @property {string} lastCheck - Last health check timestamp
 * @property {Object[]} issues - Health issues
 */

/**
 * @typedef {Object} StationMetrics
 * @property {number} totalSessions - Total charging sessions
 * @property {number} totalEnergyDelivered - Total energy delivered (kWh)
 * @property {number} averageSessionDuration - Average session duration (minutes)
 * @property {number} uptime - Uptime percentage
 * @property {number} averageResponseTime - Average response time (ms)
 * @property {number} errorRate - Error rate percentage
 */

/**
 * @typedef {Object} StationHistory
 * @property {string} timestamp - Event timestamp
 * @property {string} type - Event type
 * @property {string} action - Action performed
 * @property {Object} data - Event data
 * @property {string} [stationId] - Station ID
 * @property {number} [connectorId] - Connector ID
 */

/**
 * @typedef {Object} NetworkConfig
 * @property {string} networkId - Network ID
 * @property {string} name - Network name
 * @property {string} csmsUrl - CSMS WebSocket URL
 * @property {number} latency - Network latency (ms)
 * @property {number} packetLoss - Packet loss percentage
 * @property {number} disconnectionRate - Disconnection rate
 * @property {string[]} stationIds - Station IDs in this network
 */

/**
 * @typedef {Object} GroupConfig
 * @property {string} groupId - Group ID
 * @property {string} name - Group name
 * @property {string} type - Group type (location, operator)
 * @property {Object} location - Location information
 * @property {string} operator - Operator name
 * @property {string} description - Group description
 * @property {string[]} stationIds - Station IDs in this group
 */

export default {};