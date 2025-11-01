import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// Services and utilities
import WebSocketServer from './services/WebSocketServer.js';
import DatabaseManager from './utils/database.js';
import logger from './utils/logger.js';
import config from './config/config.js';
import { initializePerformanceOptimizations } from './utils/performance.js';
import { setupSecurity } from './middleware/security.middleware.js';
import metricsCollector from './middleware/metrics.middleware.js';

// Error handling
import { 
  globalErrorHandler, 
  handleUnhandledRejection, 
  handleUncaughtException,
  AppError
} from './utils/errorHandler.js';

// Import routes
import authRouter from './routes/auth.routes.js';
import simulatorRouter from './routes/simulator.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import apiRouter from './routes/api/index.js';

// Setup global error handlers
handleUnhandledRejection();
handleUncaughtException();

// Create Express application
const app = express();

// Initialize performance optimizations (clustering, monitoring, etc.)
initializePerformanceOptimizations(app);

// Setup enhanced security
setupSecurity(app);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:9220'];
    
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    });
  }
});

// Apply rate limiting to API routes only
app.use('/api/', limiter);

// Performance middleware
app.use(compression());

// Metrics middleware
app.use(metricsCollector.requestMetricsMiddleware());

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

// Request ID middleware
app.use((req, res, next) => {
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.locals.requestId = req.id;
  res.set('X-Request-ID', req.id);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.id
    };
    
    if (req.user) {
      logData.userId = req.user.id;
    }
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request:', logData);
    } else {
      logger.info('HTTP Request:', logData);
    }
  });
  
  next();
});

// Static dashboard middleware
const __filename = fileURLToPath(import.meta.url);
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
    version: process.env.npm_package_version,
  });
});

// Prometheus metrics endpoint
app.get('/health/metrics', async (req, res) => {
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
app.get('/health/metrics/summary', async (req, res) => {
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
app.use('/api/auth', authRouter);
app.use('/api/simulator', simulatorRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api', apiRouter);

// Health check endpoint with detailed status
app.get('/health/detailed', async (req, res) => {
  try {
    const dbHealth = await DatabaseManager.healthCheck();
    const wsStats = global.wsServerInstance ? global.wsServerInstance.getStatistics() : { error: 'WebSocket not initialized' };
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      uptime: process.uptime(),
      environment: config.env,
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
const startServer = async () => {
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
    
    // Store wsServer globally for stats access
    global.wsServerInstance = wsServer;
    
    // Start HTTP server
    const server = httpServer.listen(config.port, config.host, () => {
      logger.info(`✅ Server running on http://${config.host}:${config.port}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`📊 Storage: ${config.storage.type.toUpperCase()} files`);
      logger.info('🎯 All systems operational!');
    });

    // Handle graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Stop accepting new connections
        server.close(async () => {
          logger.info('📡 HTTP server closed');
          
          // Shutdown WebSocket server
          await WebSocketServer.shutdown();
          
          // Close database connection
          await DatabaseManager.gracefulShutdown();
          
          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        });

        // Force shutdown after timeout
        setTimeout(() => {
          logger.error('❌ Forced shutdown after timeout');
          process.exit(1);
        }, 10000); // 10 second timeout
        
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle process termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Start monitoring (reduced frequency to avoid event loop lag)
    setInterval(async () => {
      try {
        const stats = await DatabaseManager.getStatistics();
        logger.debug('📈 Database Statistics:', stats);
        
        if (global.wsServerInstance && typeof global.wsServerInstance.getStatistics === 'function') {
          const wsStats = global.wsServerInstance.getStatistics();
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
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
