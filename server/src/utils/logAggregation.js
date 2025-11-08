/**
 * Log Aggregation Utilities
 * Structured logging and log aggregation helpers
 * 
 * Created: 2025-01-11
 * Purpose: Centralized log aggregation and structured logging
 */

import logger from './logger.js';
import tracer from './tracing.js';

/**
 * Log Aggregator
 * Aggregates and structures logs for external systems (ELK, Splunk, etc.)
 */
class LogAggregator {
    constructor() {
        this.logBuffer = [];
        this.maxBufferSize = 1000;
        this.flushInterval = 60000; // 1 minute
        this.setupAutoFlush();
    }

    /**
     * Setup automatic buffer flush
     */
    setupAutoFlush() {
        setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }

    /**
     * Log with structured format
     */
    log(level, message, context = {}) {
        const traceContext = tracer.activeSpans.size > 0 ? 
            Array.from(tracer.activeSpans.values())[0] : null;

        const structuredLog = {
            timestamp: new Date().toISOString(),
            level,
            message,
            service: 'ocpp-simulator',
            environment: process.env.NODE_ENV || 'development',
            ...(traceContext && {
                traceId: traceContext.traceId,
                spanId: traceContext.spanId
            }),
            ...context
        };

        // Add to buffer
        this.logBuffer.push(structuredLog);

        // Flush if buffer is full
        if (this.logBuffer.length >= this.maxBufferSize) {
            this.flush();
        }

        // Also log via winston
        logger.log(level, message, structuredLog);

        return structuredLog;
    }

    /**
     * Flush buffer (send to external system)
     */
    flush() {
        if (this.logBuffer.length === 0) {
            return;
        }

        // In production, this would send to ELK, Splunk, etc.
        // For now, we just log the buffer size
        logger.debug(`📊 Log buffer flushed: ${this.logBuffer.length} entries`);

        // Clear buffer
        this.logBuffer = [];
    }

    /**
     * Get aggregated logs
     */
    getAggregatedLogs(filters = {}) {
        let logs = [...this.logBuffer];

        // Apply filters
        if (filters.level) {
            logs = logs.filter(log => log.level === filters.level);
        }
        if (filters.traceId) {
            logs = logs.filter(log => log.traceId === filters.traceId);
        }
        if (filters.startTime) {
            logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startTime));
        }
        if (filters.endTime) {
            logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endTime));
        }

        return logs;
    }

    /**
     * Get log statistics
     */
    getStatistics() {
        const levels = {};
        const traceIds = new Set();

        this.logBuffer.forEach(log => {
            levels[log.level] = (levels[log.level] || 0) + 1;
            if (log.traceId) {
                traceIds.add(log.traceId);
            }
        });

        return {
            totalLogs: this.logBuffer.length,
            levels,
            uniqueTraces: traceIds.size,
            bufferSize: this.maxBufferSize
        };
    }
}

// Export singleton instance
export const logAggregator = new LogAggregator();

/**
 * Enhanced logger with aggregation
 */
export const aggregatedLogger = {
    error: (message, context) => logAggregator.log('error', message, context),
    warn: (message, context) => logAggregator.log('warn', message, context),
    info: (message, context) => logAggregator.log('info', message, context),
    debug: (message, context) => logAggregator.log('debug', message, context),
    verbose: (message, context) => logAggregator.log('verbose', message, context)
};

export default logAggregator;

