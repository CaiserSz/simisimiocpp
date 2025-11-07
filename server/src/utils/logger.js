import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = dirname(__filename);

const { combine, timestamp, printf, colorize, align } = winston.format;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...meta }) => {
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaString}`;
});

// Lazy load config to avoid circular dependency
const getConfig = () => {
    // Use dynamic import to break circular dependency
    if (process.env.NODE_ENV === 'test') {
        // In test environment, use environment variables directly
        return {
            logging: { level: process.env.LOG_LEVEL || 'error' },
            env: 'test'
        };
    }
    // Lazy import config only when needed
    return import ('../config/config.js').then(m => m.default);
};

// Get log level - use env var in test, otherwise default
const getLogLevel = () => {
    if (process.env.NODE_ENV === 'test') {
        return process.env.LOG_LEVEL || 'error';
    }
    // For non-test, we'll initialize logger after config loads
    return process.env.LOG_LEVEL || 'info';
};

// Logger configuration - use lazy config loading
const logger = winston.createLogger({
    level: getLogLevel(),
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'ocpp-simulator' },
    transports: [
        // Write all logs with level `error` and below to `error.log`
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
        // Write all logs to `combined.log`
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
    ],
    exitOnError: false, // Don't exit on handled exceptions
});

// If we're not in production, also log to the console with colors
// Use lazy check to avoid circular dependency
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    logger.add(
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: 'HH:mm:ss' }),
                align(),
                logFormat
            ),
        })
    );
}

// Create a stream object with a 'write' function that will be used by Morgan
logger.stream = {
    write: function(message) {
        logger.info(message.trim());
    },
};

export default logger;