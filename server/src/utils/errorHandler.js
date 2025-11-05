import logger from './logger.js';
import { captureException } from './sentry.js';

/**
 * Enterprise Error Handling System
 */

// Custom Error Classes
export class AppError extends Error {
    constructor(message, statusCode, errorCode = null, isOperational = true) {
        super(message);

        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT_ERROR');
    }
}

export class DatabaseError extends AppError {
    constructor(message, originalError = null) {
        super(message, 500, 'DATABASE_ERROR');
        this.originalError = originalError;
    }
}

export class OCPPError extends AppError {
    constructor(message, ocppErrorCode = null, details = null) {
        super(message, 400, 'OCPP_ERROR');
        this.ocppErrorCode = ocppErrorCode;
        this.details = details;
    }
}

export class ExternalServiceError extends AppError {
    constructor(service, message, statusCode = 502) {
        super(`${service} service error: ${message}`, statusCode, 'EXTERNAL_SERVICE_ERROR');
        this.service = service;
    }
}

/**
 * Central Error Handler Class
 */
class ErrorHandler {
    constructor() {
        this.errorCounts = new Map();
        this.errorPatterns = new Map();
    }

    /**
     * Handle operational errors
     */
    handleError(error, req = null, res = null) {
        // Log the error
        this.logError(error, req);

        // Track error patterns
        this.trackError(error);

        // Send response if applicable
        if (res && !res.headersSent) {
            this.sendErrorResponse(error, res);
        }

        // Alert if critical
        if (this.isCriticalError(error)) {
            this.sendCriticalAlert(error, req);
        }
    }

