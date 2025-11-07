/**
 * OCPP Type Definitions (JSDoc)
 * 
 * Created: 2025-01-11
 * Purpose: Type definitions for OCPP protocol messages and entities
 */

/**
 * @typedef {Object} OCPPMessage
 * @property {number} messageType - Message type (2=CALL, 3=CALLRESULT, 4=CALLERROR)
 * @property {string} messageId - Unique message ID (UUID)
 * @property {string} [action] - OCPP action name (for CALL messages)
 * @property {*} [payload] - Message payload
 * @property {string} [errorCode] - Error code (for CALLERROR messages)
 * @property {string} [errorDescription] - Error description (for CALLERROR messages)
 * @property {*} [errorDetails] - Error details (for CALLERROR messages)
 */

/**
 * @typedef {Object} BootNotificationRequest
 * @property {string} chargePointVendor - Charge point vendor
 * @property {string} chargePointModel - Charge point model
 * @property {string} chargePointSerialNumber - Charge point serial number
 * @property {string} [firmwareVersion] - Firmware version
 * @property {string} [iccid] - ICCID
 * @property {string} [imsi] - IMSI
 * @property {string} [meterType] - Meter type
 * @property {string} [meterSerialNumber] - Meter serial number
 */

/**
 * @typedef {Object} BootNotificationResponse
 * @property {string} status - Status (Accepted, Pending, Rejected)
 * @property {string} currentTime - Current time (ISO 8601)
 * @property {number} heartbeatInterval - Heartbeat interval in seconds
 */

/**
 * @typedef {Object} HeartbeatRequest
 * @property {Object} - Empty object
 */

/**
 * @typedef {Object} HeartbeatResponse
 * @property {string} currentTime - Current time (ISO 8601)
 */

/**
 * @typedef {Object} StatusNotificationRequest
 * @property {number} connectorId - Connector ID
 * @property {string} status - Connector status
 * @property {string} [errorCode] - Error code
 * @property {string} [info] - Additional information
 * @property {string} [vendorId] - Vendor ID
 * @property {string} [vendorErrorCode] - Vendor error code
 */

/**
 * @typedef {Object} StatusNotificationResponse
 * @property {Object} - Empty object
 */

/**
 * @typedef {Object} MeterValuesRequest
 * @property {number} connectorId - Connector ID
 * @property {number} [transactionId] - Transaction ID
 * @property {Object[]} meterValue - Meter value readings
 */

/**
 * @typedef {Object} MeterValue
 * @property {string} timestamp - Timestamp (ISO 8601)
 * @property {Object[]} sampledValue - Sampled values
 */

/**
 * @typedef {Object} SampledValue
 * @property {string} value - Measured value
 * @property {string} [context] - Context (Sample.Periodic, Sample.Clock, etc.)
 * @property {string} [format] - Format (Raw, SignedData)
 * @property {string} [measurand] - Measurand type
 * @property {string} [location] - Location (Inlet, Outlet, Body)
 * @property {string} [unit] - Unit of measure
 */

/**
 * @typedef {Object} StartTransactionRequest
 * @property {number} connectorId - Connector ID
 * @property {string} idTag - ID tag
 * @property {number} meterStart - Meter start value
 * @property {string} [timestamp] - Timestamp (ISO 8601)
 * @property {number} [reservationId] - Reservation ID
 */

/**
 * @typedef {Object} StartTransactionResponse
 * @property {number} transactionId - Transaction ID
 * @property {Object} idTagInfo - ID tag information
 */

/**
 * @typedef {Object} StopTransactionRequest
 * @property {number} transactionId - Transaction ID
 * @property {string} idTag - ID tag
 * @property {string} timestamp - Timestamp (ISO 8601)
 * @property {number} meterStop - Meter stop value
 * @property {string} [reason] - Stop reason
 * @property {Object[]} [transactionData] - Transaction data
 */

/**
 * @typedef {Object} StopTransactionResponse
 * @property {Object} [idTagInfo] - ID tag information
 */

/**
 * @typedef {Object} AuthorizeRequest
 * @property {string} idTag - ID tag
 */

/**
 * @typedef {Object} AuthorizeResponse
 * @property {Object} idTagInfo - ID tag information
 */

/**
 * @typedef {Object} IdTagInfo
 * @property {string} status - Authorization status
 * @property {string} [expiryDate] - Expiry date (ISO 8601)
 * @property {string} [parentIdTag] - Parent ID tag
 */

/**
 * @typedef {Object} OCPPError
 * @property {string} errorCode - OCPP error code
 * @property {string} errorDescription - Error description
 * @property {*} [errorDetails] - Additional error details
 */

export default {};