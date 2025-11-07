/**
 * Types Index
 * Centralized export for all type definitions
 * 
 * Created: 2025-01-11
 * Purpose: Single import point for all JSDoc types
 */

export * from './api.types.js';
export * from './ocpp.types.js';
export * from './station.types.js';
export * from './user.types.js';

import * as apiTypes from './api.types.js';
import * as ocppTypes from './ocpp.types.js';
import * as stationTypes from './station.types.js';
import * as userTypes from './user.types.js';

export default {
    api: apiTypes.default || apiTypes,
    station: stationTypes.default || stationTypes,
    user: userTypes.default || userTypes,
    ocpp: ocppTypes.default || ocppTypes
};