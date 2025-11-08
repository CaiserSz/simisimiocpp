import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = dirname(__filename);

const { combine, timestamp, printf, colorize, align, errors, splat, json } = winston.format;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Enhanced log format with structured data
const logFormat = printf(({ level, message, timestamp, traceId, spanId, ...meta }) => {
    const traceInfo = traceId ? `[trace:${traceId}${spanId ? ` span:${spanId}` : ''}]` : '';
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]${traceInfo}: ${message}${metaString}`;
});

// Structured JSON format for log aggregation
const jsonFormat = combine(
    timestamp(),
    errors({ stack: true }),
    splat(),
    json()
);

// Get log level - use env var in test, otherwise default
const getLogLevel = () => {
    if (process.env.NODE_ENV === 'test') {
        return process.env.LOG_LEVEL || 'error';
    }
    return process.env.LOG_LEVEL || 'info';
};

// Logger configuration with enhanced structured logging
const logger = winston.createLogger({
    level: getLogLevel(),
    format: jsonFormat,
    defaultMeta: { 
        service: 'ocpp-simulator',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Error logs with daily rotation
        new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d', // Keep 14 days of error logs
            format: jsonFormat
        }),
        
        // Combined logs with daily rotation
        new DailyRotateFile({
            filename: path.join(logsDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '7d', // Keep 7 days of combined logs
            format: jsonFormat
        }),
        
        // Application logs (info and above)
        new DailyRotateFile({
            filename: path.join(logsDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'info',
            maxSize: '20m',
            maxFiles: '7d',
            format: jsonFormat
        })
    ],
    exitOnError: false, // Don't exit on handled exceptions
});

// If we're not in production, also log to the console with colors
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

// Enhanced logger methods with trace support
const originalLog = logger.log.bind(logger);
logger.log = function(level, message, meta = {}) {
    // Extract trace context if available
    const traceId = meta.traceId || meta.trace?.traceId;
    const spanId = meta.spanId || meta.trace?.spanId;
    
    if (traceId || spanId) {
        meta = {
            ...meta,
            traceId,
            spanId
        };
    }
    
    return originalLog(level, message, meta);
};

// Create a stream object with a 'write' function that will be used by Morgan
logger.stream = {
    write: function(message) {
        logger.info(message.trim());
    },
};

// Export logger with enhanced methods
export default logger;
