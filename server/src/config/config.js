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
    'JWT_SECRET',
    'MONGODB_URI'
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
  
  // MongoDB configuration
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/charging-simulator',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
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
  },
};

export default config;
