import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import helmet from 'helmet';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/**
 * Enhanced Security Middleware for Production
 */

/**
 * CSRF Protection using Double-Submit Cookie Pattern
 * Modern, secure CSRF protection that works with API and web apps
 */
export const csrfProtection = (req, res, next) => {
    // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip CSRF if authentication is disabled (development only)
    if (!config.security.enableAuth) {
        if (process.env.NODE_ENV === 'production') {
            logger.error('🚨 CSRF protection bypassed in production - this is a security risk!');
        }
        return next();
    }

    // Get CSRF token from cookie
    const csrfTokenCookie = req.cookies['XSRF-TOKEN'];

    // Get CSRF token from header (X-XSRF-TOKEN or X-CSRF-TOKEN)
    const csrfTokenHeader = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];

    // If no cookie token exists, generate and set one
    if (!csrfTokenCookie) {
        const token = crypto.randomBytes(32).toString('hex');
        res.cookie('XSRF-TOKEN', token, {
            httpOnly: false, // Must be accessible to JavaScript for header submission
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // For first request, allow it (token will be set)
        if (!csrfTokenHeader) {
            return next();
        }
    }

    // Validate CSRF token
    if (!csrfTokenHeader || csrfTokenHeader !== csrfTokenCookie) {
        logger.warn('🚨 CSRF token validation failed', {
            ip: req.ip,
            method: req.method,
            url: req.originalUrl,
            requestId: req.id || req.requestId,
            hasCookie: !!csrfTokenCookie,
            hasHeader: !!csrfTokenHeader
        });

        return res.status(403).json({
            success: false,
            error: 'CSRF token validation failed',
            message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
            requestId: req.id || req.requestId
        });
    }

    // Token is valid, continue
    next();
};

/**
 * Generate CSRF token endpoint
 * Clients can call this to get a CSRF token
 */
export const generateCsrfToken = (req, res) => {
    const token = crypto.randomBytes(32).toString('hex');

    res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
        success: true,
        csrfToken: token,
        message: 'CSRF token generated and set in cookie'
    });
};

/**
 * Advanced rate limiting with different tiers
 * Supports both IP-based and user-based rate limiting
 */
export const createRateLimiter = (options = {}) => {
    const defaults = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
        // Key generator: use user ID if authenticated, otherwise use IP
        keyGenerator: (req) => {
            if (req.user && req.user.id) {
                return `user:${req.user.id}`;
            }
            return req.ip;
        }
    };

    return rateLimit({
        ...defaults,
        ...options,
        handler: (req, res) => {
            const identifier = req.user?.id ? `User ${req.user.id}` : `IP ${req.ip}`;
            logger.warn(`Rate limit exceeded for ${identifier}`, {
                userId: req.user?.id,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                url: req.originalUrl,
                method: req.method,
                requestId: req.id || req.requestId
            });

            res.status(429).json({
                success: false,
                error: 'Too many requests, please try again later.',
                retryAfter: Math.ceil((options.windowMs || defaults.windowMs) / 1000) || 900,
                requestId: req.id || req.requestId
            });
        }
    });
};

/**
 * User-based rate limiter (only applies to authenticated users)
 * Falls back to IP-based limiting for anonymous users
 */
export const createUserRateLimiter = (options = {}) => {
    return createRateLimiter({
        ...options,
        keyGenerator: (req) => {
            if (req.user && req.user.id) {
                return `user:${req.user.id}`;
            }
            // For anonymous users, use IP with prefix to differentiate
            return `ip:${req.ip}`;
        },
        skip: (req) => {
            // Skip rate limiting for authenticated users if option is set
            // This allows IP-based limiting to handle anonymous users
            return false;
        }
    });
};

/**
 * IP-based rate limiter (original behavior)
 * Use this when you want to enforce IP-based limits regardless of authentication
 */
export const createIPRateLimiter = (options = {}) => {
    return createRateLimiter({
        ...options,
        keyGenerator: (req) => req.ip
    });
};

/**
 * Specialized rate limiters
 */

// Auth rate limiter - IP-based (before authentication)
export const authRateLimit = createIPRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes per IP
    skipSuccessfulRequests: true
});

