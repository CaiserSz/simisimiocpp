/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use services/database.service.js instead.
 * 
 * Migration Guide:
 * - Import: import DatabaseManager from '../services/database.service.js'
 * - Methods remain the same
 * 
 * This file is kept for backward compatibility only.
 * 
 * Deprecated: 2025-01-11
 * Removal Date: 2025-02-01
 */

import DatabaseManager from '../services/database.service.js';
import logger from '../utils/logger.js';

logger.warn('⚠️ DEPRECATED: utils/database.js is deprecated. Use services/database.service.js instead.');

// Re-export for backward compatibility
export default DatabaseManager;