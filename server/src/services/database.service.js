import userRepository from '../repositories/user.repository.js';
import logger from './logger.js';

/**
 * Database Service - Lightweight Database Manager
 * Service layer for database operations
 * 
 * Created: 2025-01-11
 * Refactored from: utils/database.js
 * Purpose: Service layer pattern for database management
 */
class DatabaseService {
    constructor() {
        this.connection = null;
        this.isConnected = false;
    }

    /**
     * Initialize JSON-based storage
     */
    async connect() {
        try {
            logger.info('🗄️ Initializing lightweight storage...');

            // Initialize user repository
            await userRepository.initialize();

            this.isConnected = true;
            logger.info('✅ Lightweight storage initialized successfully');

            return { status: 'connected', type: 'json-file' };
        } catch (error) {
            logger.error('❌ Storage initialization failed:', error);
            throw error;
        }
    }

    /**
     * No indexes needed for JSON storage
     */
    async createIndexes() {
        logger.info('📑 JSON storage doesn\'t require indexes - skipping');
        return true;
    }

    /**
     * Health check for storage system
     */
    async healthCheck() {
        try {
            const userHealth = await userRepository.healthCheck();

            return {
                status: userHealth.status,
                type: 'json-file',
                users: {
                    count: userHealth.users,
                    status: userHealth.status
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Database health check failed:', error);
            return {
                status: 'unhealthy',
                type: 'json-file',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get database statistics
     */
    async getStatistics() {
        try {
            const userCount = await userRepository.count();

            return {
                type: 'json-file',
                users: {
                    total: userCount
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Failed to get database statistics:', error);
            throw error;
        }
    }

    /**
     * Graceful shutdown
     */
    async gracefulShutdown() {
        try {
            logger.info('🛑 Closing database connections...');
            this.isConnected = false;
            this.connection = null;
            logger.info('✅ Database connections closed');
        } catch (error) {
            logger.error('Error during database shutdown:', error);
            throw error;
        }
    }
}

// Singleton instance
const databaseService = new DatabaseService();

// Export as default for backward compatibility
export default databaseService;

// Also export as DatabaseManager for backward compatibility
export { databaseService as DatabaseManager };