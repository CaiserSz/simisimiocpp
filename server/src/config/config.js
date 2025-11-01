import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file (project root)
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Validate critical environment variables
const validateConfig = () => {
  // Only validate JWT_SECRET if authentication is enabled
  if (process.env.ENABLE_AUTH === 'true') {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required when ENABLE_AUTH=true');
    }
    
    // JWT Secret minimum length check
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long when authentication is enabled');
    }
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

  // Redis configuration (optional - only needed if caching enabled)
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true' || false,
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
  },
};

export default config;
