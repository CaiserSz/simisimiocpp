/**
 * Distributed Tracing Utilities
 * Lightweight tracing implementation for request tracking
 * 
 * Created: 2025-01-11
 * Purpose: Request tracing and correlation IDs
 */

import { v4 as uuidv4 } from 'uuid';
import logger from './logger.js';

/**
 * Trace Context
 * Stores trace information for request correlation
 */
class TraceContext {
    constructor(traceId = null, spanId = null, parentSpanId = null) {
        this.traceId = traceId || uuidv4();
        this.spanId = spanId || uuidv4();
        this.parentSpanId = parentSpanId || null;
        this.startTime = Date.now();
        this.tags = {};
        this.baggage = {};
    }

    /**
     * Create child span
     */
    createChildSpan(operationName) {
        return new TraceContext(this.traceId, uuidv4(), this.spanId);
    }

    /**
     * Add tag
     */
    setTag(key, value) {
        this.tags[key] = value;
        return this;
    }

    /**
     * Add baggage
     */
    setBaggage(key, value) {
        this.baggage[key] = value;
        return this;
    }

    /**
     * Finish span
     */
    finish() {
        const duration = Date.now() - this.startTime;
        return {
            traceId: this.traceId,
            spanId: this.spanId,
            parentSpanId: this.parentSpanId,
            duration,
            tags: this.tags,
            baggage: this.baggage
        };
    }
}

/**
 * Tracer
 * Main tracing interface
 */
class Tracer {
    constructor() {
        this.activeSpans = new Map();
        this.traces = [];
        this.maxTraces = 1000; // Keep last 1000 traces
    }

    /**
     * Start a new trace
     */
    startTrace(operationName, traceId = null) {
        const context = new TraceContext(traceId);
        context.setTag('operation', operationName);
        this.activeSpans.set(context.spanId, context);
        return context;
    }

    /**
     * Start a child span
     */
    startSpan(operationName, parentContext) {
        if (!parentContext) {
            return this.startTrace(operationName);
        }
        const context = parentContext.createChildSpan(operationName);
        context.setTag('operation', operationName);
        this.activeSpans.set(context.spanId, context);
        return context;
    }

    /**
     * Finish a span
     */
    finishSpan(context) {
        if (!context) {
            return;
        }

        const span = context.finish();
        this.activeSpans.delete(context.spanId);
        
        // Store trace
        this.traces.push({
            ...span,
            timestamp: new Date().toISOString()
        });

        // Keep only last N traces
        if (this.traces.length > this.maxTraces) {
            this.traces.shift();
        }

        // Log if slow operation
        if (span.duration > 1000) {
            logger.debug('🐌 Slow operation detected', {
                traceId: span.traceId,
                spanId: span.spanId,
                operation: span.tags.operation,
                duration: `${span.duration}ms`
            });
        }

        return span;
    }

    /**
     * Get trace by ID
     */
    getTrace(traceId) {
        return this.traces.filter(t => t.traceId === traceId);
    }

    /**
     * Get all traces
     */
    getAllTraces() {
        return this.traces;
    }

    /**
     * Clear traces
     */
    clearTraces() {
        this.traces = [];
        this.activeSpans.clear();
    }

    /**
     * Get trace summary
     */
    getSummary() {
        const totalTraces = this.traces.length;
        const activeSpans = this.activeSpans.size;
        
        if (totalTraces === 0) {
            return {
                totalTraces: 0,
                activeSpans,
                averageDuration: 0,
                slowOperations: []
            };
        }

        const durations = this.traces.map(t => t.duration);
        const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        
        const slowOperations = this.traces
            .filter(t => t.duration > 1000)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10)
            .map(t => ({
                traceId: t.traceId,
                operation: t.tags.operation,
                duration: t.duration
            }));

        return {
            totalTraces,
            activeSpans,
            averageDuration: Math.round(averageDuration),
            slowOperations
        };
    }
}

// Export singleton instance
export const tracer = new Tracer();

/**
 * Trace decorator for async functions
 */
export function trace(operationName) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function(...args) {
            const context = tracer.startTrace(`${target.constructor.name}.${operationName}`);
            try {
                const result = await originalMethod.apply(this, args);
                tracer.finishSpan(context);
                return result;
            } catch (error) {
                context.setTag('error', true);
                context.setTag('error.message', error.message);
                tracer.finishSpan(context);
                throw error;
            }
        };

        return descriptor;
    };
}

/**
 * Trace middleware for Express
 */
export function traceMiddleware(req, res, next) {
    const traceId = req.headers['x-trace-id'] || uuidv4();
    const context = tracer.startTrace(`${req.method} ${req.path}`, traceId);
    
    context.setTag('http.method', req.method);
    context.setTag('http.path', req.path);
    context.setTag('http.url', req.originalUrl);
    context.setTag('http.ip', req.ip);
    
    // Add trace ID to response
    res.set('X-Trace-ID', context.traceId);
    res.set('X-Span-ID', context.spanId);
    
    // Store context in request
    req.traceContext = context;
    
    // Finish trace on response
    res.on('finish', () => {
        context.setTag('http.status_code', res.statusCode);
        tracer.finishSpan(context);
    });
    
    next();
}

export default tracer;

