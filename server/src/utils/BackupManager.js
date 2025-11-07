/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use services/backup.service.js instead.
 * 
 * Migration Guide:
 * - Import: import BackupService from '../services/backup.service.js'
 * - Usage: const backupService = new BackupService()
 * - Methods remain the same
 * 
 * This file is kept for backward compatibility only.
 * 
 * Deprecated: 2025-01-11
 * Removal Date: 2025-02-01
 */

import BackupService from '../services/backup.service.js';
import logger from '../utils/logger.js';

logger.warn('⚠️ DEPRECATED: utils/BackupManager.js is deprecated. Use services/backup.service.js instead.');

// Re-export for backward compatibility
export { BackupService as BackupManager };
export default BackupService;