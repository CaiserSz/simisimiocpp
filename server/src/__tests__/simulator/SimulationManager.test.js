import { jest } from '@jest/globals';
import { SimulationManager } from '../../simulator/SimulationManager.js';
import { StationSimulator } from '../../simulator/StationSimulator.js';

// CRITICAL: These tests are now enabled by default for production readiness
// Set SKIP_FUNCTIONAL_TESTS=true to skip them (for quick checks only)
const skipFunctionalTests = process.env.SKIP_FUNCTIONAL_TESTS === 'true';
const describeOrSkip = skipFunctionalTests ? describe.skip : describe;

describeOrSkip('SimulationManager', () => {
    let simulationManager;

    beforeEach(() => {
        simulationManager = new SimulationManager();
    });

    afterEach(() => {
        // Clean up all stations
        simulationManager.stations.clear();
    });

    describe('Station Management', () => {
        test('should create station with default configuration', async() => {
            const stationConfig = {
                stationId: 'TEST_STATION_001',
                vendor: 'TestVendor',
                model: 'TestModel'
            };

            const station = await simulationManager.createStation(stationConfig);

            expect(station).toBeInstanceOf(StationSimulator);
            expect(station.stationId).toBe('TEST_STATION_001');
            expect(station.config.vendor).toBe('TestVendor');
            expect(station.config.model).toBe('TestModel');
            expect(simulationManager.stations.has('TEST_STATION_001')).toBe(true);
        });

        test('should create station with custom configuration', async() => {
            const stationConfig = {
                stationId: 'TEST_STATION_002',
                vendor: 'CustomVendor',
                model: 'CustomModel',
                connectorCount: 4,
                maxPower: 50000,
                ocppVersion: '2.0.1'
            };

            const station = await simulationManager.createStation(stationConfig);

            expect(station.config.connectorCount).toBe(4);
            expect(station.config.maxPower).toBe(50000);
            expect(station.config.ocppVersion).toBe('2.0.1');
            expect(station.connectors).toHaveLength(4);
        });

        test('should prevent duplicate station IDs', async() => {
            const stationConfig = {
                stationId: 'DUPLICATE_STATION',
                vendor: 'TestVendor',
                model: 'TestModel'
            };

            await simulationManager.createStation(stationConfig);

            await expect(simulationManager.createStation(stationConfig))
                .rejects.toThrow('Station with ID DUPLICATE_STATION already exists');
        });

        test('should get station by ID', () => {
            const mockStation = { stationId: 'TEST_STATION', config: {} };
            simulationManager.stations.set('TEST_STATION', mockStation);

            const station = simulationManager.getStation('TEST_STATION');
            expect(station).toEqual(mockStation);
        });

        test('should return undefined for non-existent station', () => {
            const station = simulationManager.getStation('NON_EXISTENT');
            expect(station).toBeUndefined();
        });

        test('should remove station', async() => {
            const stationConfig = {
                stationId: 'REMOVE_TEST',
                vendor: 'TestVendor',
                model: 'TestModel'
            };

            await simulationManager.createStation(stationConfig);
            expect(simulationManager.stations.has('REMOVE_TEST')).toBe(true);

            const result = await simulationManager.removeStation('REMOVE_TEST');
            expect(result).toBe(true);
            expect(simulationManager.stations.has('REMOVE_TEST')).toBe(false);
        });

        test('should return false when removing non-existent station', async() => {
            const result = await simulationManager.removeStation('NON_EXISTENT');
            expect(result).toBe(false);
        });

        test('should get all stations', async() => {
            await simulationManager.createStation({
                stationId: 'STATION_1',
                vendor: 'Vendor1',
                model: 'Model1'
            });

            await simulationManager.createStation({
                stationId: 'STATION_2',
                vendor: 'Vendor2',
                model: 'Model2'
            });

            const stations = simulationManager.getAllStations();
            expect(stations).toHaveLength(2);
            expect(stations.map(s => s.stationId)).toContain('STATION_1');
            expect(stations.map(s => s.stationId)).toContain('STATION_2');
        });
    });

    describe('Bulk Operations', () => {
        beforeEach(async() => {
            // Create test stations
            for (let i = 1; i <= 3; i++) {
                await simulationManager.createStation({
                    stationId: `BULK_TEST_${i}`,
                    vendor: 'BulkVendor',
                    model: 'BulkModel'
                });
            }
        });

        test('should start all stations', async() => {
            const results = await simulationManager.startAllStations();

            expect(results.successful).toHaveLength(3);
            expect(results.failed).toHaveLength(0);

            // Verify all stations are marked as online
            simulationManager.getAllStations().forEach(station => {
                expect(station.isOnline).toBe(true);
            });
        });

        test('should stop all stations', async() => {
            // First start all stations
            await simulationManager.startAllStations();

            const results = await simulationManager.stopAllStations();

            expect(results.successful).toHaveLength(3);
            expect(results.failed).toHaveLength(0);

            // Verify all stations are marked as offline
            simulationManager.getAllStations().forEach(station => {
                expect(station.isOnline).toBe(false);
            });
        });

        test('should restart all stations', async() => {
            // First start all stations
            await simulationManager.startAllStations();

            const results = await simulationManager.restartAllStations();

            expect(results.successful).toHaveLength(3);
            expect(results.failed).toHaveLength(0);

            // Verify all stations are online after restart
            simulationManager.getAllStations().forEach(station => {
                expect(station.isOnline).toBe(true);
            });
        });

        test('should remove all stations', async() => {
            const result = await simulationManager.removeAllStations();

            expect(result.removed).toBe(3);
            expect(simulationManager.stations.size).toBe(0);
        });
    });

    describe('Station Profiles', () => {
        test('should create stations from urban AC profile', async() => {
            const stations = await simulationManager.createStationsFromProfile('urban_ac', 2, {
                csmsUrl: 'ws://test:9220'
            });

            expect(stations).toHaveLength(2);
            stations.forEach(station => {
                expect(station.config.maxPower).toBe(22000);
                expect(station.config.connectorCount).toBe(2);
                expect(station.config.csmsUrl).toBe('ws://test:9220');
            });
        });

        test('should create stations from DC fast profile', async() => {
            const stations = await simulationManager.createStationsFromProfile('dc_fast', 1);

            expect(stations).toHaveLength(1);
            expect(stations[0].config.maxPower).toBe(50000);
            expect(stations[0].config.connectorCount).toBe(2);
        });

        test('should handle invalid profile', async() => {
            await expect(simulationManager.createStationsFromProfile('invalid_profile', 1))
                .rejects.toThrow('Unknown station profile: invalid_profile');
        });
    });

    describe('Scenarios', () => {
        test('should execute urban mixed scenario', async() => {
            const result = await simulationManager.executeScenario('urban_mixed');

            expect(result.success).toBe(true);
            expect(result.stationsCreated).toBeGreaterThan(0);
            expect(result.scenario).toBe('urban_mixed');
        });

        test('should execute highway corridor scenario', async() => {
            const result = await simulationManager.executeScenario('highway_corridor');

            expect(result.success).toBe(true);
            expect(result.stationsCreated).toBeGreaterThan(0);
            expect(result.scenario).toBe('highway_corridor');
        });

        test('should handle invalid scenario', async() => {
            await expect(simulationManager.executeScenario('invalid_scenario'))
                .rejects.toThrow('Unknown scenario: invalid_scenario');
        });

        test('should stop running scenario', async() => {
            // Start a scenario
            await simulationManager.executeScenario('urban_mixed');

            const result = await simulationManager.stopScenario();

            expect(result.success).toBe(true);
            expect(result.message).toContain('Scenario stopped');
        });
    });

    describe('Statistics', () => {
        beforeEach(async() => {
            // Create mixed station types
            await simulationManager.createStation({
                stationId: 'STATS_STATION_1',
                vendor: 'Vendor1',
                model: 'Model1',
                ocppVersion: '1.6J'
            });

            await simulationManager.createStation({
                stationId: 'STATS_STATION_2',
                vendor: 'Vendor2',
                model: 'Model2',
                ocppVersion: '2.0.1'
            });

            // Start one station
            await simulationManager.getStation('STATS_STATION_1').start();
        });

        test('should get simulation statistics', () => {
            const stats = simulationManager.getStatistics();

            expect(stats.totalStations).toBe(2);
            expect(stats.onlineStations).toBe(1);
            expect(stats.offlineStations).toBe(1);
            expect(stats.protocolDistribution).toEqual({
                '1.6J': 1,
                '2.0.1': 1
            });
            expect(stats.startTime).toBeDefined();
        });

        test('should include performance metrics', () => {
            const stats = simulationManager.getStatistics();

            expect(stats.performance).toBeDefined();
            expect(stats.performance.memoryUsage).toBeDefined();
            expect(stats.performance.cpuUsage).toBeDefined();
        });

        test('should track uptime', () => {
            const stats = simulationManager.getStatistics();

            expect(stats.uptime).toBeGreaterThanOrEqual(0);
            expect(typeof stats.uptime).toBe('number');
        });
    });

    describe('Event Handling', () => {
        test('should emit station created event', async() => {
            const eventSpy = jest.fn();
            simulationManager.on('stationCreated', eventSpy);

            await simulationManager.createStation({
                stationId: 'EVENT_TEST',
                vendor: 'TestVendor',
                model: 'TestModel'
            });

            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    stationId: 'EVENT_TEST'
                })
            );
        });

        test('should emit station removed event', async() => {
            const eventSpy = jest.fn();
            simulationManager.on('stationRemoved', eventSpy);

            await simulationManager.createStation({
                stationId: 'REMOVE_EVENT_TEST',
                vendor: 'TestVendor',
                model: 'TestModel'
            });

            await simulationManager.removeStation('REMOVE_EVENT_TEST');

            expect(eventSpy).toHaveBeenCalledWith('REMOVE_EVENT_TEST');
        });

        test('should emit scenario events', async() => {
            const startSpy = jest.fn();
            const stopSpy = jest.fn();

            simulationManager.on('scenarioStarted', startSpy);
            simulationManager.on('scenarioStopped', stopSpy);

            await simulationManager.executeScenario('urban_mixed');
            await simulationManager.stopScenario();

            expect(startSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    scenario: 'urban_mixed'
                })
            );
            expect(stopSpy).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should handle station creation errors gracefully', async() => {
            // Test with invalid configuration
            await expect(simulationManager.createStation({
                // Missing required stationId
                vendor: 'TestVendor'
            })).rejects.toThrow();
        });

        test('should handle bulk operation failures', async() => {
            // Create a station that will fail to start
            const mockStation = {
                stationId: 'FAILING_STATION',
                start: jest.fn().mockRejectedValue(new Error('Start failed')),
                stop: jest.fn().mockRejectedValue(new Error('Stop failed')),
                isOnline: false
            };

            simulationManager.stations.set('FAILING_STATION', mockStation);

            const results = await simulationManager.startAllStations();

            expect(results.successful).toHaveLength(0);
            expect(results.failed).toHaveLength(1);
            expect(results.failed[0]).toContain('FAILING_STATION');
        });

        test('should validate scenario parameters', async() => {
            await expect(simulationManager.executeScenario(null))
                .rejects.toThrow();

            await expect(simulationManager.executeScenario(''))
                .rejects.toThrow();
        });
    });
});
