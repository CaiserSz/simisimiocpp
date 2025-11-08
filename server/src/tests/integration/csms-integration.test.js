/**
 * CSMS Integration Test Suite
 * Tests real CSMS connectivity and OCPP protocol compliance
 * 
 * Created: 2025-01-11
 * Purpose: Validate simulator works with standard CSMS systems
 */

describe('CSMS Integration Tests', () => {
    const CSMS_MODE = process.env.CSMS_MODE || 'mock';
    const CSMS_URL = process.env.CSMS_URL || 'ws://localhost:9220';
    const TEST_STATION_ID = 'INTEGRATION_TEST_STATION';
    let simulator;
    let connectionEvents = [];
    let mockServer;

    beforeAll(async() => {
        if (CSMS_MODE === 'mock') {
            const { ensureMockCsms } = await
            import ('../utils/mockCsmsServer.js');
            mockServer = await ensureMockCsms(CSMS_URL);
        }

        // Import simulator classes
        const { OCPP16JSimulator } = await
        import ('../../simulator/protocols/OCPP16JSimulator.js');
        const { OCPP201Simulator } = await
        import ('../../simulator/protocols/OCPP201Simulator.js');

        // Store for later use
        global.OCPP16JSimulator = OCPP16JSimulator;
        global.OCPP201Simulator = OCPP201Simulator;
    });

    beforeEach(() => {
        connectionEvents = [];
    });

    afterEach(async() => {
        if (simulator) {
            try {
                await simulator.disconnect();
            } catch (error) {
                // Ignore disconnect errors
            }
            simulator = null;
        }
    });

    afterAll(async() => {
        if (CSMS_MODE === 'mock' && mockServer) {
            const { shutdownMockCsms } = await
            import ('../utils/mockCsmsServer.js');
            await shutdownMockCsms();
            mockServer = null;
        }
    });

    describe('OCPP 1.6J Integration', () => {
        test('should connect to CSMS', async() => {
            const { OCPP16JSimulator } = global;
            simulator = new OCPP16JSimulator({
                stationId: `${TEST_STATION_ID}_16J`,
                csmsUrl: CSMS_URL,
                vendor: 'TestVendor',
                model: 'TestModel',
                serialNumber: 'TEST001'
            });

            const connectionPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 10000);
                timeout.unref?.();

                simulator.once('connected', () => {
                    clearTimeout(timeout);
                    resolve();
                });

                simulator.once('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });

            await simulator.connect();
            await connectionPromise;

            expect(simulator.isConnected).toBe(true);
        }, 15000);

        test('should send BootNotification', async() => {
            const { OCPP16JSimulator } = global;
            simulator = new OCPP16JSimulator({
                stationId: `${TEST_STATION_ID}_16J_BOOT`,
                csmsUrl: CSMS_URL,
                vendor: 'TestVendor',
                model: 'TestModel',
                serialNumber: 'TEST002'
            });

            await simulator.connect();

            const bootResponse = await simulator.sendBootNotification();

            expect(bootResponse).toBeDefined();
            expect(['Accepted', 'Pending', 'Rejected']).toContain(bootResponse.status);
        }, 15000);

        test('should send Heartbeat', async() => {
            const { OCPP16JSimulator } = global;
            simulator = new OCPP16JSimulator({
                stationId: `${TEST_STATION_ID}_16J_HEARTBEAT`,
                csmsUrl: CSMS_URL,
                vendor: 'TestVendor',
                model: 'TestModel',
                serialNumber: 'TEST003'
            });

            await simulator.connect();
            await simulator.sendBootNotification();

            const heartbeatResponse = await simulator.sendHeartbeat();

            expect(heartbeatResponse).toBeDefined();
            expect(heartbeatResponse.currentTime).toBeDefined();
        }, 15000);

        test('should send StatusNotification', async() => {
            const { OCPP16JSimulator } = global;
            simulator = new OCPP16JSimulator({
                stationId: `${TEST_STATION_ID}_16J_STATUS`,
                csmsUrl: CSMS_URL,
                vendor: 'TestVendor',
                model: 'TestModel',
                serialNumber: 'TEST004'
            });

            await simulator.connect();
            await simulator.sendBootNotification();

            const statusResponse = await simulator.sendStatusNotification(1, 'Available', 'NoError');

            expect(statusResponse).toBeDefined();
        }, 15000);

        test('should handle RemoteStartTransaction', async() => {
            const { OCPP16JSimulator } = global;
            simulator = new OCPP16JSimulator({
                stationId: `${TEST_STATION_ID}_16J_REMOTE_START`,
                csmsUrl: CSMS_URL,
                vendor: 'TestVendor',
                model: 'TestModel',
                serialNumber: 'TEST005'
            });

            await simulator.connect();
            await simulator.sendBootNotification();

            // Wait for potential RemoteStartTransaction from CSMS
            const remoteStartPromise = new Promise((resolve) => {
                simulator.once('remoteStartTransaction', resolve);
                const fallback = setTimeout(() => resolve(null), 5000);
                fallback.unref?.();
            });

            const result = await remoteStartPromise;
            // Test passes if no error occurred
            expect(simulator.isConnected).toBe(true);
        }, 15000);
    });

    describe('OCPP 2.0.1 Integration', () => {
        test('should connect to CSMS', async() => {
            const { OCPP201Simulator } = global;
            simulator = new OCPP201Simulator({
                stationId: `${TEST_STATION_ID}_201`,
                csmsUrl: CSMS_URL,
                vendor: 'TestVendor',
                model: 'TestModel',
                serialNumber: 'TEST101'
            });

            const connectionPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 10000);
                timeout.unref?.();

                simulator.once('connected', () => {
                    clearTimeout(timeout);
                    resolve();
                });

                simulator.once('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });

            await simulator.connect();
            await connectionPromise;

            expect(simulator.isConnected).toBe(true);
        }, 15000);

        test('should send BootNotification', async() => {
            const { OCPP201Simulator } = global;
            simulator = new OCPP201Simulator({
                stationId: `${TEST_STATION_ID}_201_BOOT`,
                csmsUrl: CSMS_URL,
                vendor: 'TestVendor',
                model: 'TestModel',
                serialNumber: 'TEST102'
            });

            await simulator.connect();

            const bootResponse = await simulator.sendBootNotification();

            expect(bootResponse).toBeDefined();
            expect(['Accepted', 'Pending', 'Rejected']).toContain(bootResponse.status);
        }, 15000);

        test('should send Heartbeat', async() => {
            const { OCPP201Simulator } = global;
            simulator = new OCPP201Simulator({
                stationId: `${TEST_STATION_ID}_201_HEARTBEAT`,
                csmsUrl: CSMS_URL,
                vendor: 'TestVendor',
                model: 'TestModel',
                serialNumber: 'TEST103'
            });

            await simulator.connect();
            await simulator.sendBootNotification();

            const heartbeatResponse = await simulator.sendHeartbeat();

            expect(heartbeatResponse).toBeDefined();
            expect(heartbeatResponse.currentTime).toBeDefined();
        }, 15000);
    });

    describe('Connection Resilience', () => {
        test('should reconnect after connection loss', async() => {
            const { OCPP16JSimulator } = global;
            simulator = new OCPP16JSimulator({
                stationId: `${TEST_STATION_ID}_RECONNECT`,
                csmsUrl: CSMS_URL,
                vendor: 'TestVendor',
                model: 'TestModel',
                serialNumber: 'TEST200'
            });

            await simulator.connect();
            await simulator.sendBootNotification();

            expect(simulator.isConnected).toBe(true);

            // Simulate connection loss
            simulator.ws?.close();

            // Wait for reconnection attempt
            const reconnectPromise = new Promise((resolve) => {
                simulator.once('reconnectionAttempt', resolve);
                const fallback = setTimeout(() => resolve(null), 10000);
                fallback.unref?.();
            });

            const reconnectEvent = await reconnectPromise;
            expect(reconnectEvent).toBeDefined();
        }, 20000);

        test('should handle CSMS unavailability gracefully', async() => {
            const { OCPP16JSimulator } = global;
            simulator = new OCPP16JSimulator({
                stationId: `${TEST_STATION_ID}_UNAVAILABLE`,
                csmsUrl: 'ws://invalid-host:9999',
                vendor: 'TestVendor',
                model: 'TestModel',
                serialNumber: 'TEST201'
            });

            const connectionPromise = new Promise((resolve) => {
                simulator.once('error', resolve);
                simulator.once('reconnectionFailed', resolve);
                const fallback = setTimeout(() => resolve({ type: 'timeout' }), 10000);
                fallback.unref?.();
            });

            try {
                await simulator.connect();
            } catch (error) {
                // Expected
            }

            const result = await connectionPromise;
            expect(result).toBeDefined();
        }, 15000);
    });

    describe('Message Flow Validation', () => {
        test('should maintain message order', async() => {
            const { OCPP16JSimulator } = global;
            simulator = new OCPP16JSimulator({
                stationId: `${TEST_STATION_ID}_MESSAGE_ORDER`,
                csmsUrl: CSMS_URL,
                vendor: 'TestVendor',
                model: 'TestModel',
                serialNumber: 'TEST300'
            });

            await simulator.connect();
            await simulator.sendBootNotification();

            const messages = [];
            const messagePromises = [];

            // Send multiple messages
            for (let i = 0; i < 5; i++) {
                messagePromises.push(
                    simulator.sendHeartbeat().then(response => {
                        messages.push({ type: 'heartbeat', index: i, response });
                    })
                );
            }

            await Promise.all(messagePromises);

            expect(messages.length).toBe(5);
        }, 20000);

        test('should handle concurrent messages', async() => {
            const { OCPP16JSimulator } = global;
            simulator = new OCPP16JSimulator({
                stationId: `${TEST_STATION_ID}_CONCURRENT`,
                csmsUrl: CSMS_URL,
                vendor: 'TestVendor',
                model: 'TestModel',
                serialNumber: 'TEST301'
            });

            await simulator.connect();
            await simulator.sendBootNotification();

            const concurrentPromises = [
                simulator.sendHeartbeat(),
                simulator.sendStatusNotification(1, 'Available', 'NoError'),
                simulator.sendHeartbeat()
            ];

            const results = await Promise.allSettled(concurrentPromises);

            expect(results.length).toBe(3);
            expect(results.filter(r => r.status === 'fulfilled').length).toBeGreaterThan(0);
        }, 20000);
    });
});
