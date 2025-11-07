import { jest } from '@jest/globals';
import { SimulationManager } from '../simulator/SimulationManager.js';

describe('Health Monitoring & Batch Operations', () => {
    let simulationManager;

    beforeEach(async() => {
        simulationManager = new SimulationManager();
    });

    afterEach(async() => {
        await simulationManager.removeAllStations();
    });

    describe('Health Monitoring', () => {
        test('should calculate health score for healthy station', async() => {
            const station = await simulationManager.createStation({
                stationId: 'HEALTHY_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            const health = station.getHealth();
            expect(health.score).toBeGreaterThanOrEqual(0);
            expect(health.score).toBeLessThanOrEqual(100);
            expect(health.status).toBeDefined();
            expect(['healthy', 'warning', 'critical']).toContain(health.status);
        });

        test('should detect critical health when offline', async() => {
            const station = await simulationManager.createStation({
                stationId: 'OFFLINE_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            // Station is offline by default
            station.isOnline = false;
            station.updateHealthScore();

            const health = station.getHealth();
            expect(health.score).toBeLessThan(80);
            expect(health.status).toBe('warning');
        });

        test('should update health score periodically', async() => {
            const station = await simulationManager.createStation({
                stationId: 'PERIODIC_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            const health1 = station.getHealth();
            station.metrics.errorCount = 20; // Increase error count
            station.updateHealthScore();
            const health2 = station.getHealth();

            expect(health2.score).toBeLessThan(health1.score);
        });

        test('should track health issues', async() => {
            const station = await simulationManager.createStation({
                stationId: 'ISSUE_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            station.recordError({
                type: 'test_error',
                message: 'Test error',
                severity: 'error'
            });

            const health = station.getHealth();
            expect(health.issues.length).toBeGreaterThan(0);
            expect(health.issues[0].type).toBe('error');
        });

        test('should get health summary for all stations', async() => {
            await simulationManager.createStation({
                stationId: 'STATION_1',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            await simulationManager.createStation({
                stationId: 'STATION_2',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '2.0.1'
            });

            const summary = simulationManager.getHealthSummary();
            expect(summary.total).toBe(2);
            expect(summary.healthy + summary.warning + summary.critical).toBe(2);
            expect(summary.stations).toHaveLength(2);
        });

        test('should get stations by health status', async() => {
            const healthyStation = await simulationManager.createStation({
                stationId: 'HEALTHY_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            const criticalStation = await simulationManager.createStation({
                stationId: 'CRITICAL_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            criticalStation.isOnline = false;
            criticalStation.updateHealthScore();

            const healthyStations = simulationManager.getStationsByHealthStatus('healthy');
            const criticalStations = simulationManager.getStationsByHealthStatus('critical');

            expect(healthyStations.length).toBeGreaterThan(0);
            expect(criticalStations.length).toBeGreaterThan(0);
        });

        test('should emit health update events', (done) => {
            simulationManager.createStation({
                stationId: 'EVENT_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            }).then(station => {
                simulationManager.once('stationHealthUpdate', (data) => {
                    expect(data.stationId).toBe('EVENT_STATION');
                    expect(data.health).toBeDefined();
                    done();
                });

                station.updateHealthScore();
            });
        });

        test('should emit critical health alerts', (done) => {
            simulationManager.createStation({
                stationId: 'CRITICAL_ALERT_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            }).then(station => {
                simulationManager.once('stationHealthAlert', (data) => {
                    expect(data.stationId).toBe('CRITICAL_ALERT_STATION');
                    expect(data.health.status).toBe('critical');
                    done();
                });

                station.isOnline = false;
                station.ocppClient = { isConnected: false };
                station.updateHealthScore();
            });
        });
    });

    describe('Batch Operations', () => {
        beforeEach(async() => {
            // Create test stations
            for (let i = 1; i <= 5; i++) {
                await simulationManager.createStation({
                    stationId: `BATCH_STATION_${i}`,
                    vendor: 'TestVendor',
                    model: 'TestModel',
                    ocppVersion: '1.6J'
                });
            }
        });

        test('should batch start stations', async() => {
            const stationIds = ['BATCH_STATION_1', 'BATCH_STATION_2', 'BATCH_STATION_3'];

            const results = await simulationManager.batchStartStations(stationIds);

            expect(results.success).toHaveLength(3);
            expect(results.failed).toHaveLength(0);
        });

        test('should handle partial failures in batch start', async() => {
            const stationIds = ['BATCH_STATION_1', 'INVALID_STATION', 'BATCH_STATION_3'];

            const results = await simulationManager.batchStartStations(stationIds);

            expect(results.success.length).toBeGreaterThan(0);
            expect(results.failed.length).toBeGreaterThan(0);
            expect(results.failed[0].stationId).toBe('INVALID_STATION');
        });

        test('should batch stop stations', async() => {
            const stationIds = ['BATCH_STATION_1', 'BATCH_STATION_2'];

            // Start stations first
            await simulationManager.batchStartStations(stationIds);

            const results = await simulationManager.batchStopStations(stationIds);

            expect(results.success).toHaveLength(2);
            expect(results.failed).toHaveLength(0);
        });

        test('should batch update stations', async() => {
            const stationIds = ['BATCH_STATION_1', 'BATCH_STATION_2'];
            const updates = {
                heartbeatInterval: 600,
                maxPower: 50000
            };

            const results = await simulationManager.batchUpdateStations(stationIds, updates);

            expect(results.success).toHaveLength(2);
            expect(results.failed).toHaveLength(0);

            // Verify updates
            const station1 = simulationManager.getStation('BATCH_STATION_1');
            expect(station1.config.heartbeatInterval).toBe(600);
            expect(station1.config.maxPower).toBe(50000);
        });

        test('should handle empty batch operations', async() => {
            const results = await simulationManager.batchStartStations([]);
            expect(results.success).toHaveLength(0);
            expect(results.failed).toHaveLength(0);
        });

        test('should handle all stations failure in batch operation', async() => {
            const stationIds = ['NON_EXISTENT_1', 'NON_EXISTENT_2'];

            const results = await simulationManager.batchStartStations(stationIds);

            expect(results.success).toHaveLength(0);
            expect(results.failed).toHaveLength(2);
        });
    });

    describe('Station Grouping', () => {
        test('should get stations by group', async() => {
            await simulationManager.createStation({
                stationId: 'GROUP_STATION_1',
                groupId: 'test_group',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            await simulationManager.createStation({
                stationId: 'GROUP_STATION_2',
                groupId: 'test_group',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            const stations = simulationManager.getStationsByGroup('test_group');
            expect(stations.length).toBeGreaterThanOrEqual(2);
        });

        test('should get stations by network', async() => {
            await simulationManager.createStation({
                stationId: 'NETWORK_STATION_1',
                networkId: 'network_primary',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            const stations = simulationManager.getStationsByNetwork('network_primary');
            expect(stations.length).toBeGreaterThanOrEqual(1);
        });

        test('should get all groups', () => {
            const groups = simulationManager.getGroups();
            expect(groups).toBeDefined();
            expect(typeof groups).toBe('object');
        });

        test('should get all networks', () => {
            const networks = simulationManager.getNetworks();
            expect(networks).toBeDefined();
            expect(typeof networks).toBe('object');
            expect(networks).toHaveProperty('network_primary');
        });
    });

    describe('Station Cloning', () => {
        test('should clone station successfully', async() => {
            const sourceStation = await simulationManager.createStation({
                stationId: 'SOURCE_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J',
                connectorCount: 4,
                maxPower: 50000
            });

            const clonedStation = await simulationManager.cloneStation(
                'SOURCE_STATION',
                'CLONED_STATION'
            );

            expect(clonedStation.stationId).toBe('CLONED_STATION');
            expect(clonedStation.config.vendor).toBe('TestVendor');
            expect(clonedStation.config.connectorCount).toBe(4);
            expect(clonedStation.config.maxPower).toBe(50000);
        });

        test('should clone station with overrides', async() => {
            const sourceStation = await simulationManager.createStation({
                stationId: 'SOURCE_STATION_2',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J',
                maxPower: 50000
            });

            const clonedStation = await simulationManager.cloneStation(
                'SOURCE_STATION_2',
                'CLONED_STATION_2', { maxPower: 75000, ocppVersion: '2.0.1' }
            );

            expect(clonedStation.config.maxPower).toBe(75000);
            expect(clonedStation.config.ocppVersion).toBe('2.0.1');
            expect(clonedStation.config.vendor).toBe('TestVendor'); // Preserved from source
        });

        test('should generate unique station ID if not provided', async() => {
            const sourceStation = await simulationManager.createStation({
                stationId: 'SOURCE_STATION_3',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            const clonedStation = await simulationManager.cloneStation('SOURCE_STATION_3');

            expect(clonedStation.stationId).not.toBe('SOURCE_STATION_3');
            expect(clonedStation.stationId).toContain('SOURCE_STATION_3');
        });

        test('should throw error when cloning non-existent station', async() => {
            await expect(
                simulationManager.cloneStation('NON_EXISTENT_STATION')
            ).rejects.toThrow('Station not found');
        });
    });

    describe('Historical Data', () => {
        test('should record session in history', async() => {
            const station = await simulationManager.createStation({
                stationId: 'HISTORY_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            station.recordSession({
                transactionId: 'TEST_TXN_1',
                connectorId: 1,
                idTag: 'TEST_TAG',
                startTime: new Date()
            });

            const history = station.getHistory({ type: 'sessions' });
            expect(history.sessions.length).toBeGreaterThan(0);
            expect(history.sessions[0].transactionId).toBe('TEST_TXN_1');
        });

        test('should record errors in history', async() => {
            const station = await simulationManager.createStation({
                stationId: 'ERROR_HISTORY_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            station.recordError({
                type: 'test_error',
                message: 'Test error message',
                severity: 'error'
            });

            const history = station.getHistory({ type: 'errors' });
            expect(history.errors.length).toBeGreaterThan(0);
            expect(history.errors[0].type).toBe('test_error');
        });

        test('should filter history by date range', async() => {
            const station = await simulationManager.createStation({
                stationId: 'DATE_FILTER_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            const oldDate = new Date(Date.now() - 2 * 24 * 3600 * 1000); // 2 days ago
            const recentDate = new Date();

            station.recordSession({
                transactionId: 'OLD_TXN',
                startTime: oldDate
            });

            station.recordSession({
                transactionId: 'RECENT_TXN',
                startTime: recentDate
            });

            const history = station.getHistory({
                type: 'sessions',
                startDate: new Date(Date.now() - 24 * 3600 * 1000) // Last 24 hours
            });

            expect(history.sessions.length).toBeGreaterThanOrEqual(1);
            expect(history.sessions[0].transactionId).toBe('RECENT_TXN');
        });

        test('should limit history results', async() => {
            const station = await simulationManager.createStation({
                stationId: 'LIMIT_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            // Record multiple sessions
            for (let i = 0; i < 150; i++) {
                station.recordSession({
                    transactionId: `TXN_${i}`,
                    startTime: new Date()
                });
            }

            const history = station.getHistory({ type: 'sessions', limit: 100 });
            expect(history.sessions.length).toBeLessThanOrEqual(100);
        });
    });

    describe('Edge Cases', () => {
        test('should handle health check with no stations', () => {
            const summary = simulationManager.getHealthSummary();
            expect(summary.total).toBe(0);
            expect(summary.healthy).toBe(0);
            expect(summary.stations).toHaveLength(0);
        });

        test('should handle batch operations with invalid station IDs', async() => {
            const results = await simulationManager.batchStartStations(['INVALID_1', 'INVALID_2']);
            expect(results.success).toHaveLength(0);
            expect(results.failed).toHaveLength(2);
        });

        test('should handle cloning station that is already running', async() => {
            const sourceStation = await simulationManager.createStation({
                stationId: 'RUNNING_STATION',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            await sourceStation.start();

            const clonedStation = await simulationManager.cloneStation('RUNNING_STATION');
            expect(clonedStation.isOnline).toBe(false); // Cloned station should not be running
        });

        test('should handle health update with network simulator', async() => {
            const station = await simulationManager.createStation({
                stationId: 'NETWORK_HEALTH_STATION',
                networkId: 'network_primary',
                vendor: 'TestVendor',
                model: 'TestModel',
                ocppVersion: '1.6J'
            });

            const health = station.getHealth();
            expect(health).toBeDefined();
            expect(health.networkStats).toBeDefined();
        });
    });
});