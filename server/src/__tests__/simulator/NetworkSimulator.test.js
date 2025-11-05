import { jest } from '@jest/globals';
import NetworkSimulator from '../../simulator/NetworkSimulator.js';

describe('NetworkSimulator', () => {
    let networkSimulator;

    beforeEach(() => {
        networkSimulator = new NetworkSimulator({
            latency: { min: 10, max: 50 },
            packetLoss: 0.001,
            disconnectionRate: 0.0001,
            enabled: true
        });
    });

    afterEach(() => {
        if (networkSimulator) {
            networkSimulator.stop();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default config', () => {
            const simulator = new NetworkSimulator();
            expect(simulator.config.enabled).toBe(true);
            expect(simulator.isConnected).toBe(true);
        });

        test('should initialize with custom config', () => {
            const config = {
                latency: { min: 20, max: 100 },
                packetLoss: 0.01,
                disconnectionRate: 0.001,
                enabled: true
            };
            const simulator = new NetworkSimulator(config);
            expect(simulator.config.latency.min).toBe(20);
            expect(simulator.config.packetLoss).toBe(0.01);
        });

        test('should initialize with disabled state', () => {
            const simulator = new NetworkSimulator({ enabled: false });
            expect(simulator.config.enabled).toBe(false);
        });
    });

    describe('Latency Simulation', () => {
        test('should simulate latency within range', async() => {
            const startTime = Date.now();
            await networkSimulator.simulateLatency(async() => {
                return 'test';
            });
            const duration = Date.now() - startTime;

            expect(duration).toBeGreaterThanOrEqual(10);
            expect(duration).toBeLessThan(100); // Allow some overhead
        });

        test('should not simulate latency when disabled', async() => {
            networkSimulator.config.enabled = false;
            const startTime = Date.now();
            await networkSimulator.simulateLatency(async() => {
                return 'test';
            });
            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(50); // Should be almost instant
        });

        test('should return operation result', async() => {
            const result = await networkSimulator.simulateLatency(async() => {
                return 'test_result';
            });
            expect(result).toBe('test_result');
        });
    });

    describe('Packet Loss Simulation', () => {
        test('should track packet statistics', () => {
            for (let i = 0; i < 100; i++) {
                networkSimulator.shouldDropPacket();
            }
            expect(networkSimulator.stats.totalPackets).toBeGreaterThan(0);
        });

        test('should not drop packets when disabled', () => {
            networkSimulator.config.enabled = false;
            const shouldDrop = networkSimulator.shouldDropPacket();
            expect(shouldDrop).toBe(false);
        });

        test('should not drop packets when disconnected', () => {
            networkSimulator.isConnected = false;
            const shouldDrop = networkSimulator.shouldDropPacket();
            expect(shouldDrop).toBe(false);
        });
    });

    describe('Message Sending', () => {
        test('should wrap message sending with network simulation', async() => {
            const sendFunction = jest.fn().mockResolvedValue('success');
            const result = await networkSimulator.sendMessage('test', sendFunction);

            expect(sendFunction).toHaveBeenCalledWith('test');
            expect(result).toBe('success');
        });
    });

    describe('Disconnection Simulation', () => {
        test('should simulate disconnection', (done) => {
            networkSimulator.once('disconnected', () => {
                expect(networkSimulator.isConnected).toBe(false);
                expect(networkSimulator.stats.disconnections).toBeGreaterThan(0);
                done();
            });

            networkSimulator.simulateDisconnection();
        });

        test('should simulate reconnection', (done) => {
            networkSimulator.simulateDisconnection();

            networkSimulator.once('reconnected', (data) => {
                expect(networkSimulator.isConnected).toBe(true);
                expect(networkSimulator.stats.reconnections).toBeGreaterThan(0);
                expect(data.downtime).toBeGreaterThan(0);
                done();
            });

            networkSimulator.simulateReconnection();
        });
    });

    describe('Force Operations', () => {
        test('should force disconnect', () => {
            expect(networkSimulator.isConnected).toBe(true);
            networkSimulator.forceDisconnect();
            expect(networkSimulator.isConnected).toBe(false);
        });

        test('should force reconnect', () => {
            networkSimulator.forceDisconnect();
            expect(networkSimulator.isConnected).toBe(false);
            networkSimulator.forceReconnect();
            expect(networkSimulator.isConnected).toBe(true);
        });
    });

    describe('Statistics', () => {
        test('should get network statistics', () => {
            // Generate some activity
            for (let i = 0; i < 100; i++) {
                networkSimulator.shouldDropPacket();
            }

            const stats = networkSimulator.getStats();

            expect(stats).toHaveProperty('enabled');
            expect(stats).toHaveProperty('isConnected');
            expect(stats).toHaveProperty('packetLoss');
            expect(stats).toHaveProperty('averageLatency');
            expect(stats).toHaveProperty('disconnections');
            expect(stats).toHaveProperty('reconnections');
            expect(stats).toHaveProperty('totalPackets');
            expect(stats.totalPackets).toBeGreaterThan(0);
        });
    });

    describe('Configuration Updates', () => {
        test('should update configuration', () => {
            networkSimulator.updateConfig({
                latency: { min: 50, max: 100 },
                packetLoss: 0.01
            });

            expect(networkSimulator.config.latency.min).toBe(50);
            expect(networkSimulator.config.latency.max).toBe(100);
            expect(networkSimulator.config.packetLoss).toBe(0.01);
        });
    });

    describe('Cleanup', () => {
        test('should stop simulation and cleanup intervals', () => {
            networkSimulator.stop();
            expect(networkSimulator.disconnectionCheckInterval).toBeNull();
        });
    });
});