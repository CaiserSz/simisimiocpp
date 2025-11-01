import mongoose from 'mongoose';
import logger from './logger.js';
import config from '../config/config.js';

/**
 * Advanced Database Utilities for Production Environment
 */
class DatabaseManager {
  constructor() {
    this.connection = null;
    this.connectionAttempts = 0;
    this.maxRetryAttempts = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Connect to MongoDB with advanced options
   */
  async connect() {
    try {
      const options = {
        ...config.mongo.options,
        // Connection Pool Settings
        maxPoolSize: 10, // Maximum number of connections
        minPoolSize: 2,  // Minimum number of connections
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        serverSelectionTimeoutMS: 5000, // How long to try to find a server
        socketTimeoutMS: 45000, // How long to wait for a response
        heartbeatFrequencyMS: 10000, // Frequency of server pings
        
        // Retry Logic
        retryWrites: true,
        retryReads: true,
        
        // Read/Write Concerns
        readPreference: 'primaryPreferred',
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true, wtimeout: 1000 },
        
        // SSL/TLS
        ssl: process.env.MONGODB_SSL === 'true',
        
        // Compression
        compressors: ['snappy', 'zlib'],
        
        // Buffer Commands
        bufferMaxEntries: 0, // Disable command buffering
      };

      logger.info(`Attempting to connect to MongoDB: ${config.mongo.uri}`);
      
      this.connection = await mongoose.connect(config.mongo.uri, options);
      
      logger.info('✅ MongoDB connected successfully');
      this.connectionAttempts = 0;
      
      // Setup connection event handlers
      this.setupEventHandlers();
      
      return this.connection;
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error);
      await this.handleConnectionError(error);
    }
  }

  /**
   * Setup MongoDB event handlers
   */
  setupEventHandlers() {
    const db = mongoose.connection;

    db.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    db.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      this.attemptReconnect();
    });

    db.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    db.on('timeout', () => {
      logger.error('MongoDB connection timeout');
    });

    db.on('close', () => {
      logger.info('MongoDB connection closed');
    });

    // Handle process termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  /**
   * Handle connection errors with retry logic
   */
  async handleConnectionError(error) {
    this.connectionAttempts++;
    
    if (this.connectionAttempts <= this.maxRetryAttempts) {
      logger.info(`Retrying MongoDB connection in ${this.retryDelay / 1000}s... (Attempt ${this.connectionAttempts}/${this.maxRetryAttempts})`);
      
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      return this.connect();
    } else {
      logger.error('Maximum MongoDB connection attempts reached. Exiting...');
      process.exit(1);
    }
  }

  /**
   * Attempt to reconnect
   */
  async attemptReconnect() {
    if (this.connectionAttempts < this.maxRetryAttempts) {
      logger.info('Attempting to reconnect to MongoDB...');
      await this.connect();
    }
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown() {
    logger.info('Shutting down MongoDB connection...');
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      logger.error('Error during MongoDB shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Execute database transaction
   */
  async executeTransaction(operations) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      logger.debug('Starting database transaction');
      
      const results = [];
      for (const operation of operations) {
        const result = await operation(session);
        results.push(result);
      }

      await session.commitTransaction();
      logger.debug('Database transaction committed successfully');
      
      return results;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Database transaction aborted:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Create database indexes
   */
  async createIndexes() {
    try {
      logger.info('Creating database indexes...');

      // User indexes
      await mongoose.connection.db.collection('users').createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { username: 1 }, unique: true },
        { key: { role: 1 } },
        { key: { isActive: 1 } },
        { key: { createdAt: -1 } },
        { key: { resetPasswordToken: 1 }, sparse: true },
        { key: { resetPasswordExpire: 1 }, expireAfterSeconds: 0, sparse: true }
      ]);

      // Station indexes
      await mongoose.connection.db.collection('stations').createIndexes([
        { key: { stationId: 1 }, unique: true },
        { key: { status: 1 } },
        { key: { isOnline: 1 } },
        { key: { 'location.coordinates': '2dsphere' } }, // Geospatial index
        { key: { chargePointVendor: 1, chargePointModel: 1 } },
        { key: { createdAt: -1 } },
        { key: { updatedAt: -1 } }
      ]);

      // Transaction indexes
      await mongoose.connection.db.collection('transactions').createIndexes([
        { key: { transactionId: 1 }, unique: true },
        { key: { stationId: 1 } },
        { key: { userId: 1 } },
        { key: { status: 1 } },
        { key: { startTime: -1 } },
        { key: { endTime: -1 } },
        { key: { createdAt: -1 } },
        // Compound indexes for common queries
        { key: { stationId: 1, status: 1 } },
        { key: { userId: 1, status: 1 } },
        { key: { stationId: 1, startTime: -1 } }
      ]);

      logger.info('✅ Database indexes created successfully');
    } catch (error) {
      logger.error('❌ Error creating database indexes:', error);
      throw error;
    }
  }

  /**
   * Database health check
   */
  async healthCheck() {
    try {
      const adminDb = mongoose.connection.db.admin();
      const result = await adminDb.ping();
      
      const stats = {
        status: 'healthy',
        connection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        ping: result.ok === 1 ? 'ok' : 'failed'
      };

      return stats;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics() {
    try {
      const collections = ['users', 'stations', 'transactions'];
      const stats = {};

      for (const collection of collections) {
        const count = await mongoose.connection.db.collection(collection).countDocuments();
        const size = await mongoose.connection.db.collection(collection).stats();
        
        stats[collection] = {
          documents: count,
          size: size.size,
          indexes: size.nindexes
        };
      }

      return stats;
    } catch (error) {
      logger.error('Error getting database statistics:', error);
      throw error;
    }
  }

  /**
   * Backup database (development utility)
   */
  async createBackup() {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Database backup should be handled by external tools in production');
      return;
    }

    try {
      logger.info('Creating database backup...');
      // Implementation would depend on backup strategy
      // This is a placeholder for backup logic
      logger.info('Backup completed (placeholder implementation)');
    } catch (error) {
      logger.error('Backup failed:', error);
      throw error;
    }
  }
}

export default new DatabaseManager();