// API rate limiter - User-based (falls back to IP for anonymous)
export const apiRateLimit = createUserRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 1000, // 1000 API calls per 15 minutes per user/IP
    skipSuccessfulRequests: false
});

// Simulator rate limiter - User-based with higher limits for authenticated users
export const simulatorRateLimit = createUserRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: (req) => {
        // Higher limits for authenticated users
        if (req.user && req.user.id) {
            return req.user.role === 'admin' ? 500 : 200; // Admins get 500, regular users get 200
        }
        return 100; // Anonymous users get 100
    },
    skipSuccessfulRequests: false
});

// Admin rate limiter - Higher limits for admin users
export const adminRateLimit = createUserRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5000, // 5000 requests per 15 minutes for admin users
    skip: (_req) => {
        // Only apply to admin users
        return !(_req.user && _req.user.role === 'admin');
    }
});

/**
 * Enhanced Helmet configuration
 */
/* eslint-disable quotes */
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'", "'unsafe-eval'"], // unsafe-eval needed for Socket.IO
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false, // Disable for WebSocket compatibility
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});
/* eslint-enable quotes */

/**
 * Input validation helpers
 */
export const validateStationId = () => [
    body('stationId')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Station ID must contain only uppercase letters, numbers, underscores, and hyphens')
    .isLength({ min: 3, max: 50 })
    .withMessage('Station ID must be between 3 and 50 characters')
];

export const validateOCPPVersion = () => [
    body('ocppVersion')
    .isIn(['1.6J', '2.0.1'])
    .withMessage('OCPP version must be 1.6J or 2.0.1')
];

export const validateConnectorCount = () => [
    body('connectorCount')
    .isInt({ min: 1, max: 10 })
    .withMessage('Connector count must be between 1 and 10')
];

export const validateMaxPower = () => [
    body('maxPower')
    .isInt({ min: 1000, max: 1000000 })
    .withMessage('Max power must be between 1kW and 1000kW')
];

export const validateCSMSUrl = () => [
    body('csmsUrl')
    .matches(/^wss?:\/\/.+/)
    .withMessage('CSMS URL must be a valid WebSocket URL')
];

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (req, res, next) => {
    // Remove potentially dangerous fields
    const dangerousFields = ['__proto__', 'constructor', 'prototype'];

    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;

        for (const field of dangerousFields) {
            delete obj[field];
        }

        for (const key in obj) {
            obj[key] = sanitizeObject(obj[key]);
        }

        return obj;
    };

    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);

    next();
};

/**
 * API key validation for external access
 */
export const validateApiKey = (req, res, next) => {
    const apiKey = req.header('X-API-Key');

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API key required'
        });
    }

    // Validate API key format (should be UUID v4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(apiKey)) {
        logger.warn(`Invalid API key format from IP: ${req.ip}`);
        return res.status(401).json({
            success: false,
            error: 'Invalid API key format'
        });
    }

    // Here you would validate against your API key database
    // For now, we'll just check against environment variable
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

    if (!validApiKeys.includes(apiKey)) {
        logger.warn(`Invalid API key attempt from IP: ${req.ip}`);
        return res.status(401).json({
            success: false,
            error: 'Invalid API key'
        });
    }

    next();
};

/**
 * Request signature validation for webhook security
 */
export const validateWebhookSignature = (secret) => {
    return (req, res, next) => {
        const signature = req.header('X-Signature-256');

        if (!signature) {
            return res.status(401).json({
                success: false,
                error: 'Signature required'
            });
        }

        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(req.rawBody);
        const expectedSignature = `sha256=${hmac.digest('hex')}`;

        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            logger.warn(`Invalid webhook signature from IP: ${req.ip}`);
            return res.status(401).json({
                success: false,
                error: 'Invalid signature'
            });
        }

        next();
    };
};

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (allowedIPs = []) => {
    const allowedSet = new Set(allowedIPs);

    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;

        if (allowedIPs.length > 0 && !allowedSet.has(clientIP)) {
            logger.warn(`Blocked request from unauthorized IP: ${clientIP}`);
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        next();
    };
};

/**
 * Request size limiting
 */
