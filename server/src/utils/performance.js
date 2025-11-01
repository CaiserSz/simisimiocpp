import cluster from 'cluster';
import os from 'os';
import logger from './logger.js';

/**
 * Production Performance Optimizations
 */

/**
 * Setup clustering for multi-core utilization
 */
export const setupClustering = () => {
  const numCPUs = os.cpus().length;
  
  if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
    logger.info(`🚀 Primary process ${process.pid} is setting up ${numCPUs} workers`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`💀 Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
      logger.info('🔄 Starting a new worker');
      cluster.fork();
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('🛑 Primary received SIGTERM, shutting down workers');
      
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
    });

    return true; // Primary process, don't start server
  }
  
  return false; // Worker process, start server
};

/**
 * Memory usage monitoring and garbage collection optimization
 */
export const setupMemoryOptimization = () => {
  // Monitor memory usage
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const mbUsage = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    // Log memory usage every 5 minutes
    if (Date.now() % (5 * 60 * 1000) < 10000) {
      logger.info('📊 Memory usage:', mbUsage);
    }

    // Warning if memory usage is high
    if (mbUsage.heapUsed > 512) {
      logger.warn(`⚠️ High memory usage: ${mbUsage.heapUsed}MB heap used`);
    }

    // Force GC if memory usage is critical (only in production)
    if (mbUsage.heapUsed > 1024 && process.env.NODE_ENV === 'production') {
      if (global.gc) {
        logger.warn('🧹 Running garbage collection due to high memory usage');
        global.gc();
      }
    }
  }, 30000); // Check every 30 seconds
};

/**
 * Connection pooling for WebSocket clients
 */
export class ConnectionPool {
  constructor(maxConnections = 1000) {
    this.pool = new Map();
    this.maxConnections = maxConnections;
    this.activeConnections = 0;
    this.connectionQueue = [];
  }

  addConnection(id, connection) {
    if (this.activeConnections >= this.maxConnections) {
      this.connectionQueue.push({ id, connection });
      logger.warn(`📊 Connection pool full, queuing connection ${id}`);
      return false;
    }

    this.pool.set(id, connection);
    this.activeConnections++;
    logger.debug(`➕ Added connection ${id} to pool (${this.activeConnections}/${this.maxConnections})`);
    return true;
  }

  removeConnection(id) {
    if (this.pool.has(id)) {
      this.pool.delete(id);
      this.activeConnections--;
      logger.debug(`➖ Removed connection ${id} from pool (${this.activeConnections}/${this.maxConnections})`);

      // Process queued connections
      if (this.connectionQueue.length > 0) {
        const queued = this.connectionQueue.shift();
        this.addConnection(queued.id, queued.connection);
      }
    }
  }

  getConnection(id) {
    return this.pool.get(id);
  }

  getStats() {
    return {
      active: this.activeConnections,
      max: this.maxConnections,
      queued: this.connectionQueue.length,
      utilization: (this.activeConnections / this.maxConnections * 100).toFixed(1)
    };
  }

  cleanup() {
    // Remove stale connections
    for (const [id, connection] of this.pool) {
      if (connection.readyState === 3) { // WebSocket.CLOSED
        this.removeConnection(id);
      }
    }
  }
}

/**
 * Request rate limiting and throttling
 */
export class RequestThrottler {
  constructor(windowMs = 60000, maxRequests = 100) {
    this.requests = new Map(); // IP -> request timestamps
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  isAllowed(ip) {
    const now = Date.now();
    const requests = this.requests.get(ip) || [];
    
    // Remove old requests
    const recentRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(ip, recentRequests);
    
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, requests] of this.requests) {
      const recentRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, recentRequests);
      }
    }
  }

  getStats() {
    return {
      activeIPs: this.requests.size,
      totalRequests: Array.from(this.requests.values()).reduce((sum, reqs) => sum + reqs.length, 0)
    };
  }
}

/**
 * Database query optimization
 */
export const optimizeDatabase = () => {
  // Database optimization not needed for JSON storage
  logger.info('✅ Database optimization skipped - using lightweight JSON storage');
};

/**
 * Performance monitoring middleware
 */
export const performanceMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    // Log slow requests
    if (duration > 1000) { // >1 second
      logger.warn(`🐌 Slow request: ${req.method} ${req.path} (${duration.toFixed(2)}ms)`, {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }

    // Add performance header
    res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
  });

  next();
};

/**
 * CPU usage monitoring
 */
export const setupCPUMonitoring = () => {
  let lastCpuUsage = process.cpuUsage();
  
  setInterval(() => {
    const currentCpuUsage = process.cpuUsage(lastCpuUsage);
    const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / 1000000 * 100;
    
    if (cpuPercent > 80) {
      logger.warn(`⚠️ High CPU usage: ${cpuPercent.toFixed(1)}%`);
    }
    
    lastCpuUsage = process.cpuUsage();
  }, 30000); // Check every 30 seconds
};

/**
 * Response compression middleware
 */
export const setupCompression = (app) => {
  logger.info('✅ Response compression enabled (handled in main app)');
};

/**
 * Event loop lag monitoring (reduced frequency to prevent causing lag)
 */
export const setupEventLoopMonitoring = () => {
  let start = process.hrtime.bigint();
  
  const checkEventLoop = () => {
    const delta = process.hrtime.bigint() - start;
    const lag = Number(delta) / 1000000; // Convert to milliseconds
    
    if (lag > 500) { // Only warn for significant lag (>500ms)
      logger.warn(`⚠️ Event loop lag detected: ${lag.toFixed(2)}ms`);
    }
    
    start = process.hrtime.bigint();
  };
  
  // Check every 30 seconds instead of every second to prevent causing lag
  setInterval(checkEventLoop, 30000);
};

/**
 * Initialize all performance optimizations
 */
export const initializePerformanceOptimizations = (app) => {
  logger.info('🚀 Initializing performance optimizations...');
  
  // Setup clustering (only in production)
  if (process.env.NODE_ENV === 'production') {
    if (setupClustering()) {
      return; // Primary process, exit early
    }
  }
  
  // Memory optimization
  setupMemoryOptimization();
  
  // CPU monitoring
  setupCPUMonitoring();
  
  // Event loop monitoring
  setupEventLoopMonitoring();
  
  // Database optimization
  optimizeDatabase();
  
  // Compression
  setupCompression(app);
  
  // Performance middleware
  app.use(performanceMiddleware);
  
  logger.info('✅ Performance optimizations initialized');
};

// Export singleton instances
export const connectionPool = new ConnectionPool(1000);
export const requestThrottler = new RequestThrottler(60000, 100);
