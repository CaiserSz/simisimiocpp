/**
 * API Constants
 * 
 * Created: 2025-01-11
 * Purpose: Centralized API-related constants
 */

// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
};

// API Error Codes
export const API_ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    CONFLICT_ERROR: 'CONFLICT_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    OCPP_ERROR: 'OCPP_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    CSRF_ERROR: 'CSRF_ERROR'
};

// API Success Messages
export const API_SUCCESS_MESSAGES = {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    RETRIEVED: 'Resource retrieved successfully',
    OPERATION_SUCCESS: 'Operation completed successfully'
};

// API Error Messages
export const API_ERROR_MESSAGES = {
    VALIDATION_FAILED: 'Validation failed',
    AUTHENTICATION_FAILED: 'Authentication failed',
    AUTHORIZATION_FAILED: 'Insufficient permissions',
    NOT_FOUND: 'Resource not found',
    CONFLICT: 'Resource conflict',
    INTERNAL_ERROR: 'Internal server error',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    CSRF_TOKEN_INVALID: 'CSRF token validation failed'
};

// API Version
export const API_VERSION = {
    CURRENT: 'v1',
    SUPPORTED: ['v1'],
    DEFAULT: 'v1'
};

// Request Timeout (milliseconds)
export const REQUEST_TIMEOUT = {
    DEFAULT: 30000, // 30 seconds
    SHORT: 10000, // 10 seconds
    LONG: 60000, // 60 seconds
    VERY_LONG: 120000 // 2 minutes
};

// Rate Limiting
export const RATE_LIMITS = {
    AUTH: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5 // 5 requests per window
    },
    API: {
        windowMs: 60 * 1000, // 1 minute
        max: 100 // 100 requests per minute
    },
    SIMULATOR: {
        ADMIN: {
            windowMs: 60 * 1000,
            max: 500
        },
        USER: {
            windowMs: 60 * 1000,
            max: 200
        },
        ANONYMOUS: {
            windowMs: 60 * 1000,
            max: 100
        }
    },
    ADMIN: {
        windowMs: 60 * 1000,
        max: 1000
    }
};

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1
};

export default {
    HTTP_STATUS,
    API_ERROR_CODES,
    API_SUCCESS_MESSAGES,
    API_ERROR_MESSAGES,
    API_VERSION,
    REQUEST_TIMEOUT,
    RATE_LIMITS,
    PAGINATION
};

