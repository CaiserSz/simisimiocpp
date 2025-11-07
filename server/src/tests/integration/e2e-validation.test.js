/**
 * End-to-End Validation Test Suite
 * Validates complete simulator workflow from station creation to charging
 * 
 * Created: 2025-01-11
 * Purpose: Ensure complete system works end-to-end
 */

describe('End-to-End Validation', () => {
    let simulationManager;
    let stationId;
    const CSMS_URL = process.env.CSMS_URL || 'ws://localhost:9220';

    beforeAll(async() => {
        const { simulationManager: manager } = await
        import ('../../../controllers/simulator.controller.js');
        simulationManager = manager;
    });

    afterEach(async() => {
        if (stationId && simulationManager) {
            try {
                const station = simulationManager.getStation(stationId);
                if (station) {
                    await station.stop();
                    simulationManager.removeStation(stationId);
                }
            } catch (error) {
                // Ignore cleanup errors
            }
            stationId = null;
        }
    });

    describe('Complete Station Lifecycle', () => {
        test('should create, start, and stop station', async() => {
            const stationConfig = {
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J',
                connectorCount: 2,
                maxPower: 22000,
                csmsUrl: CSMS_URL,
                serialNumber: 'E2E_TEST_001'
            };

            // Create station
            const station = await simulationManager.createStation(stationConfig);
            stationId = station.stationId;

            expect(station).toBeDefined();
            expect(station.stationId).toBeDefined();
            expect(station.status).toBe('Available');

            // Start station
            await station.start();
            expect(station.isRunning).toBe(true);

            // Wait for connection
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Stop station
            await station.stop();
            expect(station.isRunning).toBe(false);
        }, 30000);

        test('should handle vehicle connection and charging', async() => {
            const stationConfig = {
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J',
                connectorCount: 1,
                maxPower: 22000,
                csmsUrl: CSMS_URL,
                serialNumber: 'E2E_TEST_002'
            };

            const station = await simulationManager.createStation(stationConfig);
            stationId = station.stationId;

            await station.start();
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Connect vehicle
            const vehicle = await station.vehicleSimulator.connectVehicle(1, {
                vehicleType: 'sedan',
                initialSoC: 30,
                targetSoC: 80
            });

            expect(vehicle).toBeDefined();
            expect(vehicle.connectorId).toBe(1);

            // Start charging
            const chargingSession = await station.vehicleSimulator.startCharging(1, {
                idTag: 'RFID_E2E_001'
            });

            expect(chargingSession).toBeDefined();

            // Wait for charging to progress
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Stop charging
            await station.vehicleSimulator.stopCharging(1);

            // Disconnect vehicle
            await station.vehicleSimulator.disconnectVehicle(1);

            await station.stop();
        }, 60000);
    });

    describe('Multi-Station Scenario', () => {
        test('should handle multiple stations concurrently', async() => {
            const stations = [];
            const stationConfigs = [{
                    vendor: 'TestVendor',
                    model: 'TestModel',
                    ocppVersion: '1.6J',
                    connectorCount: 2,
                    maxPower: 22000,
                    csmsUrl: CSMS_URL,
                    serialNumber: 'E2E_MULTI_001'
                },
                {
                    vendor: 'TestVendor',
                    model: 'TestModel',
                    ocppVersion: '2.0.1',
                    connectorCount: 1,
                    maxPower: 50000,
                    csmsUrl: CSMS_URL,
                    serialNumber: 'E2E_MULTI_002'
                }
            ];

            // Create multiple stations
            for (const config of stationConfigs) {
                const station = await simulationManager.createStation(config);
                stations.push(station);
            }

            expect(stations.length).toBe(2);

            // Start all stations
            await Promise.all(stations.map(s => s.start()));

            // Wait for connections
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Verify all stations are running
            stations.forEach(station => {
                expect(station.isRunning).toBe(true);
            });

            // Stop all stations
            await Promise.all(stations.map(s => s.stop()));

            // Cleanup
            stations.forEach(station => {
                simulationManager.removeStation(station.stationId);
            });
        }, 60000);
    });

    describe('Error Recovery', () => {
        test('should recover from CSMS disconnection', async() => {
            const stationConfig = {
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J',
                connectorCount: 1,
                maxPower: 22000,
                csmsUrl: CSMS_URL,
                serialNumber: 'E2E_RECOVERY_001'
            };

            const station = await simulationManager.createStation(stationConfig);
            stationId = station.stationId;

            await station.start();
            await new Promise(resolve => setTimeout(resolve, 2000));

            expect(station.isRunning).toBe(true);
            expect(station.ocppClient ? .isConnected).toBe(true);

            // Simulate CSMS disconnection
            if (station.ocppClient ? .ws) {
                station.ocppClient.ws.close();
            }

            // Wait for reconnection attempt
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Station should attempt reconnection
            expect(station.isRunning).toBe(true);

            await station.stop();
        }, 30000);
    });

    describe('Protocol Switching', () => {
        test('should switch protocol at runtime', async() => {
            const stationConfig = {
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J',
                connectorCount: 1,
                maxPower: 22000,
                csmsUrl: CSMS_URL,
                serialNumber: 'E2E_SWITCH_001'
            };

            const station = await simulationManager.createStation(stationConfig);
            stationId = station.stationId;

            await station.start();
            await new Promise(resolve => setTimeout(resolve, 2000));

            expect(station.ocppVersion).toBe('1.6J');

            // Switch protocol
            await station.switchProtocol('2.0.1');
            await new Promise(resolve => setTimeout(resolve, 2000));

            expect(station.ocppVersion).toBe('2.0.1');

            await station.stop();
        }, 30000);
    });
});