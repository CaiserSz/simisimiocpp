import { EventEmitter } from 'events';
import { performance } from 'node:perf_hooks';
import logger from '../utils/logger.js';

/**
 * Network Simulation Utility
 * Simulates realistic network conditions: latency, packet loss, disconnection
 */
export class NetworkSimulator extends EventEmitter {
    constructor(config = {}) {
        super();

        this.config = {
            latency: config.latency || { min: 10, max: 50 }, // ms
            packetLoss: config.packetLoss || 0.001, // 0.1%
            disconnectionRate: config.disconnectionRate || 0.0001, // 0.01%
            enabled: config.enabled !== false
        };

        this.isConnected = true;
        this.lastDisconnection = null;
        this.lastDisconnectionTime = null;
        this.disconnectionCheckInterval = null;
        this.reconnectTimeout = null;

        // Statistics
        this.stats = {
            totalPackets: 0,
            lostPackets: 0,
            totalLatency: 0,
            disconnections: 0,
            reconnections: 0
        };

        if (this.config.enabled) {
            this.startDisconnectionSimulation();
        }
    }

    /**
     * Simulate network latency
     */
    async simulateLatency(operation) {
        if (!this.config.enabled || !this.isConnected) {
            return operation();
        }

        const latency = this.config.latency.min +
            Math.random() * (this.config.latency.max - this.config.latency.min);

        this.stats.totalLatency += latency;

        await new Promise(resolve => setTimeout(resolve, latency));

        return operation();
    }

    /**
     * Simulate packet loss
     */
    shouldDropPacket() {
        if (!this.config.enabled || !this.isConnected) {
            return false;
        }

        this.stats.totalPackets++;

        if (Math.random() < this.config.packetLoss) {
            this.stats.lostPackets++;
            logger.debug(`📦 Packet dropped (simulated packet loss)`);
            return true;
        }

        return false;
    }

    /**
     * Wrap message sending with network simulation
     */
    async sendMessage(message, sendFunction) {
        // Check if packet should be dropped
        if (this.shouldDropPacket()) {
            throw new Error('Packet dropped (simulated packet loss)');
        }

        // Simulate latency
        return await this.simulateLatency(async() => {
            return await sendFunction(message);
        });
    }

    /**
     * Start disconnection simulation
     */
    startDisconnectionSimulation() {
        if (this.disconnectionCheckInterval) {
            return;
        }

        // Check for disconnection every 5 seconds
        this.disconnectionCheckInterval = setInterval(() => {
            if (this.isConnected && Math.random() < this.config.disconnectionRate * 300) {
                // Simulate disconnection
                this.simulateDisconnection();
            }
        }, 5000);

        // Avoid keeping the event loop alive solely because of the interval during tests
        this.disconnectionCheckInterval.unref?.();
    }

    /**
     * Simulate network disconnection
     */
    simulateDisconnection() {
        if (!this.isConnected) {
            return;
        }

        this.isConnected = false;
        this.lastDisconnection = new Date();
        this.lastDisconnectionTime = performance.now();
        this.stats.disconnections++;

        logger.warn(`🔌 Network disconnection simulated`);
        this.emit('disconnected', { timestamp: this.lastDisconnection });

        // Auto-reconnect after random delay (5-30 seconds)
        const reconnectDelay = 5000 + Math.random() * 25000;

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.simulateReconnection();
        }, reconnectDelay);
        this.reconnectTimeout.unref?.();
    }

    /**
     * Simulate network reconnection
     */
    simulateReconnection() {
        if (this.isConnected) {
            return;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.isConnected = true;
        this.stats.reconnections++;

        const nowTimestamp = performance.now();
        const downtimeSeconds = (() => {
            if (this.lastDisconnectionTime !== null) {
                return Math.max((nowTimestamp - this.lastDisconnectionTime) / 1000, 0.001);
            }

            if (this.lastDisconnection) {
                return Math.max((Date.now() - this.lastDisconnection.getTime()) / 1000, 0.001);
            }

            return 0;
        })();

        logger.info(`🔌 Network reconnected after ${downtimeSeconds.toFixed(1)}s`);
        this.emit('reconnected', {
            timestamp: new Date(),
            downtime: downtimeSeconds
        });

        this.lastDisconnectionTime = null;
    }

    /**
     * Force disconnection (for testing)
     */
    forceDisconnect() {
        this.simulateDisconnection();
    }

    /**
     * Force reconnection (for testing)
     */
    forceReconnect() {
        this.simulateReconnection();
    }

    /**
     * Get network statistics
     */
    getStats() {
        const packetLossRate = this.stats.totalPackets > 0 ?
            (this.stats.lostPackets / this.stats.totalPackets * 100).toFixed(2) : 0;

        const avgLatency = this.stats.totalPackets > 0 ?
            (this.stats.totalLatency / this.stats.totalPackets).toFixed(2) : 0;

        return {
            enabled: this.config.enabled,
            isConnected: this.isConnected,
            packetLoss: `${packetLossRate}%`,
            averageLatency: `${avgLatency}ms`,
            disconnections: this.stats.disconnections,
            reconnections: this.stats.reconnections,
            totalPackets: this.stats.totalPackets,
            lostPackets: this.stats.lostPackets,
            lastDisconnection: this.lastDisconnection
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };
    }

    /**
     * Stop simulation
     */
    stop() {
        if (this.disconnectionCheckInterval) {
            clearInterval(this.disconnectionCheckInterval);
            this.disconnectionCheckInterval = null;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
}

export default NetworkSimulator;
