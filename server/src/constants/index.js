/**
 * Constants Index
 * Centralized export for all constants
 * 
 * Created: 2025-01-11
 * Purpose: Single import point for all constants
 */

export * from './ocpp.constants.js';
export * from './station.constants.js';
export * from './user.constants.js';
export * from './api.constants.js';

import * as ocppConstants from './ocpp.constants.js';
import * as stationConstants from './station.constants.js';
import * as userConstants from './user.constants.js';
import * as apiConstants from './api.constants.js';

export default {
    ocpp: ocppConstants.default || ocppConstants,
    station: stationConstants.default || stationConstants,
    user: userConstants.default || userConstants,
    api: apiConstants.default || apiConstants
};

