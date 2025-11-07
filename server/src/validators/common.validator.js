/**
 * Common Validation Utilities
 * 
 * Created: 2025-01-11
 * Purpose: Reusable validation utilities and helpers
 */

import { validationResult } from 'express-validator';
import { validationError } from '../utils/response.js';

/**
 * Middleware to check validation results
 * Must be called after express-validator middleware
 */
export const checkValidation = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return validationError(res, errors.array());
    }

    next();
};

/**
 * Sanitize string input
 */
export const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const isValidURL = (url, protocols = ['http', 'https']) => {
    try {
        const urlObj = new URL(url);
        return protocols.includes(urlObj.protocol.slice(0, -1));
    } catch {
        return false;
    }
};

/**
 * Validate WebSocket URL format
 */
export const isValidWebSocketURL = (url) => {
    return isValidURL(url, ['ws', 'wss']);
};

/**
 * Validate port number
 */
export const isValidPort = (port) => {
    const portNum = parseInt(port, 10);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
};

/**
 * Validate IP address format
 */
export const isValidIP = (ip) => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

/**
 * Validate date string (ISO format)
 */
export const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

/**
 * Validate positive integer
 */
export const isValidPositiveInteger = (value) => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0;
};

/**
 * Validate positive float
 */
export const isValidPositiveFloat = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
};

/**
 * Validate range (min <= value <= max)
 */
export const isValidRange = (value, min, max) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
};

/**
 * Sanitize object (remove undefined, null, empty strings)
 */
export const sanitizeObject = (obj) => {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null && value !== '') {
            sanitized[key] = typeof value === 'string' ? sanitizeString(value) : value;
        }
    }
    return sanitized;
};

export default {
    checkValidation,
    sanitizeString,
    isValidUUID,
    isValidEmail,
    isValidURL,
    isValidWebSocketURL,
    isValidPort,
    isValidIP,
    isValidDate,
    isValidPositiveInteger,
    isValidPositiveFloat,
    isValidRange,
    sanitizeObject
};