import logger from './logger.js';
import metricsCollector from '../middleware/metrics.js';

/**
 * Performance Optimizer
 * Monitors and optimizes application performance
 * 
 * Created: 2025-01-11
 * Purpose: Centralized performance monitoring and optimization
 */
class PerformanceOptimizer {
    constructor() {
        this.metrics = {
            requestCount: 0,
            slowRequests: [],
            memorySnapshots: [],
            cpuSnapshots: []
        };
        
        this.thresholds = {
            slowRequestThreshold: 1000, // ms
            memoryWarningThreshold: 512 * 1024 * 1024, // 512MB
            memoryCriticalThreshold: 1024 * 1024 * 1024, // 1GB
            cpuWarningThreshold: 80, // %
            maxSlowRequests: 100
        };

        this.startTime = Date.now();
        this.lastMemoryCheck = Date.now();
        this.lastCpuCheck = Date.now();
        
        this.setupMonitoring();
    }

    /**
     * Setup performance monitoring
     */
    setupMonitoring() {
        // Memory monitoring every 30 seconds
        setInterval(() => {
            this.checkMemory();
        }, 30000);

        // CPU monitoring every 60 seconds
        setInterval(() => {
            this.checkCPU();
        }, 60000);

        // Cleanup old snapshots every 5 minutes
        setInterval(() => {
            this.cleanupSnapshots();
        }, 5 * 60 * 1000);

        logger.info('📊 Performance Optimizer initialized');
    }

    /**
     * Check memory usage
     */
    checkMemory() {
        const usage = process.memoryUsage();
        const heapUsedMB = usage.heapUsed / 1024 / 1024;
        const heapTotalMB = usage.heapTotal / 1024 / 1024;
        const rssMB = usage.rss / 1024 / 1024;

        // Record snapshot
        this.metrics.memorySnapshots.push({
            timestamp: Date.now(),
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            rss: usage.rss,
            external: usage.external
        });

        // Keep only last 100 snapshots
        if (this.metrics.memorySnapshots.length > 100) {
            this.metrics.memorySnapshots.shift();
        }

        // Check thresholds
        if (usage.heapUsed > this.thresholds.memoryCriticalThreshold) {
            logger.error(`🚨 CRITICAL: Memory usage is ${heapUsedMB.toFixed(2)}MB (heap used)`);
            
            // Force GC if available
            if (global.gc) {
                logger.warn('🧹 Running garbage collection due to critical memory usage');
                global.gc();
            }

            // Record error metric
            metricsCollector.recordError('memory_critical', 'MEMORY_CRITICAL', 'critical');
        } else if (usage.heapUsed > this.thresholds.memoryWarningThreshold) {
            logger.warn(`⚠️ WARNING: Memory usage is ${heapUsedMB.toFixed(2)}MB (heap used)`);
            metricsCollector.recordError('memory_warning', 'MEMORY_WARNING', 'warning');
        }

        // Log memory usage every 5 minutes
        if (Date.now() - this.lastMemoryCheck > 5 * 60 * 1000) {
            logger.info(`📊 Memory: Heap ${heapUsedMB.toFixed(2)}MB / ${heapTotalMB.toFixed(2)}MB, RSS ${rssMB.toFixed(2)}MB`);
            this.lastMemoryCheck = Date.now();
        }
    }

    /**
     * Check CPU usage (simplified)
     */
    checkCPU() {
        const cpuUsage = process.cpuUsage();
        const userMicros = cpuUsage.user / 1000; // Convert to milliseconds
        const systemMicros = cpuUsage.system / 1000;

        // Record snapshot
        this.metrics.cpuSnapshots.push({
            timestamp: Date.now(),
            user: cpuUsage.user,
            system: cpuUsage.system
        });

        // Keep only last 50 snapshots
        if (this.metrics.cpuSnapshots.length > 50) {
            this.metrics.cpuSnapshots.shift();
        }

        // Log CPU usage every 5 minutes
        if (Date.now() - this.lastCpuCheck > 5 * 60 * 1000) {
            logger.info(`📊 CPU: User ${(userMicros / 1000).toFixed(2)}ms, System ${(systemMicros / 1000).toFixed(2)}ms`);
            this.lastCpuCheck = Date.now();
        }
    }

