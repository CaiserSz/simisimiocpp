/**
 * Redis Configuration
 * 
 * This configuration handles Redis connection settings for the application.
 * It supports both development and production environments with appropriate defaults.
 */

const config = {
  // Default Redis connection URI
  uri: process.env.REDIS_URI || 'redis://localhost:6379',
  
  // Redis connection options
  options: {
    // Connection retry strategy
    retryStrategy: (times) => {
      // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms, 3200ms, 6400ms, 10000ms
      const delay = Math.min(100 * Math.pow(2, times - 1), 10000);
      return delay;
    },
    
    // Maximum number of retries per request
    maxRetriesPerRequest: 3,
    
    // Enable/disable ready check
    enableReadyCheck: true,
    
    // Connection timeout (ms)
    connectTimeout: 10000,
    
    // Command timeout (ms)
    commandTimeout: 5000,
    
    // Reconnect on error
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return true;
      }
      return false;
    },
    
    // TLS/SSL options (for production)
    tls: process.env.NODE_ENV === 'production' ? {
      // Enable TLS for production
      rejectUnauthorized: true,
      // Add CA certificate if using self-signed certs
      // ca: [fs.readFileSync('/path/to/ca.crt')]
    } : undefined,
  },
  
  // Queue specific configurations
  queue: {
    // Maximum number of jobs per second
    limiter: {
      max: 100, // Max jobs per interval
      duration: 1000, // Per second
    },
    
    // Default job options
    defaultJobOptions: {
      // Remove job from queue when completed
      removeOnComplete: {
        // Keep the most recent 1000 completed jobs
        count: 1000,
        // Keep jobs for 1 day
        age: 24 * 60 * 60,
      },
      
      // Remove job from queue when failed
      removeOnFail: {
        // Keep the most recent 1000 failed jobs
        count: 1000,
      },
      
      // Number of attempts before giving up
      attempts: 3,
      
      // Backoff strategy for retries
      backoff: {
        type: 'exponential',
        delay: 1000, // Initial delay in ms
      },
    },
  },
  
  // Redis cluster configuration (if using Redis Cluster)
  cluster: process.env.REDIS_CLUSTER === 'true' ? {
    // List of cluster nodes
    nodes: [
      { host: '127.0.0.1', port: 7000 },
      { host: '127.0.0.1', port: 7001 },
      { host: '127.0.0.1', port: 7002 },
    ],
    
    // Cluster options
    options: {
      // Enable cluster reconnection on error
      enableReconnect: true,
      // Maximum number of retries for a failed command
      maxRedirections: 16,
      // Enable read from replicas
      readOnly: false,
    },
  } : null,
  
  // Redis Sentinel configuration (if using Redis Sentinel)
  sentinel: process.env.REDIS_SENTINEL === 'true' ? {
    // List of sentinels
    sentinels: [
      { host: '127.0.0.1', port: 26379 },
      { host: '127.0.0.1', port: 26380 },
      { host: '127.0.0.1', port: 26381 },
    ],
    
    // Name of the master
    name: 'mymaster',
    
    // Sentinel options
    sentinelOptions: {
      // Sentinel password if required
      // password: 'your-sentinel-password',
      
      // Enable sentinel reconnection on error
      enableTLSForSentinelMode: false,
      
      // Sentinel command timeout (ms)
      sentinelCommandTimeout: 5000,
    },
  } : null,
};

// Export the configuration
module.exports = config;