export const requestSizeLimit = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.get('content-length') || '0');
        const maxSizeBytes = parseInt(maxSize.replace(/mb|kb/i, '')) * (maxSize.includes('mb') ? 1024 * 1024 : 1024);

        if (contentLength > maxSizeBytes) {
            logger.warn(`Request too large from IP: ${req.ip}, Size: ${contentLength} bytes`);
            return res.status(413).json({
                success: false,
                error: 'Request entity too large'
            });
        }

        next();
    };
};

/**
 * Security event logger
 */
export const logSecurityEvent = (event, req, additional = {}) => {
    logger.warn(`🔒 Security Event: ${event}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        ...additional
    });
};

/**
 * Brute force protection
 */
class BruteForceProtection {
    constructor() {
        this.attempts = new Map(); // IP -> { count, lastAttempt, blocked }
        this.maxAttempts = 10;
        this.blockDuration = 30 * 60 * 1000; // 30 minutes
        this.windowDuration = 15 * 60 * 1000; // 15 minutes

        // Cleanup old entries every hour
        setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }

    isBlocked(ip) {
        const record = this.attempts.get(ip);
        if (!record) return false;

        // Check if block period has expired
        if (record.blocked && Date.now() - record.lastAttempt > this.blockDuration) {
            this.attempts.delete(ip);
            return false;
        }

        return record.blocked;
    }

    recordAttempt(ip, success = false) {
        const now = Date.now();
        const record = this.attempts.get(ip) || { count: 0, lastAttempt: now, blocked: false };

        if (success) {
            // Reset on successful attempt
            this.attempts.delete(ip);
            return;
        }

        // Reset count if window expired
        if (now - record.lastAttempt > this.windowDuration) {
            record.count = 1;
        } else {
            record.count++;
        }

        record.lastAttempt = now;

        // Block if max attempts reached
        if (record.count >= this.maxAttempts) {
            record.blocked = true;
            logger.warn(`🔒 IP blocked due to brute force: ${ip}`);
        }

        this.attempts.set(ip, record);
    }

    cleanup() {
        const now = Date.now();
        for (const [ip, record] of this.attempts) {
            if (now - record.lastAttempt > this.blockDuration) {
                this.attempts.delete(ip);
            }
        }
    }

    getStats() {
        return {
            totalAttempts: this.attempts.size,
            blockedIPs: Array.from(this.attempts.values()).filter(r => r.blocked).length
        };
    }
}

export const bruteForceProtection = new BruteForceProtection();

/**
 * Brute force middleware
 */
export const bruteForceMiddleware = (req, res, next) => {
    const ip = req.ip;

    if (bruteForceProtection.isBlocked(ip)) {
        logSecurityEvent('BRUTE_FORCE_BLOCKED', req);
        return res.status(429).json({
            success: false,
            error: 'Too many failed attempts. Please try again later.',
            retryAfter: 1800 // 30 minutes
        });
    }

    // Hook into response to record attempt result
    const originalSend = res.send;
    res.send = function(data) {
        const success = res.statusCode < 400;
        bruteForceProtection.recordAttempt(ip, success);
        originalSend.call(this, data);
    };

    next();
};

/**
 * Complete security middleware setup
 */
export const setupSecurity = (app) => {
    logger.info('🔒 Setting up security middleware...');

    // Basic security headers
    app.use(securityHeaders);

    // CSRF Protection endpoint (must be before CSRF middleware)
    app.get('/api/csrf-token', generateCsrfToken);

    // CSRF Protection for state-changing operations
    // Apply to all POST, PUT, DELETE, PATCH requests
    app.use('/api', csrfProtection);

    // Request sanitization
    app.use(sanitizeRequest);

    // Request size limiting
    app.use(requestSizeLimit('10mb'));

    // Rate limiting for different routes
    // Auth routes: IP-based (before authentication)
    app.use('/api/auth', authRateLimit);

    // Simulator routes: User-based with role-based limits
    app.use('/api/simulator', simulatorRateLimit);

    // General API routes: User-based (falls back to IP for anonymous)
    app.use('/api', apiRateLimit);

    // Brute force protection for auth routes
    app.use('/api/auth', bruteForceMiddleware);

    logger.info('✅ Security middleware configured (CSRF protection enabled)');
};
