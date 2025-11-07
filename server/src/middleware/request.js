import { v4 as uuidv4 } from 'uuid';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Request Middleware
 * Handles request ID tracking, timeout, and logging
 * 
 * Created: 2025-01-11
 * Purpose: Comprehensive request tracking and timeout protection
 */

/**
 * Request ID middleware
 * Generates unique request ID and adds to request/response headers
 */
export const requestIdMiddleware = (req, res, next) => {
    // Check if request ID already exists (from proxy/load balancer)
    const requestId = req.headers['x-request-id'] ||
        req.headers['x-requested-with'] ||
        `req_${Date.now()}_${uuidv4().substring(0, 8)}`;

    // Add to request object
    req.id = requestId;
    req.requestId = requestId; // Alternative property name

    // Add to response locals for use in error handlers
    res.locals.requestId = requestId;

    // Set response header
    res.set('X-Request-ID', requestId);

    // Add to logger context (if logger supports it)
    if (logger.child) {
        req.logger = logger.child({ requestId });
    } else {
        req.logger = logger;
    }

    next();
};

/**
 * Request timeout middleware
 * Automatically terminates long-running requests
 */
export const requestTimeoutMiddleware = (timeoutMs = 30000) => {
    return (req, res, next) => {
        // Set timeout
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                const requestId = req.id || req.requestId || 'unknown';
                logger.warn(`⏱️ Request timeout after ${timeoutMs}ms`, {
                    requestId,
                    method: req.method,
                    url: req.originalUrl,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });

                // Clear timeout to prevent double response
                clearTimeout(timeout);

                // Send timeout response
                res.status(408).json({
                    success: false,
                    error: 'Request timeout',
                    message: `Request exceeded maximum duration of ${timeoutMs}ms`,
                    requestId,
                    timeout: timeoutMs
                });
            }
        }, timeoutMs);

        // Clear timeout on response
        res.on('finish', () => {
            clearTimeout(timeout);
        });

        res.on('close', () => {
            clearTimeout(timeout);
        });

        next();
    };
};

/**
 * Request logging middleware
 * Logs request details for debugging and monitoring
 */
export const requestLoggingMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.id || req.requestId || 'unknown';

    // Log request start (debug level)
    logger.debug(`📥 Incoming request`, {
        requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length')
    });

    // Log request completion
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'debug';

        logger[logLevel](`📤 Request completed`, {
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Record slow requests
        if (duration > 5000) {
            logger.warn(`🐌 Slow request detected`, {
                requestId,
                method: req.method,
                url: req.originalUrl,
                duration: `${duration}ms`,
                threshold: '5000ms'
            });
        }
    });

    next();
};

/**
 * Request context middleware
 * Adds request context to req object for use in controllers
 */
export const requestContextMiddleware = (req, res, next) => {
    req.context = {
        requestId: req.id || req.requestId,
        startTime: Date.now(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        user: req.user || null, // From auth middleware
        timestamp: new Date().toISOString()
    };

    next();
};

/**
 * Complete request middleware setup
 */
export const setupRequestMiddleware = (app) => {
    // Request ID (must be first)
    app.use(requestIdMiddleware);

    // Request context
    app.use(requestContextMiddleware);

    // Request timeout (30 seconds default, configurable)
    const timeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS) || 30000;
    app.use(requestTimeoutMiddleware(timeoutMs));

    // Request logging (after timeout to log timeouts)
    if (config.env === 'development' || process.env.ENABLE_REQUEST_LOGGING === 'true') {
        app.use(requestLoggingMiddleware);
    }

    logger.info('📋 Request middleware configured', {
        timeout: `${timeoutMs}ms`,
        logging: config.env === 'development' || process.env.ENABLE_REQUEST_LOGGING === 'true'
    });
};

export default {
    requestIdMiddleware,
    requestTimeoutMiddleware,
    requestLoggingMiddleware,
    requestContextMiddleware,
    setupRequestMiddleware
};