/**
 * Station Constants
 * 
 * Created: 2025-01-11
 * Purpose: Centralized station-related constants
 */

// Station Status
export const STATION_STATUS = {
    AVAILABLE: 'Available',
    OCCUPIED: 'Occupied',
    RESERVED: 'Reserved',
    UNAVAILABLE: 'Unavailable',
    FAULTED: 'Faulted',
    PREPARING: 'Preparing',
    CHARGING: 'Charging',
    SUSPENDED_EVSE: 'SuspendedEVSE',
    SUSPENDED_EV: 'SuspendedEV',
    FINISHING: 'Finishing'
};

// Station Types
export const STATION_TYPES = {
    URBAN_AC: 'urban_ac',
    URBAN_DC_FAST: 'urban_dc_fast',
    HIGHWAY_ULTRA_FAST: 'highway_ultra_fast',
    WORKPLACE_AC: 'workplace_ac',
    HOME_WALLBOX: 'home_wallbox'
};

// Station Profiles
export const STATION_PROFILES = {
    URBAN_AC: {
        name: 'Urban AC Charger',
        maxPower: 7400, // 7.4kW
        connectorCount: 2,
        ocppVersion: '1.6J',
        heartbeatInterval: 300
    },
    URBAN_DC_FAST: {
        name: 'Urban DC Fast Charger',
        maxPower: 50000, // 50kW
        connectorCount: 1,
        ocppVersion: '2.0.1',
        heartbeatInterval: 180
    },
    HIGHWAY_ULTRA_FAST: {
        name: 'Highway Ultra Fast Charger',
        maxPower: 350000, // 350kW
        connectorCount: 4,
        ocppVersion: '2.0.1',
        heartbeatInterval: 120
    },
    WORKPLACE_AC: {
        name: 'Workplace AC Charger',
        maxPower: 11000, // 11kW
        connectorCount: 2,
        ocppVersion: '1.6J',
        heartbeatInterval: 600
    },
    HOME_WALLBOX: {
        name: 'Home Wallbox',
        maxPower: 3700, // 3.7kW
        connectorCount: 1,
        ocppVersion: '1.6J',
        heartbeatInterval: 600
    }
};

// Power Limits (Watts)
export const POWER_LIMITS = {
    MIN: 1000, // 1kW
    MAX: 500000, // 500kW
    URBAN_AC: 7400, // 7.4kW
    URBAN_DC_FAST: 50000, // 50kW
    HIGHWAY_ULTRA_FAST: 350000, // 350kW
    WORKPLACE_AC: 11000, // 11kW
    HOME_WALLBOX: 3700 // 3.7kW
};

// Connector Standards
export const CONNECTOR_STANDARDS = {
    IEC62196_TYPE2: 'IEC62196Type2',
    CCS: 'CCS',
    CCS2: 'CCS2',
    CHADEMO: 'CHAdeMO',
    TYPE1: 'Type1',
    TYPE2: 'Type2'
};

// Station Health Status
export const STATION_HEALTH_STATUS = {
    HEALTHY: 'healthy',
    WARNING: 'warning',
    CRITICAL: 'critical',
    OFFLINE: 'offline'
};

// Station Health Scores
export const STATION_HEALTH_SCORES = {
    EXCELLENT: 95,
    GOOD: 80,
    FAIR: 60,
    POOR: 40,
    CRITICAL: 20
};

// Station Location Types
export const STATION_LOCATION_TYPES = {
    URBAN: 'urban',
    HIGHWAY: 'highway',
    WORKPLACE: 'workplace',
    HOME: 'home',
    RETAIL: 'retail',
    PARKING: 'parking'
};

export default {
    STATION_STATUS,
    STATION_TYPES,
    STATION_PROFILES,
    POWER_LIMITS,
    CONNECTOR_STANDARDS,
    STATION_HEALTH_STATUS,
    STATION_HEALTH_SCORES,
    STATION_LOCATION_TYPES
};

