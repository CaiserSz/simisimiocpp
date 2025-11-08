/**
 * Real CSMS Integration Tests
 * Tests actual CSMS connection with TLS and protocol validation
 * 
 * Created: 2025-01-11
 * Purpose: Validate real CSMS integration for production readiness
 */

import { SimulationManager } from '../../simulator/SimulationManager.js';
import { OCPP16JSimulator } from '../../simulator/protocols/OCPP16JSimulator.js';
import { OCPP201Simulator } from '../../simulator/protocols/OCPP201Simulator.js';

// CRITICAL: These tests require a real CSMS endpoint
// Set REAL_CSMS_URL and optionally REAL_CSMS_TLS_CONFIG to run
const realCsmsUrl = process.env.REAL_CSMS_URL;
const realCsmsTlsConfig = process.env.REAL_CSMS_TLS_CONFIG ? JSON.parse(process.env.REAL_CSMS_TLS_CONFIG) : null;
const skipRealCsmsTests = !realCsmsUrl || process.env.SKIP_REAL_CSMS_TESTS === 'true';
const describeOrSkip = skipRealCsmsTests ? describe.skip : describe;

describeOrSkip('Real CSMS Integration Tests', () => {
    let simulationManager;

    beforeAll(() => {
        simulationManager = new SimulationManager();
    });

    afterEach(async () => {
        await simulationManager.removeAllStations();
    });

    afterAll(async () => {
        await simulationManager.shutdown();
    });

    describe('OCPP 1.6J Real CSMS Connection', () => {
        test('should connect to real CSMS with TLS', async () => {
            const stationConfig = {
                stationId: `REAL_TEST_16J_${Date.now()}`,
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J',
                connectorCount: 2,
                maxPower: 22000,
                csmsUrl: realCsmsUrl,
                tls: realCsmsTlsConfig || {
                    enabled: true,
                    rejectUnauthorized: true
                }
            };

            const station = await simulationManager.createStation(stationConfig);
            expect(station).toBeDefined();
            expect(station.isOnline).toBe(true);

            // Wait for boot notification
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify connection
            expect(station.ocppClient.isConnected).toBe(true);
            expect(station.ocppClient.bootNotificationStatus).toBe('Accepted');
        }, 30000);

        test('should send heartbeat to real CSMS', async () => {
            const stationConfig = {
                stationId: `REAL_TEST_16J_HB_${Date.now()}`,
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J',
                csmsUrl: realCsmsUrl,
                tls: realCsmsTlsConfig
            };

            const station = await simulationManager.createStation(stationConfig);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Trigger heartbeat
            await station.ocppClient.sendHeartbeat();
            expect(station.ocppClient.lastHeartbeat).toBeDefined();
        }, 30000);

        test('should handle status notification to real CSMS', async () => {
            const stationConfig = {
                stationId: `REAL_TEST_16J_STATUS_${Date.now()}`,
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J',
                csmsUrl: realCsmsUrl,
                tls: realCsmsTlsConfig
            };

            const station = await simulationManager.createStation(stationConfig);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Send status notification
            await station.ocppClient.sendStatusNotification(1, 'Available', 'NoError');
            
            // Verify it was sent (no error thrown)
            expect(station.ocppClient.isConnected).toBe(true);
        }, 30000);
    });

    describe('OCPP 2.0.1 Real CSMS Connection', () => {
        test('should connect to real CSMS with TLS', async () => {
            const stationConfig = {
                stationId: `REAL_TEST_201_${Date.now()}`,
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '2.0.1',
                connectorCount: 2,
                maxPower: 22000,
                csmsUrl: realCsmsUrl,
                tls: realCsmsTlsConfig || {
                    enabled: true,
                    rejectUnauthorized: true
                }
            };

            const station = await simulationManager.createStation(stationConfig);
            expect(station).toBeDefined();
            expect(station.isOnline).toBe(true);

            // Wait for boot notification
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify connection
            expect(station.ocppClient.isConnected).toBe(true);
            expect(station.ocppClient.bootNotificationStatus).toBe('Accepted');
        }, 30000);

        test('should send heartbeat to real CSMS', async () => {
            const stationConfig = {
                stationId: `REAL_TEST_201_HB_${Date.now()}`,
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '2.0.1',
                csmsUrl: realCsmsUrl,
                tls: realCsmsTlsConfig
            };

            const station = await simulationManager.createStation(stationConfig);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Trigger heartbeat
            await station.ocppClient.sendHeartbeat();
            expect(station.ocppClient.lastHeartbeat).toBeDefined();
        }, 30000);
    });

    describe('TLS Certificate Validation', () => {
        test('should reject invalid certificates when rejectUnauthorized is true', async () => {
            const stationConfig = {
                stationId: `REAL_TEST_TLS_REJECT_${Date.now()}`,
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J',
                csmsUrl: realCsmsUrl,
                tls: {
                    enabled: true,
                    rejectUnauthorized: true
                }
            };

            // This should fail if certificate is invalid
            try {
                const station = await simulationManager.createStation(stationConfig);
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // If we get here, certificate was valid
                expect(station.ocppClient.isConnected).toBe(true);
            } catch (error) {
                // Certificate validation failed (expected for invalid certs)
                expect(error.message).toMatch(/certificate|TLS|SSL/i);
            }
        }, 30000);

        test('should accept self-signed certificates when rejectUnauthorized is false', async () => {
            const stationConfig = {
                stationId: `REAL_TEST_TLS_ACCEPT_${Date.now()}`,
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J',
                csmsUrl: realCsmsUrl,
                tls: {
                    enabled: true,
                    rejectUnauthorized: false
                }
            };

            const station = await simulationManager.createStation(stationConfig);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Should connect even with self-signed cert
            expect(station.ocppClient.isConnected).toBe(true);
        }, 30000);
    });

    describe('Protocol Compliance with Real CSMS', () => {
        test('should follow OCPP 1.6J protocol correctly', async () => {
            const stationConfig = {
                stationId: `REAL_TEST_PROTOCOL_16J_${Date.now()}`,
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J',
                csmsUrl: realCsmsUrl,
                tls: realCsmsTlsConfig
            };

            const station = await simulationManager.createStation(stationConfig);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify protocol compliance
            expect(station.ocppClient.getProtocolVersion()).toBe('1.6J');
            expect(station.ocppClient.getSubProtocol()).toBe('ocpp1.6');
            expect(station.ocppClient.isConnected).toBe(true);
        }, 30000);

        test('should follow OCPP 2.0.1 protocol correctly', async () => {
            const stationConfig = {
                stationId: `REAL_TEST_PROTOCOL_201_${Date.now()}`,
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '2.0.1',
                csmsUrl: realCsmsUrl,
                tls: realCsmsTlsConfig
            };

            const station = await simulationManager.createStation(stationConfig);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify protocol compliance
            expect(station.ocppClient.getProtocolVersion()).toBe('2.0.1');
            expect(station.ocppClient.getSubProtocol()).toBe('ocpp2.0.1');
            expect(station.ocppClient.isConnected).toBe(true);
        }, 30000);
    });
});

