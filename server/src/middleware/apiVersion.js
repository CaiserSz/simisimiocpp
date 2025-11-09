import logger from '../utils/logger.js';

/**
 * API Versioning Middleware
 * Handles API version detection and routing
 * 
 * Created: 2025-01-11
 * Purpose: Support multiple API versions with backward compatibility
 */

// Supported API versions
const SUPPORTED_VERSIONS = ['v1'];
const DEFAULT_VERSION = 'v1';
const CURRENT_VERSION = 'v1';

/**
 * Extract API version from request
 * Checks headers, query params, and URL path
 */
export const extractApiVersion = (req) => {
    // Check Accept header: application/vnd.api+json;version=1
    const acceptHeader = req.headers.accept || '';
    const versionMatch = acceptHeader.match(/version[=:](\d+)/i);
    if (versionMatch) {
        return `v${versionMatch[1]}`;
    }

    // Check custom header: X-API-Version
    const apiVersionHeader = req.headers['x-api-version'];
    if (apiVersionHeader) {
        const version = apiVersionHeader.startsWith('v') ? apiVersionHeader : `v${apiVersionHeader}`;
        if (SUPPORTED_VERSIONS.includes(version)) {
            return version;
        }
    }

    // Check query parameter: ?version=v1
    const queryVersion = req.query.version;
    if (queryVersion) {
        const version = queryVersion.startsWith('v') ? queryVersion : `v${queryVersion}`;
        if (SUPPORTED_VERSIONS.includes(version)) {
            return version;
        }
    }

    // Check URL path: /api/v1/...
    const pathMatch = req.path.match(/^\/v(\d+)\//);
    if (pathMatch) {
        const version = `v${pathMatch[1]}`;
        if (SUPPORTED_VERSIONS.includes(version)) {
            return version;
        }
    }

    // Return default version
    return DEFAULT_VERSION;
};

/**
 * API version middleware
 * Adds version info to request and validates version
 */
export const apiVersionMiddleware = (req, res, next) => {
    const requestedVersion = extractApiVersion(req);
    
    // Validate version
    if (!SUPPORTED_VERSIONS.includes(requestedVersion)) {
        return res.status(400).json({
            success: false,
            error: 'Unsupported API version',
            message: `API version ${requestedVersion} is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
            supportedVersions: SUPPORTED_VERSIONS,
            currentVersion: CURRENT_VERSION,
            requestId: req.id || req.requestId
        });
    }

    // Add version info to request
    req.apiVersion = requestedVersion;
    req.apiVersionIsCurrent = requestedVersion === CURRENT_VERSION;
    
    // Add version headers to response
    res.set('X-API-Version', requestedVersion);
    res.set('X-API-Current-Version', CURRENT_VERSION);
    
    // Add deprecation warning if using old version
    if (!req.apiVersionIsCurrent) {
        res.set('X-API-Deprecated', 'true');
        res.set('X-API-Deprecation-Date', '2025-12-31'); // Example deprecation date
        logger.warn(`⚠️ Deprecated API version used: ${requestedVersion}`, {
            requestId: req.id || req.requestId,
            ip: req.ip,
            url: req.originalUrl
        });
    }

    // Update request context if available
    if (req.context) {
        req.context.apiVersion = requestedVersion;
    }

    next();
};

/**
 * Require specific API version
 * Middleware to enforce version requirement
 */
export const requireApiVersion = (requiredVersion) => {
    return (req, res, next) => {
        if (req.apiVersion !== requiredVersion) {
            return res.status(400).json({
                success: false,
                error: 'API version mismatch',
                message: `This endpoint requires API version ${requiredVersion}, but ${req.apiVersion} was requested`,
                requestedVersion: req.apiVersion,
                requiredVersion,
                requestId: req.id || req.requestId
            });
        }
        next();
    };
};

/**
 * Version-aware route handler
 * Automatically handles version routing
 */
export const versionedRoute = (routeHandler) => {
    return (req, res, next) => {
        // Add version info to response
        const originalJson = res.json.bind(res);
        res.json = function(data) {
            if (data && typeof data === 'object') {
                // Add version metadata to response
                data.meta = {
                    ...data.meta,
                    apiVersion: req.apiVersion,
                    currentVersion: CURRENT_VERSION,
                    deprecated: !req.apiVersionIsCurrent
                };
            }
            return originalJson(data);
        };
        
        return routeHandler(req, res, next);
    };
};

/**
 * Setup API versioning
 */
export const setupApiVersioning = () => {
    logger.info('📋 Setting up API versioning', {
        supportedVersions: SUPPORTED_VERSIONS,
        defaultVersion: DEFAULT_VERSION,
        currentVersion: CURRENT_VERSION
    });
};

export default {
    extractApiVersion,
    apiVersionMiddleware,
    requireApiVersion,
    versionedRoute,
    setupApiVersioning,
    SUPPORTED_VERSIONS,
    DEFAULT_VERSION,
    CURRENT_VERSION
};
