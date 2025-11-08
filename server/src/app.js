import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Services and utilities
import config from './config/config.js';
import { apiVersionMiddleware, setupApiVersioning } from './middleware/apiVersion.js';
import { createCorsOptions } from './middleware/cors.js';
import metricsCollector from './middleware/metrics.js';
import { setupRequestMiddleware } from './middleware/request.js';
import { setupSecurity } from './middleware/security.js';
import WebSocketServer from './services/WebSocketServer.js';
import DatabaseManager from './services/database.service.js';
import logger from './utils/logger.js';
import { initializePerformanceOptimizations } from './utils/performance.js';

// Error handling
import {
    AppError,
    globalErrorHandler,
    handleUncaughtException,
    handleUnhandledRejection
} from './utils/errorHandler.js';
import { initializeSentry } from './utils/sentry.js';

// Import routes
import apiRouter from './routes/api/index.js';
import dashboardRouter from './routes/dashboard.js';
import simulatorRouter from './routes/simulator.js';

// Import SimulationManager for graceful shutdown
import { simulationManager } from './controllers/simulator.controller.js';

// Swagger documentation (optional - requires swagger-jsdoc and swagger-ui-express)
let swaggerSetup = null;
try {
    const swaggerModule = await
    import ('./config/swagger.js');
    swaggerSetup = swaggerModule.default || swaggerModule.swaggerSetup;
} catch (error) {
    logger.warn('Swagger packages not installed. Install with: npm install swagger-jsdoc swagger-ui-express');
}

// Conditional auth import (only when authentication enabled)
let authRouter = null;

// Setup global error handlers
handleUnhandledRejection();
handleUncaughtException();

// Initialize Sentry error tracking (if configured)
initializeSentry();

// Create Express application
const app = express();

// Initialize performance optimizations (clustering, monitoring, etc.)
initializePerformanceOptimizations(app);

// Setup enhanced security
setupSecurity(app);

// Security Middleware - Relaxed CSP for development dashboard
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https:", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:", "https:"],
            fontSrc: ["'self'", "https:", "https://cdn.jsdelivr.net"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// CORS Configuration with enhanced validation
const corsOptions = createCorsOptions();
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
        res.status(429).json({
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
        });
    }
});

// Apply rate limiting to API routes only
app.use('/api/', limiter);

// Performance middleware
app.use(compression());

// Security middleware
// NoSQL injection prevention no longer needed with JSON storage

// Body parsing middleware
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (required for CSRF protection)
app.use(cookieParser());

// Setup request middleware (ID, timeout, logging, context)
setupRequestMiddleware(app);

// Metrics middleware (after request ID for tracking)
app.use(metricsCollector.requestMetricsMiddleware());

// Static dashboard middleware
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Dashboard redirect to index.html
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Static assets for dashboard
app.use('/dashboard', express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: config.version || '1.0.0',
    });
});

// Prometheus metrics endpoint
app.get('/health/metrics', async(req, res) => {
    try {
        res.set('Content-Type', metricsCollector.register.contentType);
        const metrics = await metricsCollector.getMetrics();
        res.end(metrics);
    } catch (error) {
        logger.error('Error serving metrics:', error);
        res.status(500).end('Error serving metrics');
    }
});

// Metrics summary endpoint for dashboard
app.get('/health/metrics/summary', async(req, res) => {
    try {
        const summary = await metricsCollector.getMetricsSummary();
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        logger.error('Error getting metrics summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get metrics summary'
        });
    }
});

// Mount API routes
// Setup API versioning
setupApiVersioning(app);

// Versioned API routes: /api/v1/*
app.use('/api/v1', apiVersionMiddleware, apiRouter);
app.use('/api/v1/simulator', apiVersionMiddleware, simulatorRouter);
app.use('/api/v1/dashboard', apiVersionMiddleware, dashboardRouter);

// Swagger documentation (optional - requires swagger-jsdoc and swagger-ui-express)
import ('./config/swagger.js').then(async(swaggerModule) => {
    const swaggerSetup = swaggerModule.swaggerSetup || swaggerModule.default;
    if (swaggerSetup) {
        await swaggerSetup(app);
        logger.info('📚 Swagger documentation available at /api/docs');
    }
}).catch((error) => {
    logger.warn('Swagger packages not installed. Install with: npm install swagger-jsdoc swagger-ui-express');
});

// Conditional auth routes (only when authentication enabled)
if (config.security.enableAuth) {
    logger.info('🔒 Authentication enabled - mounting auth routes');
    import ('./routes/auth.js').then(({ default: authRoutes }) => {
        app.use('/api/v1/auth', apiVersionMiddleware, authRoutes);
        logger.info('✅ Auth routes mounted');
    }).catch(err => {
        logger.error('❌ Failed to load auth routes:', err);
    });
} else {
    logger.info('🚫 Authentication disabled - skipping auth routes');
}

