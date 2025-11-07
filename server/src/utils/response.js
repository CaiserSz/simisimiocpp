/**
 * Standardized API Response Utilities
 * 
 * Created: 2025-01-11
 * Purpose: Consistent API response format across the application
 */

import { API_ERROR_CODES, HTTP_STATUS } from '../constants/api.constants.js';

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {Object} meta - Additional metadata
 */
export const success = (res, data, statusCode = HTTP_STATUS.OK, meta = {}) => {
    const response = {
        success: true,
        data
    };

    // Add metadata
    if (res.locals.requestId || meta.requestId) {
        response.meta = {
            requestId: res.locals.requestId || meta.requestId,
            timestamp: new Date().toISOString(),
            ...meta
        };
    } else if (Object.keys(meta).length > 0) {
        response.meta = {
            timestamp: new Date().toISOString(),
            ...meta
        };
    }

    return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {Error|string} error - Error object or error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} errorCode - API error code
 * @param {*} details - Additional error details
 */
export const error = (res, error, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = null, details = null) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorCodeFinal = errorCode || (error instanceof Error && error.errorCode) || API_ERROR_CODES.INTERNAL_ERROR;

    const response = {
        success: false,
        error: {
            code: errorCodeFinal,
            message: errorMessage,
            ...(details && { details })
        }
    };

    // Add metadata
    if (res.locals.requestId) {
        response.meta = {
            requestId: res.locals.requestId,
            timestamp: new Date().toISOString()
        };
    } else {
        response.meta = {
            timestamp: new Date().toISOString()
        };
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && error instanceof Error && error.stack) {
        response.error.stack = error.stack;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array|Object} validationErrors - Validation errors
 * @param {string} message - Error message
 */
export const validationError = (res, validationErrors, message = 'Validation failed') => {
    return error(
        res,
        message,
        HTTP_STATUS.BAD_REQUEST,
        API_ERROR_CODES.VALIDATION_ERROR,
        Array.isArray(validationErrors) ? validationErrors : { errors: validationErrors }
    );
};

/**
 * Send not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 */
export const notFound = (res, resource = 'Resource') => {
    return error(
        res,
        `${resource} not found`,
        HTTP_STATUS.NOT_FOUND,
        API_ERROR_CODES.NOT_FOUND_ERROR
    );
};

/**
 * Send unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const unauthorized = (res, message = 'Authentication required') => {
    return error(
        res,
        message,
        HTTP_STATUS.UNAUTHORIZED,
        API_ERROR_CODES.AUTHENTICATION_ERROR
    );
};

/**
 * Send forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const forbidden = (res, message = 'Insufficient permissions') => {
    return error(
        res,
        message,
        HTTP_STATUS.FORBIDDEN,
        API_ERROR_CODES.AUTHORIZATION_ERROR
    );
};

/**
 * Send conflict error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const conflict = (res, message = 'Resource conflict') => {
    return error(
        res,
        message,
        HTTP_STATUS.CONFLICT,
        API_ERROR_CODES.CONFLICT_ERROR
    );
};

/**
 * Send created response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {Object} meta - Additional metadata
 */
export const created = (res, data, meta = {}) => {
    return success(res, data, HTTP_STATUS.CREATED, meta);
};

/**
 * Send no content response
 * @param {Object} res - Express response object
 */
export const noContent = (res) => {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Data array
 * @param {Object} pagination - Pagination info {page, limit, total}
 * @param {Object} meta - Additional metadata
 */
export const paginated = (res, data, pagination, meta = {}) => {
    const { page, limit, total } = pagination;
    const totalPages = Math.ceil(total / limit);

    return success(res, data, HTTP_STATUS.OK, {
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        },
        ...meta
    });
};

export default {
    success,
    error,
    validationError,
    notFound,
    unauthorized,
    forbidden,
    conflict,
    created,
    noContent,
    paginated
};