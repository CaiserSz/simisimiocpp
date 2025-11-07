/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use repositories/user.repository.js instead.
 * 
 * Migration Guide:
 * - Import: import userRepository from '../repositories/user.repository.js'
 * - Methods remain the same, but use userRepository instead of userStore
 * 
 * This file is kept for backward compatibility only.
 * 
 * Deprecated: 2025-01-11
 * Removal Date: 2025-02-01
 */

import userRepository from '../repositories/user.repository.js';
import logger from '../utils/logger.js';

logger.warn('⚠️ DEPRECATED: SimpleUserStore.js is deprecated. Use repositories/user.repository.js instead.');

// Re-export for backward compatibility
export default userRepository;