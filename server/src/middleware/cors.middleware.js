import logger from '../utils/logger.js';
import config from '../config/config.js';

/**
 * CORS Validation Middleware
 * Enhanced CORS validation with security checks
 * 
 * Created: 2025-01-11
 * Purpose: Comprehensive CORS origin validation beyond simple whitelist
 */

/**
 * Validate origin format
 */
const validateOriginFormat = (origin) => {
    try {
        const url = new URL(origin);
        
        // Validate protocol
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return {
                valid: false,
                reason: 'Invalid protocol. Only http:// and https:// are allowed'
            };
        }
        
        // Validate hostname format
        if (!url.hostname || url.hostname.length === 0) {
            return {
                valid: false,
                reason: 'Missing hostname'
            };
        }
        
        // Validate hostname format (basic check)
        const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!hostnamePattern.test(url.hostname)) {
            return {
                valid: false,
                reason: 'Invalid hostname format'
            };
        }
        
        // Check for suspicious patterns
        if (url.hostname.includes('..') || url.hostname.includes('//')) {
            return {
                valid: false,
                reason: 'Suspicious hostname pattern detected'
            };
        }
        
        return {
            valid: true,
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? '443' : '80')
        };
    } catch (error) {
        return {
            valid: false,
            reason: `Invalid URL format: ${error.message}`
        };
    }
};

/**
 * Check if origin matches allowed origin (with subdomain support)
 */
const matchesAllowedOrigin = (origin, allowedOrigin) => {
    // Exact match
    if (origin === allowedOrigin) {
        return true;
    }
    
    // Wildcard support: *.example.com matches subdomain.example.com
    if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.substring(2);
        const originUrl = new URL(origin);
        return originUrl.hostname === domain || originUrl.hostname.endsWith(`.${domain}`);
    }
    
    // Subdomain matching: example.com matches www.example.com, api.example.com, etc.
    // But only if explicitly allowed
    try {
        const allowedUrl = new URL(allowedOrigin);
        const originUrl = new URL(origin);
        
        // Same protocol required
        if (allowedUrl.protocol !== originUrl.protocol) {
            return false;
        }
        
        // Same port (or default ports match)
        const allowedPort = allowedUrl.port || (allowedUrl.protocol === 'https:' ? '443' : '80');
        const originPort = originUrl.port || (originUrl.protocol === 'https:' ? '443' : '80');
        
        if (allowedPort !== originPort) {
            return false;
        }
        
        // Hostname matching (exact or subdomain)
        const allowedHostname = allowedUrl.hostname;
        const originHostname = originUrl.hostname;
        
        // Exact match
        if (allowedHostname === originHostname) {
            return true;
        }
        
        // Subdomain match (origin is subdomain of allowed)
        if (originHostname.endsWith(`.${allowedHostname}`)) {
            return true;
        }
        
        return false;
    } catch (error) {
        return false;
    }
};

/**
 * Enhanced CORS validation middleware
 */
export const corsValidation = (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = config.cors.allowedOrigins || [];
    
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) {
        return next();
    }
    
    // Validate origin format first
    const formatValidation = validateOriginFormat(origin);
    
    if (!formatValidation.valid) {
        logger.warn('🚫 CORS origin format validation failed', {
            origin,
            reason: formatValidation.reason,
            ip: req.ip,
            requestId: req.id || req.requestId
        });
        
        return res.status(403).json({
            success: false,
            error: 'Invalid origin format',
            message: formatValidation.reason,
            requestId: req.id || req.requestId
        });
    }
    
    // Production environment warnings
    if (process.env.NODE_ENV === 'production') {
        // Warn about localhost in production
        if (formatValidation.hostname === 'localhost' || formatValidation.hostname === '127.0.0.1') {
            logger.warn('⚠️ CORS request from localhost in production', {
                origin,
                ip: req.ip,
                requestId: req.id || req.requestId
            });
        }
        
        // Warn about HTTP in production
        if (formatValidation.protocol === 'http:') {
            logger.warn('⚠️ CORS request using HTTP in production', {
                origin,
                ip: req.ip,
                requestId: req.id || req.requestId
            });
        }
    }
    
    // Check if origin is in allowed list
    let isAllowed = false;
    let matchedOrigin = null;
    
    for (const allowedOrigin of allowedOrigins) {
        if (matchesAllowedOrigin(origin, allowedOrigin)) {
            isAllowed = true;
            matchedOrigin = allowedOrigin;
            break;
        }
    }
    
    if (!isAllowed) {
        logger.warn('🚫 CORS request blocked - origin not in whitelist', {
            origin,
            allowedOrigins,
            ip: req.ip,
            method: req.method,
            url: req.originalUrl,
            requestId: req.id || req.requestId
        });
        
        return res.status(403).json({
            success: false,
            error: 'Not allowed by CORS',
            message: `Origin ${origin} is not allowed. Contact administrator if you believe this is an error.`,
            requestId: req.id || req.requestId
        });
    }
    
    // Log successful CORS validation (debug level)
    logger.debug('✅ CORS origin validated', {
        origin,
        matchedOrigin,
        ip: req.ip,
        requestId: req.id || req.requestId
    });
    
    next();
};

/**
 * Enhanced CORS options with validation
 */
export const createCorsOptions = () => {
    return {
        origin: (origin, callback) => {
            const allowedOrigins = config.cors.allowedOrigins || [];
            
            // Allow requests with no origin
            if (!origin) {
                return callback(null, true);
            }
            
            // Validate origin format
            const formatValidation = validateOriginFormat(origin);
            
            if (!formatValidation.valid) {
                logger.warn('🚫 CORS origin format validation failed', {
                    origin,
                    reason: formatValidation.reason,
                    ip: origin // This is a callback, no req available
                });
                return callback(new Error(formatValidation.reason));
            }
            
            // Check if origin is allowed
            let isAllowed = false;
            for (const allowedOrigin of allowedOrigins) {
                if (matchesAllowedOrigin(origin, allowedOrigin)) {
                    isAllowed = true;
                    break;
                }
            }
            
            if (!isAllowed) {
                logger.warn(`🚫 CORS blocked request from origin: ${origin}`);
                return callback(new Error('Not allowed by CORS'));
            }
            
            callback(null, true);
        },
        credentials: config.cors.credentials,
        methods: config.cors.methods,
        allowedHeaders: config.cors.allowedHeaders,
        exposedHeaders: config.cors.exposedHeaders,
        maxAge: config.cors.maxAge,
        optionsSuccessStatus: 200 // Some legacy browsers (IE11) choke on 204
    };
};

export default {
    corsValidation,
    createCorsOptions,
    validateOriginFormat,
    matchesAllowedOrigin
};

