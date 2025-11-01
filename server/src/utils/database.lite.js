import userStore from '../services/SimpleUserStore.js';
import logger from './logger.js';

/**
 * Lightweight Database Manager for EV Station Simulator
 * No MongoDB needed - uses JSON file storage
 */
class SimpleDatabaseManager {
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
      
      // Initialize user store
      await userStore.initialize();
      
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
      const userHealth = await userStore.healthCheck();
      
      return {
        status: userHealth.status,
        connection: this.isConnected ? 'connected' : 'disconnected',
        storageType: 'json-file',
        userStore: userHealth,
        advantages: [
          'No external database required',
          'Lightweight and fast',
          'Perfect for testing and development',
          'Easy backup and restore',
          'Zero configuration'
        ]
      };
    } catch (error) {
      logger.error('Storage health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStatistics() {
    try {
      const userHealth = await userStore.healthCheck();
      
      return {
        storageType: 'JSON File Storage',
        users: {
          total: userHealth.userCount || 0,
          storageSize: '< 1MB',
          performance: 'Excellent'
        },
        simulator: {
          description: 'All simulation data stored in memory',
          persistence: 'Not required for simulator',
          performance: 'Excellent'
        },
        advantages: [
          '🚀 Zero setup time',
          '💾 Minimal storage requirements',
          '⚡ Lightning fast performance',
          '🔧 Easy to maintain',
          '📦 Self-contained'
        ]
      };
    } catch (error) {
      logger.error('Error getting storage statistics:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown() {
    logger.info('📊 Shutting down lightweight storage...');
    try {
      // Create final backup
      await userStore.createBackup();
      this.isConnected = false;
      logger.info('✅ Lightweight storage shutdown completed');
    } catch (error) {
      logger.error('Error during storage shutdown:', error);
    }
  }

  /**
   * Create system backup
   */
  async createBackup() {
    try {
      logger.info('💾 Creating system backup...');
      const backupFile = await userStore.createBackup();
      
      return {
        success: true,
        backupFile,
        timestamp: new Date().toISOString(),
        message: 'System backup created successfully'
      };
    } catch (error) {
      logger.error('Backup failed:', error);
      throw error;
    }
  }

  /**
   * Get database info for dashboard
   */
  getDatabaseInfo() {
    return {
      type: 'JSON File Storage',
      description: 'Lightweight storage perfect for EV Station Simulator',
      benefits: [
        'No MongoDB installation required',
        'Instant startup',
        'Easy to backup and restore',
        'Perfect for development and testing',
        'Minimal resource usage'
      ],
      limitations: [
        'Not suitable for high-volume production',
        'No advanced querying',
        'Single-node only'
      ],
      recommendation: 'Ideal for station simulator use case'
    };
  }
}

export default new SimpleDatabaseManager();