    /**
     * Log error with context
     */
    logError(error, req = null) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            statusCode: error.statusCode,
            errorCode: error.errorCode,
            timestamp: error.timestamp || new Date().toISOString(),
            isOperational: error.isOperational,
        };

        // Add request context if available
        if (req) {
            errorInfo.request = {
                method: req.method,
                url: req.originalUrl || req.url,
                ip: req.ip || req.connection ? .remoteAddress,
                userAgent: req.get('User-Agent'),
                userId: req.user ? .id,
                body: this.sanitizeRequestBody(req.body),
                params: req.params,
                query: req.query
            };
        }

        // Add additional context for specific error types
        if (error instanceof OCPPError) {
            errorInfo.ocpp = {
                errorCode: error.ocppErrorCode,
                details: error.details
            };
        }

        if (error instanceof DatabaseError && error.originalError) {
            errorInfo.database = {
                originalMessage: error.originalError.message,
                code: error.originalError.code
            };
        }

        // Log based on severity
        if (error.statusCode >= 500 || !error.isOperational) {
            logger.error('Unhandled Error:', errorInfo);
            // Send to Sentry for server errors and non-operational errors
            if (!error.isOperational || error.statusCode >= 500) {
                captureException(error, {
                    user: req ? .user ? { id: req.user.id, username: req.user.username } : null,
                    tags: {
                        errorCode: error.errorCode || 'UNKNOWN',
                        statusCode: error.statusCode || 500
                    },
                    extra: {
                        request: errorInfo.request,
                        ocpp: errorInfo.ocpp,
                        database: errorInfo.database
                    }
                });
            }
        } else if (error.statusCode >= 400) {
            logger.warn('Client Error:', errorInfo);
        } else {
            logger.info('Application Error:', errorInfo);
        }
    }

    /**
     * Send error response to client
     */
    sendErrorResponse(error, res) {
        const isDevelopment = process.env.NODE_ENV === 'development';

        // Default error response
        const errorResponse = {
            success: false,
            error: {
                message: error.message || 'Internal server error',
                code: error.errorCode || 'INTERNAL_ERROR',
                timestamp: new Date().toISOString()
            }
        };

        // Add details for specific error types
        if (error instanceof ValidationError && error.details) {
            errorResponse.error.details = error.details;
        }

        if (error instanceof OCPPError) {
            errorResponse.error.ocpp = {
                errorCode: error.ocppErrorCode,
                details: error.details
            };
        }

        // Add stack trace in development
        if (isDevelopment && error.stack) {
            errorResponse.error.stack = error.stack;
        }

        // Add request ID for tracking
        if (res.locals.requestId) {
            errorResponse.error.requestId = res.locals.requestId;
        }

        // Send response
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json(errorResponse);
    }

    /**
     * Track error patterns for monitoring
     */
    trackError(error) {
        const errorKey = `${error.constructor.name}:${error.statusCode}`;
        const count = this.errorCounts.get(errorKey) || 0;
        this.errorCounts.set(errorKey, count + 1);

        // Pattern detection
        const pattern = this.detectErrorPattern(error);
        if (pattern) {
            this.errorPatterns.set(pattern.id, {
                ...pattern,
                lastOccurrence: new Date().toISOString(),
                count: (this.errorPatterns.get(pattern.id) ? .count || 0) + 1
            });
        }
    }

    /**
     * Detect error patterns
     */
    detectErrorPattern(error) {
        // Database connection patterns
        if (error.message ? .includes('ECONNREFUSED') ||
            error.message ? .includes('connection refused')) {
            return {
                id: 'DATABASE_CONNECTION_ISSUE',
                type: 'connectivity',
                severity: 'high',
                description: 'Database connection issues detected'
            };
        }

        // Authentication patterns
        if (error instanceof AuthenticationError) {
            return {
                id: 'AUTHENTICATION_FAILURES',
                type: 'security',
                severity: 'medium',
                description: 'Multiple authentication failures'
            };
        }

        // OCPP patterns
        if (error instanceof OCPPError && error.ocppErrorCode) {
            return {
                id: `OCPP_${error.ocppErrorCode}`,
                type: 'protocol',
                severity: 'medium',
                description: `OCPP ${error.ocppErrorCode} errors`
            };
        }

        return null;
    }

    /**
     * Check if error is critical
     */
    isCriticalError(error) {
        // Database errors
        if (error instanceof DatabaseError) return true;

        // Server errors
        if (error.statusCode >= 500) return true;

        // High frequency errors
        const errorKey = `${error.constructor.name}:${error.statusCode}`;
        const count = this.errorCounts.get(errorKey) || 0;
        if (count > 10) return true; // More than 10 occurrences

        // Non-operational errors
        if (error.isOperational === false) return true;

        return false;
    }

    /**
     * Send critical error alerts
     */
    async sendCriticalAlert(error, req = null) {
        try {
            const alert = {
                type: 'CRITICAL_ERROR',
                error: {
                    message: error.message,
                    code: error.errorCode,
                    statusCode: error.statusCode,
                    timestamp: new Date().toISOString()
                },
                context: req ? {
                    method: req.method,
                    url: req.originalUrl || req.url,
                    ip: req.ip,
                    userId: req.user ? .id
                } : null,
                server: {
                    environment: process.env.NODE_ENV,
                    hostname: process.env.HOSTNAME || 'unknown',
                    version: process.env.npm_package_version
                }
            };

            // Log critical alert
            logger.error('🚨 CRITICAL ALERT:', alert);

            // Send to Sentry
            captureException(error, {
                user: req ? .user ? { id: req.user.id, username: req.user.username } : null,
                tags: {
                    errorCode: error.errorCode || 'CRITICAL',
                    statusCode: error.statusCode || 500,
                    alertType: 'CRITICAL'
                },
                extra: {
                    alert: alert
                }
            });

            // In production, you would send to external monitoring service
            // Example: Sentry, DataDog, New Relic, etc.
            if (process.env.NODE_ENV === 'production') {
                await this.sendToExternalMonitoring(alert);
            }

        } catch (alertError) {
            logger.error('Failed to send critical alert:', alertError);
        }
    }

    /**
     * Send to external monitoring service
     */
    async sendToExternalMonitoring(alert) {
        // Placeholder for external monitoring integration
        // Example implementations:

        // Sentry
        // Sentry.captureException(alert.error);

        // Webhook notification
        // await fetch(process.env.ALERT_WEBHOOK_URL, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(alert)
        // });

        logger.info('Alert sent to external monitoring (placeholder)');
    }

    /**
     * Sanitize request body for logging
     */
    sanitizeRequestBody(body) {
        if (!body || typeof body !== 'object') return body;

        const sanitized = {...body };
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];

        Object.keys(sanitized).forEach(key => {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                sanitized[key] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    /**
     * Get error statistics
     */
    getErrorStatistics() {
        return {
            errorCounts: Object.fromEntries(this.errorCounts),
            errorPatterns: Object.fromEntries(this.errorPatterns),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Clear error statistics
     */
    clearStatistics() {
        this.errorCounts.clear();
        this.errorPatterns.clear();
    }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

/**
 * Express error handling middleware
 */
export const globalErrorHandler = (err, req, res, next) => {
    // Ensure we have an AppError instance
    let error = err;

    if (!(error instanceof AppError)) {
        // Convert common errors to AppError
        if (error.name === 'ValidationError') {
            error = new ValidationError('Validation failed', Object.values(error.errors).map(e => e.message));
        } else if (error.name === 'CastError') {
            error = new ValidationError('Invalid data format');
        } else if (error.code === 11000) {
            // MongoDB duplicate key error (not applicable to JSON storage but kept for compatibility)
            error = new ConflictError('Resource already exists');
        } else if (error.name === 'MongoNetworkError') {
            // MongoDB network error (not applicable to JSON storage but kept for compatibility)
            error = new DatabaseError('Database connection failed', error);
        } else if (error.code === 'ENOENT') {
            // JSON storage file not found
            error = new DatabaseError('Storage file not found', error);
        } else if (error.code === 'EACCES') {
            // JSON storage permission denied
            error = new DatabaseError('Storage permission denied', error);
        } else if (error.code === 'ENOSPC') {
            // No space left on device
            error = new DatabaseError('Storage space exhausted', error);
        } else if (error.name === 'JsonWebTokenError') {
            error = new AuthenticationError('Invalid token');
        } else if (error.name === 'TokenExpiredError') {
            error = new AuthenticationError('Token expired');
        } else {
            // Generic server error
            error = new AppError(
                process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
                500,
                'INTERNAL_ERROR',
                false
            );
        }
    }

    errorHandler.handleError(error, req, res);
};

/**
 * Async error wrapper for routes
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Unhandled rejection handler
 */
export const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);

        const error = new AppError(
            'Unhandled Promise Rejection',
            500,
            'UNHANDLED_REJECTION',
            false
        );

        errorHandler.handleError(error);

        // Graceful shutdown
        process.exit(1);
    });
};

/**
 * Uncaught exception handler
 */
export const handleUncaughtException = () => {
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);

        const appError = new AppError(
            'Uncaught Exception',
            500,
            'UNCAUGHT_EXCEPTION',
            false
        );

        errorHandler.handleError(appError);

        // Graceful shutdown
        process.exit(1);
    });
};

export default errorHandler;