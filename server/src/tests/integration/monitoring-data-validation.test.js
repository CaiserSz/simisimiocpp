/**
 * Monitoring Data Validation Tests
 * Validates that metrics are being produced correctly
 * 
 * Created: 2025-01-11
 * Purpose: Ensure monitoring data sources are working
 */

import metricsCollector from '../../middleware/metrics.js';
import { SimulationManager } from '../../simulator/SimulationManager.js';

describe('Monitoring Data Validation', () => {
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

    test('should produce ocpp_messages_total metric', async () => {
        const stationConfig = {
            stationId: `METRIC_TEST_${Date.now()}`,
            vendor: 'TestVendor',
            model: 'TestModel',
            ocppVersion: '1.6J',
            csmsUrl: 'ws://localhost:9220'
        };

        const station = await simulationManager.createStation(stationConfig);
        
        // Wait for boot notification
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get metrics
        const metrics = await metricsCollector.getMetrics();
        
        // Verify ocpp_messages_total exists
        expect(metrics).toContain('ocpp_messages_total');
        expect(metrics).toMatch(/ocpp_messages_total\{[^}]*message_type="BootNotification"/);
    });

    test('should produce application_errors_total metric on error', async () => {
        // Create an error condition
        try {
            await simulationManager.createStation({
                stationId: null, // Invalid config
                csmsUrl: 'ws://invalid-url:9999'
            });
        } catch (error) {
            // Expected error
        }

        // Get metrics
        const metrics = await metricsCollector.getMetrics();
        
        // Verify application_errors_total exists
        expect(metrics).toContain('application_errors_total');
    });

    test('should produce ocpp_stations_total metric', async () => {
        const stationConfig = {
            stationId: `STATION_METRIC_TEST_${Date.now()}`,
            vendor: 'TestVendor',
            model: 'TestModel',
            ocppVersion: '1.6J',
            csmsUrl: 'ws://localhost:9220'
        };

        await simulationManager.createStation(stationConfig);
        
        // Update statistics to trigger metric update
        simulationManager.updateStatistics();

        // Get metrics
        const metrics = await metricsCollector.getMetrics();
        
        // Verify ocpp_stations_total exists
        expect(metrics).toContain('ocpp_stations_total');
    });

    test('should produce charging_sessions_active metric', async () => {
        const stationConfig = {
            stationId: `SESSION_METRIC_TEST_${Date.now()}`,
            vendor: 'TestVendor',
            model: 'TestModel',
            ocppVersion: '1.6J',
            csmsUrl: 'ws://localhost:9220'
        };

        const station = await simulationManager.createStation(stationConfig);
        
        // Start a charging session
        await station.startChargingSession(1, {
            vehicleType: 'sedan',
            initialSoC: 30,
            targetSoC: 80
        });

        // Get metrics
        const metrics = await metricsCollector.getMetrics();
        
        // Verify charging_sessions_active exists
        expect(metrics).toContain('charging_sessions_active');
    });

    test('should produce http_requests_total metric', async () => {
        // Simulate HTTP request
        metricsCollector.recordHTTPRequest('GET', '/api/stations', 200, 0.1);

        // Get metrics
        const metrics = await metricsCollector.getMetrics();
        
        // Verify http_requests_total exists
        expect(metrics).toContain('http_requests_total');
        expect(metrics).toMatch(/http_requests_total\{[^}]*method="GET"/);
    });

    test('should produce websocket_connections_active metric', async () => {
        const stationConfig = {
            stationId: `WS_METRIC_TEST_${Date.now()}`,
            vendor: 'TestVendor',
            model: 'TestModel',
            ocppVersion: '1.6J',
            csmsUrl: 'ws://localhost:9220'
        };

        const station = await simulationManager.createStation(stationConfig);
        
        // Wait for connection
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get metrics
        const metrics = await metricsCollector.getMetrics();
        
        // Verify websocket_connections_active exists
        expect(metrics).toContain('websocket_connections_active');
    });

    test('should export metrics in Prometheus format', async () => {
        const metrics = await metricsCollector.getMetrics();
        
        // Verify Prometheus format
        expect(metrics).toMatch(/^# HELP/);
        expect(metrics).toMatch(/^# TYPE/);
        expect(metrics).toMatch(/^[a-z_]+(\{[^}]+\})?\s+[\d.]+/m);
    });

    test('should have all required metrics for Grafana dashboard', async () => {
        const requiredMetrics = [
            'ocpp_messages_total',
            'ocpp_stations_total',
            'charging_sessions_active',
            'application_errors_total',
            'http_requests_total',
            'websocket_connections_active'
        ];

        const metrics = await metricsCollector.getMetrics();
        
        for (const metric of requiredMetrics) {
            expect(metrics).toContain(metric);
        }
    });
});

