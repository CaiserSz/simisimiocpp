/**
 * Validators Index
 * Centralized export for all validators
 * 
 * Created: 2025-01-11
 * Purpose: Single import point for all validators
 */

export * from './auth.validator.js';
export * from './common.validator.js';
export * from './station.validator.js';

import * as authValidators from './auth.validator.js';
import * as commonValidators from './common.validator.js';
import * as stationValidators from './station.validator.js';

export default {
    auth: authValidators.default || authValidators,
    station: stationValidators.default || stationValidators,
    common: commonValidators.default || commonValidators
};