// Backward compatibility: /api/* routes default to v1
app.use('/api', apiVersionMiddleware, (req, res, next) => {
    // Set default version if not specified
    if (!req.apiVersion) {
        req.apiVersion = 'v1';
        req.apiVersionIsCurrent = true;
    }
    next();
});

app.use('/api/simulator', simulatorRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api', apiRouter);

// Health check endpoint with detailed status
app.get('/health/detailed', async(req, res) => {
    try {
        const dbHealth = await DatabaseManager.healthCheck();
        const wsServer = req.app.locals.wsServer;
        const wsStats = wsServer && typeof wsServer.getStatistics === 'function' ?
            wsServer.getStatistics() : { error: 'WebSocket not initialized' };

        // Get circuit breaker status
        const circuitBreakerManager = (await import('./utils/circuitBreaker.js')).default;
        const circuitBreakers = circuitBreakerManager.getAllBreakers();

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: config.version || '1.0.0',
            uptime: process.uptime(),
            environment: config.env,
            circuitBreakers: circuitBreakers,
            services: {
                database: dbHealth,
                websocket: wsStats,
                simulator: {
                    status: 'operational',
                    description: 'Station Simulator Ready'
                }
            },
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            }
        };

        // Check if any service is unhealthy
        if (dbHealth.status === 'unhealthy') {
            health.status = 'unhealthy';
            return res.status(503).json(health);
        }

        res.status(200).json(health);
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// 404 handler
app.use('*', (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
    next(error);
});

// Global error handler
app.use(globalErrorHandler);

// Create HTTP server for WebSocket integration
const httpServer = createServer(app);

// Start the server
const startServer = async() => {
    try {
        logger.info('🚀 Starting EV Charging Network Server...');

        // Connect to database with advanced features
        logger.info('📊 Connecting to database...');
        await DatabaseManager.connect();
        await DatabaseManager.createIndexes();

        // Initialize WebSocket server
        logger.info('🌐 Initializing WebSocket Server');
        const wsServer = new WebSocketServer();
        wsServer.initialize(httpServer);

        // Start dashboard periodic updates
        wsServer.startDashboardUpdates();

        // Store wsServer in app.locals for dependency injection (instead of global)
        app.locals.wsServer = wsServer;

        // Start HTTP server
        const server = httpServer.listen(config.port, config.host, () => {
            logger.info(`✅ Server running on http://${config.host}:${config.port}`);
            logger.info(`🌍 Environment: ${config.env}`);
            logger.info(`📊 Storage: ${config.storage.type.toUpperCase()} files`);
            logger.info('🎯 All systems operational!');
        });

        // Handle graceful shutdown
        const shutdown = async(signal) => {
            logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);

            try {
                // Stop accepting new connections
                server.close(async() => {
                    logger.info('📡 HTTP server closed');

                    // Shutdown Simulation Manager (stop all stations and OCPP connections)
                    try {
                        await simulationManager.shutdown();
                        logger.info('🎛️ Simulation Manager shut down');
                    } catch (error) {
                        logger.error('Error shutting down Simulation Manager:', error);
                    }

                    // Shutdown WebSocket server
                    const wsServer = app.locals.wsServer;
                    if (wsServer) {
                        try {
                            await wsServer.shutdown();
                            logger.info('🌐 WebSocket server shut down');
                        } catch (error) {
                            logger.error('Error shutting down WebSocket server:', error);
                        }
                    }

                    // Shutdown Cache Manager
                    try {
                        const cacheManagerModule = await
                        import ('./services/CacheManager.js');
                        const cacheManagerInstance = cacheManagerModule.default;
                        if (cacheManagerInstance?.shutdown) {
                            await cacheManagerInstance.shutdown();
                            logger.info('💾 Cache Manager shut down');
                        }
                    } catch (error) {
                        logger.error('Error shutting down Cache Manager:', error);
                    }

                    // Close database connection
                    await DatabaseManager.gracefulShutdown();
                    logger.info('📊 Database connection closed');

                    logger.info('✅ Graceful shutdown completed');
                    process.exit(0);
                });

                // Force shutdown after timeout
                setTimeout(() => {
                    logger.error('❌ Forced shutdown after timeout');
                    process.exit(1);
                }, 30000); // Increased to 30 seconds for graceful shutdown

            } catch (error) {
                logger.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        };

        // Handle process termination signals
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Start monitoring (reduced frequency to avoid event loop lag)
        setInterval(async() => {
            try {
                const stats = await DatabaseManager.getStatistics();
                logger.debug('📈 Database Statistics:', stats);

                const wsServer = app.locals.wsServer;
                if (wsServer && typeof wsServer.getStatistics === 'function') {
                    const wsStats = wsServer.getStatistics();
                    logger.debug('🌐 WebSocket Statistics:', wsStats);
                }
            } catch (error) {
                logger.error('Error getting periodic stats:', error);
            }
        }, 30000); // Changed from 5s to 30s to reduce load

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the application
startServer();

// Handle unhandled promise rejections
// Note: This is a fallback - handleUnhandledRejection() is already called at the top
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection (fallback handler):', err);
    process.exit(1);
});
