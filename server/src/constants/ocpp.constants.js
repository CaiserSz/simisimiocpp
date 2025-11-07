/**
 * OCPP Protocol Constants
 * 
 * Created: 2025-01-11
 * Purpose: Centralized OCPP protocol constants
 */

// OCPP Protocol Versions
export const OCPP_VERSIONS = {
    V16J: '1.6J',
    V201: '2.0.1'
};

// OCPP Sub-Protocols
export const OCPP_SUB_PROTOCOLS = {
    V16J: 'ocpp1.6',
    V201: 'ocpp2.0.1'
};

// OCPP Message Types
export const OCPP_MESSAGE_TYPES = {
    CALL: 2,
    CALLRESULT: 3,
    CALLERROR: 4
};

// OCPP Heartbeat Intervals (seconds)
export const OCPP_HEARTBEAT_INTERVALS = {
    DEFAULT: 300,
    FAST: 120,
    NORMAL: 180,
    SLOW: 600
};

// OCPP Configuration Keys
export const OCPP_CONFIG_KEYS = {
    HEARTBEAT_INTERVAL: 'HeartbeatInterval',
    NUMBER_OF_CONNECTORS: 'NumberOfConnectors',
    METER_VALUE_SAMPLE_INTERVAL: 'MeterValueSampleInterval',
    CONNECTION_TIMEOUT: 'ConnectionTimeOut',
    TRANSACTION_MESSAGE_ATTEMPTS: 'TransactionMessageAttempts',
    TRANSACTION_MESSAGE_RETRY_INTERVAL: 'TransactionMessageRetryInterval'
};

// OCPP Status Values
export const OCPP_STATUS = {
    ACCEPTED: 'Accepted',
    PENDING: 'Pending',
    REJECTED: 'Rejected'
};

// OCPP Authorization Status
export const OCPP_AUTHORIZATION_STATUS = {
    ACCEPTED: 'Accepted',
    BLOCKED: 'Blocked',
    EXPIRED: 'Expired',
    INVALID: 'Invalid',
    CONCURRENT_TX: 'ConcurrentTx'
};

// OCPP Boot Notification Reasons
export const OCPP_BOOT_REASONS = {
    APPLICATION_RESET: 'ApplicationReset',
    FIRMWARE_UPDATE: 'FirmwareUpdate',
    LOCAL_RESET: 'LocalReset',
    POWER_UP: 'PowerUp',
    REMOTE_RESET: 'RemoteReset',
    SCHEDULED_RESET: 'ScheduledReset',
    TRIGGERED: 'Triggered',
    UNKNOWN: 'Unknown',
    WATCHDOG: 'Watchdog'
};

// OCPP Connector Status
export const OCPP_CONNECTOR_STATUS = {
    AVAILABLE: 'Available',
    OCCUPIED: 'Occupied',
    RESERVED: 'Reserved',
    UNAVAILABLE: 'Unavailable',
    FAULTED: 'Faulted'
};

// OCPP Feature Profiles
export const OCPP_FEATURE_PROFILES = {
    CORE: 'Core',
    FIRMWARE_MANAGEMENT: 'FirmwareManagement',
    LOCAL_AUTH_LIST_MANAGEMENT: 'LocalAuthListManagement',
    RESERVATION: 'Reservation',
    SMART_CHARGING: 'SmartCharging',
    REMOTE_TRIGGER: 'RemoteTrigger'
};

// OCPP Default Configuration Values
export const OCPP_DEFAULT_CONFIG = {
    HEARTBEAT_INTERVAL: '300',
    METER_VALUE_SAMPLE_INTERVAL: '60',
    CONNECTION_TIMEOUT: '60',
    TRANSACTION_MESSAGE_ATTEMPTS: '3',
    TRANSACTION_MESSAGE_RETRY_INTERVAL: '60',
    NUMBER_OF_CONNECTORS: '2',
    BLINK_REPEAT: '1',
    LIGHT_INTENSITY: '50',
    RESET_RETRIES: '3'
};

export default {
    OCPP_VERSIONS,
    OCPP_SUB_PROTOCOLS,
    OCPP_MESSAGE_TYPES,
    OCPP_HEARTBEAT_INTERVALS,
    OCPP_CONFIG_KEYS,
    OCPP_STATUS,
    OCPP_AUTHORIZATION_STATUS,
    OCPP_BOOT_REASONS,
    OCPP_CONNECTOR_STATUS,
    OCPP_FEATURE_PROFILES,
    OCPP_DEFAULT_CONFIG
};

