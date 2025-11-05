import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file (project root)
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Validate critical environment variables
const validateConfig = () => {
        const errors = [];
        const warnings = [];

        // Validate PORT
        if (process.env.PORT) {
            const port = parseInt(process.env.PORT);
            if (isNaN(port) || port < 1 || port > 65535) {
                errors.push('PORT must be a valid number between 1 and 65535');
            }
        }

        // Validate CSMS_URL format (if provided)
        if (process.env.CSMS_URL) {
            const csmsUrlPattern = /^wss?:\/\/.+/;
            if (!csmsUrlPattern.test(process.env.CSMS_URL)) {
                errors.push('CSMS_URL must be a valid WebSocket URL (ws:// or wss://)');
            }
        }

        // Validate ALLOWED_ORIGINS format (if provided)
        if (process.env.ALLOWED_ORIGINS) {
            const origins = process.env.ALLOWED_ORIGINS.split(',');
            const urlPattern = /^https?:\/\/.+/;
            const invalidOrigins = origins.filter(origin => !urlPattern.test(origin.trim()));
            if (invalidOrigins.length > 0) {
                warnings.push(`Invalid origin(s) in ALLOWED_ORIGINS: ${invalidOrigins.join(', ')}`);
            }
        }

        // Validate JWT_SECRET if authentication is enabled
        if (process.env.ENABLE_AUTH === 'true') {
            if (!process.env.JWT_SECRET) {
                errors.push('JWT_SECRET is required when ENABLE_AUTH=true');
            } else if (process.env.JWT_SECRET.length < 32) {
                errors.push('JWT_SECRET must be at least 32 characters long when authentication is enabled');
            }
        }

        // Production environment checks
        if (process.env.NODE_ENV === 'production') {
            if (process.env.ENABLE_AUTH !== 'true') {
                errors.push('ENABLE_AUTH must be "true" in production environment');
            }

            if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_super_secure_64_character_secret_key_here_change_in_production') {
                errors.push('JWT_SECRET must be changed from default value in production');
            }

            if (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.includes('localhost')) {
                warnings.push('ALLOWED_ORIGINS contains localhost in production - consider using production domains');
            }
        }

        // Validate Redis URL format (if enabled)
        if (process.env.REDIS_ENABLED === 'true' && process.env.REDIS_URL) {
            const redisUrlPattern = /^redis:\/\/.+/;
            if (!redisUrlPattern.test(process.env.REDIS_URL)) {
                errors.push('REDIS_URL must be a valid Redis URL (redis://host:port)');
            }
        }

        // Validate LOG_LEVEL
        if (process.env.LOG_LEVEL) {
            const validLevels = ['error', 'warn', 'info', 'debug', 'verbose'];
            if (!validLevels.includes(process.env.LOG_LEVEL.toLowerCase())) {
                warnings.push(`Invalid LOG_LEVEL: ${process.env.LOG_LEVEL}. Valid levels: ${validLevels.join(', ')}`);
            }
        }

        // Validate PASSWORD_SALT_ROUNDS
        if (process.env.PASSWORD_SALT_ROUNDS) {
            const saltRounds = parseInt(process.env.PASSWORD_SALT_ROUNDS);
            if (isNaN(saltRounds) || saltRounds < 10 || saltRounds > 20) {
                warnings.push('PASSWORD_SALT_ROUNDS should be between 10 and 20 for optimal security');
            }
        }

        // Log warnings
        if (warnings.length > 0) {
            warnings.forEach(warning => {
                logger.warn(`⚠️  Config Warning: ${warning}`);
            });
        }

        // Throw errors
        if (errors.length > 0) {
            throw new Error(`Configuration Validation Failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
};

// Validate configuration on startup
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}

const config = {
  // Server configuration
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  version: process.env.npm_package_version || '1.0.0',
  
  // Storage configuration (JSON-based)
  storage: {
    type: 'json',
    dataDir: process.env.DATA_DIR || './src/data',
    backupEnabled: true,
  },

  // OCPP configuration
  ocpp: {
    protocol: 'ocpp2.0.1',
    port: process.env.OCPP_PORT || 9220,
    pingInterval: 60000, // 1 minute
    maxCallLengthSeconds: 30,
    maxCachingSeconds: 10,
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    errorFile: process.env.ERROR_LOG_FILE || 'logs/error.log',
  },

  // Security configuration
  security: {
    enableAuth: process.env.ENABLE_AUTH === 'true' || false,
    jwtSecret: process.env.JWT_SECRET,
    passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS) || 12,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    jwtCookieExpiresIn: parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 1,
  },

  // Client configuration (dashboard URL)
  clientUrl: process.env.CLIENT_URL || 'http://localhost:9220',

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  },

  // CORS configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:9220'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 hours
  },

  // Sentry configuration
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  },

  // Redis configuration (optional - only needed if caching enabled)
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true' || false,
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
  },
};

export default config;