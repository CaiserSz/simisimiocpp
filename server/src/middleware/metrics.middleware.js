import prometheus from 'prom-client';
import logger from '../utils/logger.js';

/**
 * Production Monitoring & Metrics Collection
 */
class MetricsCollector {
  constructor() {
    // Create a Registry
    this.register = new prometheus.Registry();
    
    // Add default metrics
    prometheus.collectDefaultMetrics({ 
      register: this.register,
      timeout: 5000,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });
    
    this.initializeCustomMetrics();
  }

  /**
   * Initialize custom application metrics
   */
  initializeCustomMetrics() {
    // HTTP Request Duration Histogram
    this.httpRequestDuration = new prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    });

    // HTTP Request Counter
    this.httpRequestTotal = new prometheus.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    // Active WebSocket Connections
    this.wsConnectionsGauge = new prometheus.Gauge({
      name: 'websocket_connections_active',
      help: 'Number of active WebSocket connections',
      labelNames: ['type']
    });

    // OCPP Stations
    this.ocppStationsGauge = new prometheus.Gauge({
      name: 'ocpp_stations_total',
      help: 'Number of OCPP stations by status',
      labelNames: ['status']
    });

    // OCPP Messages
    this.ocppMessagesCounter = new prometheus.Counter({
      name: 'ocpp_messages_total',
      help: 'Total OCPP messages processed',
      labelNames: ['message_type', 'status', 'protocol_version']
    });

    // Database Operations
    this.dbOperationDuration = new prometheus.Histogram({
      name: 'database_operation_duration_seconds',
      help: 'Duration of database operations',
      labelNames: ['operation', 'collection', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
    });

    this.dbOperationCounter = new prometheus.Counter({
      name: 'database_operations_total',
      help: 'Total database operations',
      labelNames: ['operation', 'collection', 'status']
    });

    // Authentication Metrics
    this.authAttemptsCounter = new prometheus.Counter({
      name: 'auth_attempts_total',
      help: 'Total authentication attempts',
      labelNames: ['type', 'status'] // type: login, register, reset; status: success, failure
    });

    // Error Metrics
    this.errorCounter = new prometheus.Counter({
      name: 'application_errors_total',
      help: 'Total application errors',
      labelNames: ['error_type', 'error_code', 'severity']
    });

    // Business Metrics
    this.chargingSessionsGauge = new prometheus.Gauge({
      name: 'charging_sessions_active',
      help: 'Number of active charging sessions'
    });

    this.chargingSessionDuration = new prometheus.Histogram({
      name: 'charging_session_duration_seconds',
      help: 'Duration of charging sessions',
      buckets: [60, 300, 600, 1800, 3600, 7200, 14400, 28800] // 1min to 8hrs
    });

    this.energyDelivered = new prometheus.Counter({
      name: 'energy_delivered_kwh_total',
      help: 'Total energy delivered in kWh'
    });

    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.wsConnectionsGauge);
    this.register.registerMetric(this.ocppStationsGauge);
    this.register.registerMetric(this.ocppMessagesCounter);
    this.register.registerMetric(this.dbOperationDuration);
    this.register.registerMetric(this.dbOperationCounter);
    this.register.registerMetric(this.authAttemptsCounter);
    this.register.registerMetric(this.errorCounter);
    this.register.registerMetric(this.chargingSessionsGauge);
    this.register.registerMetric(this.chargingSessionDuration);
    this.register.registerMetric(this.energyDelivered);

    logger.info('📊 Metrics collector initialized');
  }

  /**
   * Middleware for HTTP request metrics
   */
  requestMetricsMiddleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Extract route pattern
      const route = this.getRoutePattern(req);
      
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const labels = {
          method: req.method,
          route: route,
          status_code: res.statusCode
        };

        // Record metrics
        this.httpRequestDuration.observe(labels, duration);
        this.httpRequestTotal.inc(labels);
      });

      next();
    };
  }

  /**
   * Get route pattern from request
   */
  getRoutePattern(req) {
    if (req.route && req.route.path) {
      return req.baseUrl + req.route.path;
    }
    
    // Fallback to pathname with parameters replaced
    let path = req.path || req.url;
    
    // Replace common ID patterns
    path = path.replace(/\/[0-9a-fA-F]{24}/g, '/:id'); // MongoDB ObjectId
    path = path.replace(/\/\d+/g, '/:id'); // Numeric IDs
    path = path.replace(/\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '/:uuid'); // UUIDs
    
    return path;
  }

  /**
   * Record WebSocket connection metrics
   */
  recordWSConnection(type, delta = 1) {
    this.wsConnectionsGauge.inc({ type }, delta);
  }

  /**
   * Record OCPP station metrics
   */
  recordOCPPStation(status, count = 1) {
    this.ocppStationsGauge.set({ status }, count);
  }

  /**
   * Record OCPP message metrics
   */
  recordOCPPMessage(messageType, status, protocolVersion) {
    this.ocppMessagesCounter.inc({
      message_type: messageType,
      status: status,
      protocol_version: protocolVersion
    });
  }

  /**
   * Record database operation metrics
   */
  recordDBOperation(operation, collection, duration, status = 'success') {
    const labels = { operation, collection, status };
    
    this.dbOperationDuration.observe(labels, duration / 1000); // Convert to seconds
    this.dbOperationCounter.inc(labels);
  }

  /**
   * Record authentication attempt
   */
  recordAuthAttempt(type, status) {
    this.authAttemptsCounter.inc({ type, status });
  }

  /**
   * Record application error
   */
  recordError(errorType, errorCode, severity = 'medium') {
    this.errorCounter.inc({
      error_type: errorType,
      error_code: errorCode,
      severity: severity
    });
  }

  /**
   * Record charging session metrics
   */
  recordChargingSession(action, duration = null, energy = null) {
    switch (action) {
      case 'start':
        this.chargingSessionsGauge.inc();
        break;
      case 'stop':
        this.chargingSessionsGauge.dec();
        if (duration !== null) {
          this.chargingSessionDuration.observe(duration);
        }
        if (energy !== null) {
          this.energyDelivered.inc(energy);
        }
        break;
    }
  }

  /**
   * Update station status metrics
   */
  updateStationMetrics(stations) {
    const statusCounts = stations.reduce((acc, station) => {
      acc[station.status] = (acc[station.status] || 0) + 1;
      return acc;
    }, {});

    // Reset all gauges
    const statuses = ['connected', 'disconnected', 'charging', 'available', 'error'];
    statuses.forEach(status => {
      this.ocppStationsGauge.set({ status }, statusCounts[status] || 0);
    });
  }

  /**
   * Get metrics for Prometheus scraping
   */
  async getMetrics() {
    try {
      return await this.register.metrics();
    } catch (error) {
      logger.error('Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Get metrics summary for dashboard
   */
  async getMetricsSummary() {
    try {
      const metrics = await this.register.getMetricsAsJSON();
      
      const summary = {
        timestamp: new Date().toISOString(),
        http: {
          requestsTotal: this.getMetricValue(metrics, 'http_requests_total'),
          avgResponseTime: this.getMetricValue(metrics, 'http_request_duration_seconds', 'mean')
        },
        websocket: {
          activeConnections: this.getMetricValue(metrics, 'websocket_connections_active')
        },
        ocpp: {
          totalStations: this.getMetricValue(metrics, 'ocpp_stations_total'),
          messagesProcessed: this.getMetricValue(metrics, 'ocpp_messages_total')
        },
        database: {
          operationsTotal: this.getMetricValue(metrics, 'database_operations_total'),
          avgOperationTime: this.getMetricValue(metrics, 'database_operation_duration_seconds', 'mean')
        },
        business: {
          activeChargingSessions: this.getMetricValue(metrics, 'charging_sessions_active'),
          totalEnergyDelivered: this.getMetricValue(metrics, 'energy_delivered_kwh_total')
        },
        errors: {
          totalErrors: this.getMetricValue(metrics, 'application_errors_total')
        }
      };

      return summary;
    } catch (error) {
      logger.error('Error getting metrics summary:', error);
      throw error;
    }
  }

  /**
   * Extract metric value from metrics JSON
   */
  getMetricValue(metrics, metricName, aggregation = 'sum') {
    const metric = metrics.find(m => m.name === metricName);
    if (!metric) return 0;

    if (metric.type === 'counter' || metric.type === 'gauge') {
      return metric.values.reduce((sum, v) => sum + v.value, 0);
    }

    if (metric.type === 'histogram' && aggregation === 'mean') {
      const sumValue = metric.values.find(v => v.metricName === `${metricName}_sum`);
      const countValue = metric.values.find(v => v.metricName === `${metricName}_count`);
      
      if (sumValue && countValue && countValue.value > 0) {
        return sumValue.value / countValue.value;
      }
    }

    return 0;
  }

  /**
   * Health check for metrics system
   */
  healthCheck() {
    return {
      status: 'healthy',
      metricsCount: this.register._metrics.size,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export default new MetricsCollector();
