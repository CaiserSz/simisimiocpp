import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Validate critical environment variables
const validateConfig = () => {
  const requiredVars = [
    'JWT_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // JWT Secret minimum length check
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
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
    jwtSecret: process.env.JWT_SECRET,
    passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS) || 12,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    jwtCookieExpiresIn: parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 1,
  },

  // Email configuration
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    username: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    fromName: process.env.EMAIL_FROM_NAME || 'EV Charging Network',
    fromEmail: process.env.EMAIL_FROM || 'noreply@evcharging.com',
  },

  // Client configuration
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
  },
};

export default config;
