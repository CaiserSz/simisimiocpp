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
            const csmsUrl = process.env.CSMS_URL.trim();
            const csmsUrlPattern = /^wss?:\/\/.+/;

            if (!csmsUrlPattern.test(csmsUrl)) {
                errors.push('CSMS_URL must be a valid WebSocket URL (ws:// or wss://)');
            } else {
                // Additional validation: check URL structure
                try {
                    const url = new URL(csmsUrl);

                    // Validate protocol
                    if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
                        errors.push('CSMS_URL must use ws:// or wss:// protocol');
                    }

                    // Validate hostname is present
                    if (!url.hostname || url.hostname.length === 0) {
                        errors.push('CSMS_URL must include a valid hostname');
                    }

                    // Warn about localhost in production
                    if (process.env.NODE_ENV === 'production' &&
                        (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
                        warnings.push('CSMS_URL points to localhost in production - consider using production CSMS endpoint');
                    }

                    // Warn about non-secure WebSocket in production
                    if (process.env.NODE_ENV === 'production' && url.protocol === 'ws:') {
                        warnings.push('CSMS_URL uses unencrypted WebSocket (ws://) in production - consider using secure WebSocket (wss://)');
                    }
                } catch (urlError) {
                    errors.push(`CSMS_URL is not a valid URL: ${urlError.message}`);
                }
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

        // Validate DATA_DIR path
        if (process.env.DATA_DIR) {
            const dataDir = process.env.DATA_DIR;

            // Check for directory traversal attempts
            if (dataDir.includes('..')) {
                errors.push('DATA_DIR cannot contain directory traversal sequences (..)');
            }

            // Check if path is absolute or relative
            const resolvedPath = path.isAbsolute(dataDir) ? dataDir : path.resolve(__dirname, '../../../', dataDir);

            try {
                // Check if directory exists or can be created
                if (!fs.existsSync(resolvedPath)) {
                    // Try to create directory (this will fail if parent doesn't exist or no permissions)
                    try {
                        fs.mkdirSync(resolvedPath, { recursive: true });
                        logger.info(`📁 Created DATA_DIR: ${resolvedPath}`);
                    } catch (mkdirError) {
                        errors.push(`DATA_DIR cannot be created: ${resolvedPath}. Error: ${mkdirError.message}`);
                    }
                } else {
                    // Check if it's actually a directory
                    const stats = fs.statSync(resolvedPath);
                    if (!stats.isDirectory()) {
                        errors.push(`DATA_DIR must be a directory: ${resolvedPath}`);
                    } else {
                        // Check write permissions
                        try {
                            fs.accessSync(resolvedPath, fs.constants.W_OK);
                        } catch (permError) {
                            errors.push(`DATA_DIR is not writable: ${resolvedPath}`);
                        }
                    }
                }
            } catch (error) {
                warnings.push(`DATA_DIR validation warning: ${error.message}`);
            }
        }

        // Validate OCPP_PORT
        if (process.env.OCPP_PORT) {
            const ocppPort = parseInt(process.env.OCPP_PORT);
            if (isNaN(ocppPort) || ocppPort < 1 || ocppPort > 65535) {
                errors.push('OCPP_PORT must be a valid number between 1 and 65535');
            }

            // Warn if OCPP_PORT conflicts with PORT
            if (process.env.PORT && parseInt(process.env.PORT) === ocppPort) {
                warnings.push('OCPP_PORT should be different from PORT to avoid conflicts');
            }
        }

        // Validate HOST
        if (process.env.HOST) {
            const host = process.env.HOST.trim();
            // Basic host validation (IP address or hostname)
            const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
            const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;

            if (!ipPattern.test(host) && !hostnamePattern.test(host) && host !== '0.0.0.0' && host !== 'localhost') {
                warnings.push(`HOST format may be invalid: ${host}. Use IP address or valid hostname`);
            }
        }

        // Validate LOG_FILE path (if provided)
        if (process.env.LOG_FILE) {
            const logFile = process.env.LOG_FILE;

            // Check for directory traversal
            if (logFile.includes('..')) {
                errors.push('LOG_FILE cannot contain directory traversal sequences (..)');
            }

            // Check if log directory exists or can be created
            const logDir = path.dirname(logFile);
            const resolvedLogDir = path.isAbsolute(logDir) ? logDir : path.resolve(__dirname, '../../../', logDir);

            try {
                if (!fs.existsSync(resolvedLogDir)) {
                    try {
                        fs.mkdirSync(resolvedLogDir, { recursive: true });
                        logger.info(`📁 Created log directory: ${resolvedLogDir}`);
                    } catch (mkdirError) {
                        warnings.push(`LOG_FILE directory cannot be created: ${resolvedLogDir}. Error: ${mkdirError.message}`);
                    }
                }
            } catch (error) {
                warnings.push(`LOG_FILE validation warning: ${error.message}`);
            }
        }

        // Validate CLIENT_URL format (if provided)
        if (process.env.CLIENT_URL) {
            const clientUrlPattern = /^https?:\/\/.+/;
            if (!clientUrlPattern.test(process.env.CLIENT_URL)) {
                warnings.push('CLIENT_URL should be a valid HTTP/HTTPS URL');
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