    /**
     * Record slow request
     */
    recordSlowRequest(route, duration, method) {
        this.metrics.slowRequests.push({
            timestamp: Date.now(),
            route,
            duration,
            method
        });

        // Keep only last N slow requests
        if (this.metrics.slowRequests.length > this.thresholds.maxSlowRequests) {
            this.metrics.slowRequests.shift();
        }

        logger.warn(`🐌 Slow request detected: ${method} ${route} took ${duration}ms`);
        metricsCollector.recordError('slow_request', 'SLOW_REQUEST', 'warning');
    }

    /**
     * Cleanup old snapshots
     */
    cleanupSnapshots() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes

        // Cleanup memory snapshots
        this.metrics.memorySnapshots = this.metrics.memorySnapshots.filter(
            snapshot => now - snapshot.timestamp < maxAge
        );

        // Cleanup CPU snapshots
        this.metrics.cpuSnapshots = this.metrics.cpuSnapshots.filter(
            snapshot => now - snapshot.timestamp < maxAge
        );

        // Cleanup slow requests
        this.metrics.slowRequests = this.metrics.slowRequests.filter(
            request => now - request.timestamp < maxAge
        );
    }

    /**
     * Get performance summary
     */
    getSummary() {
        const uptime = Date.now() - this.startTime;
        const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);

        const currentMemory = process.memoryUsage();
        const avgMemory = this.calculateAverageMemory();
        const avgCpu = this.calculateAverageCPU();

        return {
            uptime: {
                seconds: Math.floor(uptime / 1000),
                hours: parseFloat(uptimeHours)
            },
            memory: {
                current: {
                    heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(currentMemory.heapTotal / 1024 / 1024),
                    rss: Math.round(currentMemory.rss / 1024 / 1024)
                },
                average: avgMemory,
                snapshots: this.metrics.memorySnapshots.length
            },
            cpu: {
                current: process.cpuUsage(),
                average: avgCpu,
                snapshots: this.metrics.cpuSnapshots.length
            },
            requests: {
                total: this.metrics.requestCount,
                slow: this.metrics.slowRequests.length,
                slowRequests: this.metrics.slowRequests.slice(-10) // Last 10 slow requests
            },
            thresholds: this.thresholds
        };
    }

    /**
     * Calculate average memory usage
     */
    calculateAverageMemory() {
        if (this.metrics.memorySnapshots.length === 0) {
            return null;
        }

        const sum = this.metrics.memorySnapshots.reduce((acc, snapshot) => {
            acc.heapUsed += snapshot.heapUsed;
            acc.heapTotal += snapshot.heapTotal;
            acc.rss += snapshot.rss;
            return acc;
        }, { heapUsed: 0, heapTotal: 0, rss: 0 });

        const count = this.metrics.memorySnapshots.length;

        return {
            heapUsed: Math.round(sum.heapUsed / count / 1024 / 1024),
            heapTotal: Math.round(sum.heapTotal / count / 1024 / 1024),
            rss: Math.round(sum.rss / count / 1024 / 1024)
        };
    }

    /**
     * Calculate average CPU usage
     */
    calculateAverageCPU() {
        if (this.metrics.cpuSnapshots.length === 0) {
            return null;
        }

        const sum = this.metrics.cpuSnapshots.reduce((acc, snapshot) => {
            acc.user += snapshot.user;
            acc.system += snapshot.system;
            return acc;
        }, { user: 0, system: 0 });

        const count = this.metrics.cpuSnapshots.length;

        return {
            user: Math.round(sum.user / count / 1000), // microseconds to milliseconds
            system: Math.round(sum.system / count / 1000)
        };
    }

    /**
     * Reset metrics
     */
    reset() {
        this.metrics = {
            requestCount: 0,
            slowRequests: [],
            memorySnapshots: [],
            cpuSnapshots: []
        };
        this.startTime = Date.now();
        logger.info('📊 Performance metrics reset');
    }
}

// Export singleton instance
export default new PerformanceOptimizer();

