import Redis from 'ioredis';
import logger from '../utils/logger.js';
import config from '../config/config.js';

/**
 * Enterprise Cache Manager with Redis
 */
class CacheManager {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      this.redis = new Redis(config.redis.url, {
        password: config.redis.password,
        db: config.redis.db,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4, // IPv4
        connectTimeout: 10000,
        commandTimeout: 5000,
      });

      this.setupEventHandlers();
      
      await this.redis.connect();
      
      logger.info('🔴 Redis Cache Manager initialized');
      return true;
    } catch (error) {
      logger.error('Redis connection failed:', error);
      // Graceful degradation - continue without cache
      return false;
    }
  }

  /**
   * Setup Redis event handlers
   */
  setupEventHandlers() {
    this.redis.on('connect', () => {
      logger.info('Redis connected');
      this.isConnected = true;
    });

    this.redis.on('ready', () => {
      logger.info('Redis ready');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', (time) => {
      logger.info(`Redis reconnecting in ${time}ms`);
    });
  }

  /**
   * Set cache with TTL
   */
  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected) {
      logger.debug('Cache not available, skipping set');
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, serializedValue);
      
      this.cacheStats.sets++;
      logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      logger.error('Cache SET error:', error);
      return false;
    }
  }

  /**
   * Get from cache
   */
  async get(key) {
    if (!this.isConnected) {
      logger.debug('Cache not available, skipping get');
      this.cacheStats.misses++;
      return null;
    }

    try {
      const value = await this.redis.get(key);
      
      if (value === null) {
        this.cacheStats.misses++;
        logger.debug(`Cache MISS: ${key}`);
        return null;
      }

      this.cacheStats.hits++;
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(value);
    } catch (error) {
      logger.error('Cache GET error:', error);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Delete from cache
   */
  async del(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.redis.del(key);
      this.cacheStats.deletes++;
      logger.debug(`Cache DEL: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache DEL error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.cacheStats.deletes += keys.length;
        logger.debug(`Cache DEL pattern: ${pattern} (${keys.length} keys)`);
      }
      return true;
    } catch (error) {
      logger.error('Cache DEL pattern error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache EXISTS error:', error);
      return false;
    }
  }

  /**
   * Set TTL for existing key
   */
  async expire(key, ttlSeconds) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.redis.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      logger.error('Cache EXPIRE error:', error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key, by = 1, ttlSeconds = null) {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const result = await this.redis.incrby(key, by);
      
      if (ttlSeconds && result === by) { // First increment, set TTL
        await this.redis.expire(key, ttlSeconds);
      }
      
      return result;
    } catch (error) {
      logger.error('Cache INCREMENT error:', error);
      return 0;
    }
  }

  /**
   * Get/Set pattern for caching expensive operations
   */
  async getOrSet(key, fetchFunction, ttlSeconds = 3600) {
    // Try to get from cache first
    let value = await this.get(key);
    
    if (value !== null) {
      return value;
    }

    // Cache miss - fetch data
    try {
      value = await fetchFunction();
      
      // Store in cache for future requests
      await this.set(key, value, ttlSeconds);
      
      return value;
    } catch (error) {
      logger.error('Cache getOrSet fetch error:', error);
      throw error;
    }
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmCache() {
    if (!this.isConnected) {
      return;
    }

    try {
      logger.info('🔥 Starting cache warming...');

      // Warm up station data cache
      // This would be called periodically or on startup
      
      logger.info('🔥 Cache warming completed');
    } catch (error) {
      logger.error('Cache warming error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 ? 
      (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2) : 0;

    return {
      connected: this.isConnected,
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      sets: this.cacheStats.sets,
      deletes: this.cacheStats.deletes,
      hitRate: `${hitRate}%`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear all cache statistics
   */
  clearStats() {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Flush entire cache (use with caution)
   */
  async flush() {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.redis.flushdb();
      logger.warn('Cache flushed - all data cleared');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.isConnected) {
      return {
        status: 'unhealthy',
        error: 'Redis not connected'
      };
    }

    try {
      const pong = await this.redis.ping();
      const info = await this.redis.info('memory');
      
      return {
        status: 'healthy',
        ping: pong,
        memory: this.parseRedisMemoryInfo(info),
        stats: this.getStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Parse Redis memory info
   */
  parseRedisMemoryInfo(info) {
    const lines = info.split('\n');
    const memory = {};
    
    lines.forEach(line => {
      if (line.startsWith('used_memory_human:')) {
        memory.used = line.split(':')[1].trim();
      } else if (line.startsWith('used_memory_peak_human:')) {
        memory.peak = line.split(':')[1].trim();
      }
    });
    
    return memory;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.redis) {
      logger.info('Closing Redis connection...');
      await this.redis.quit();
    }
  }
}

// Cache key helpers
export const CacheKeys = {
  // Station cache keys
  STATION: (id) => `station:${id}`,
  STATION_STATUS: (id) => `station:${id}:status`,
  STATIONS_LIST: 'stations:list',
  STATIONS_BY_STATUS: (status) => `stations:status:${status}`,
  
  // User cache keys
  USER: (id) => `user:${id}`,
  USER_PERMISSIONS: (id) => `user:${id}:permissions`,
  
  // Transaction cache keys
  TRANSACTION: (id) => `transaction:${id}`,
  ACTIVE_TRANSACTIONS: 'transactions:active',
  STATION_TRANSACTIONS: (stationId) => `station:${stationId}:transactions`,
  
  // OCPP cache keys
  OCPP_STATION: (id) => `ocpp:station:${id}`,
  OCPP_MESSAGES: (stationId) => `ocpp:${stationId}:messages`,
  
  // Rate limiting keys
  RATE_LIMIT: (ip) => `rate_limit:${ip}`,
  
  // Session keys
  SESSION: (sessionId) => `session:${sessionId}`,
  
  // Analytics keys
  ANALYTICS_DAILY: (date) => `analytics:daily:${date}`,
  ANALYTICS_HOURLY: (hour) => `analytics:hourly:${hour}`
};

// Export singleton instance
export default new CacheManager();
