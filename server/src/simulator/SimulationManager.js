import { EventEmitter } from 'events';
import CacheManager, { CacheKeys } from '../services/CacheManager.js';
import BackupService from '../services/backup.service.js';
import logger from '../utils/logger.js';
import metricsCollector from '../middleware/metrics.js';
import { StationSimulator } from './StationSimulator.js';

/**
 * Multi-Station Simulation Manager
 * Manages multiple charging station simulations with different configurations
 */
export class SimulationManager extends EventEmitter {
    constructor() {
        super();

        this.stations = new Map(); // stationId -> StationSimulator
        this.scenarios = new Map(); // scenarioId -> scenario config
        this.profiles = new Map(); // profileId -> station profile
        this.groups = new Map(); // groupId -> GroupConfig
        this.networks = new Map(); // networkId -> NetworkConfig

        // Simulation state
        this.isRunning = false;
        this.startTime = null;
        this.statistics = {
            totalStations: 0,
            activeStations: 0,
            totalSessions: 0,
            totalEnergyDelivered: 0,
            averageSessionDuration: 0,
            protocolDistribution: {
                'OCPP 1.6J': 0,
                'OCPP 2.0.1': 0
            },
            byGroup: {},
            byNetwork: {},
            byLocation: {}
        };

        // Initialize groups and networks
        this.initializeGroups();
        this.initializeNetworks();

        // Initialize backup service
        this.backupService = new BackupService();

        // Load predefined profiles
        this.loadPredefinedProfiles();
        this.loadPredefinedScenarios();

        // Setup periodic health checks
        this.setupHealthMonitoring();

        // Setup periodic backups
        this.setupPeriodicBackups();

        logger.info('🎛️ Simulation Manager initialized');
    }

    /**
     * Initialize station groups (location-based, operator-based)
     */
    initializeGroups() {
        const defaultGroups = {
            'urban_istanbul': {
                name: 'Istanbul Urban Network',
                type: 'location',
                location: {
                    city: 'Istanbul',
                    country: 'Turkey',
                    coordinates: { lat: 41.0082, lon: 28.9784 }
                },
                operator: 'UrbanCharge Operator',
                description: 'Urban charging network in Istanbul'
            },
            'highway_ankara': {
                name: 'Ankara Highway Corridor',
                type: 'location',
                location: {
                    city: 'Ankara',
                    country: 'Turkey',
                    coordinates: { lat: 39.9334, lon: 32.8597 }
                },
                operator: 'Highway Operator',
                description: 'Highway charging corridor'
            },
            'operator_alpha': {
                name: 'Alpha Operator Network',
                type: 'operator',
                operator: 'Alpha Charging Solutions',
                description: 'Alpha operator charging network'
            },
            'operator_beta': {
                name: 'Beta Operator Network',
                type: 'operator',
                operator: 'Beta Energy Corp',
                description: 'Beta operator charging network'
            }
        };

        for (const [groupId, group] of Object.entries(defaultGroups)) {
            this.groups.set(groupId, {
                ...group,
                stationIds: [],
                createdAt: new Date().toISOString()
            });
        }

        logger.info(`📁 Initialized ${this.groups.size} station groups`);
    }

    /**
     * Initialize network configurations
     */
    initializeNetworks() {
        const defaultNetworks = {
            'network_primary': {
                name: 'Primary CSMS Network',
                csmsUrl: 'ws://localhost:9220',
                description: 'Primary CSMS connection',
                latency: { min: 10, max: 50 }, // ms
                packetLoss: 0.001, // 0.1%
                disconnectionRate: 0.0001 // 0.01%
            },
            'network_secondary': {
                name: 'Secondary CSMS Network',
                csmsUrl: 'ws://localhost:9221',
                description: 'Secondary CSMS connection',
                latency: { min: 20, max: 100 },
                packetLoss: 0.002,
                disconnectionRate: 0.0002
            },
            'network_test': {
                name: 'Test Network',
                csmsUrl: 'ws://localhost:9220',
                description: 'Test CSMS connection',
                latency: { min: 0, max: 10 },
                packetLoss: 0,
                disconnectionRate: 0
            }
        };

        for (const [networkId, network] of Object.entries(defaultNetworks)) {
            this.networks.set(networkId, {
                ...network,
                stationIds: [],
                createdAt: new Date().toISOString()
            });
        }

        logger.info(`🌐 Initialized ${this.networks.size} network configurations`);
    }
    loadPredefinedProfiles() {
        const profiles = {
            'urban_ac': {
                name: 'Urban AC Charger',
                vendor: 'UrbanCharge',
                model: 'UC-AC-7',
                connectorCount: 2,
                maxPower: 7400, // 7.4kW
                ocppVersion: '1.6J',
                heartbeatInterval: 300,
                supportedStandards: ['IEC62196Type2'],
                location: 'urban',
                description: 'Standard urban AC charging station'
            },
            'urban_dc_fast': {
                name: 'Urban DC Fast Charger',
                vendor: 'FastCharge Co',
                model: 'FC-DC-50',
                connectorCount: 1,
                maxPower: 50000, // 50kW
                ocppVersion: '2.0.1',
                heartbeatInterval: 180,
                supportedStandards: ['CCS', 'CHAdeMO'],
                location: 'urban',
                description: 'Urban DC fast charging station'
            },
            'highway_ultra_fast': {
                name: 'Highway Ultra Fast Charger',
                vendor: 'UltraFast Systems',
                model: 'UFS-350',
                connectorCount: 4,
                maxPower: 350000, // 350kW
                ocppVersion: '2.0.1',
                heartbeatInterval: 120,
                supportedStandards: ['CCS2'],
                location: 'highway',
                description: 'Highway ultra-fast charging hub'
            },
            'workplace_ac': {
                name: 'Workplace AC Charger',
                vendor: 'WorkCharge',
                model: 'WC-AC-11',
                connectorCount: 2,
                maxPower: 11000, // 11kW
                ocppVersion: '1.6J',
                heartbeatInterval: 600,
                supportedStandards: ['IEC62196Type2'],
                location: 'workplace',
                description: 'Workplace AC charging station'
            },
            'home_wallbox': {
                name: 'Home Wallbox',
                vendor: 'HomeCharge',
                model: 'HC-Wall-22',
                connectorCount: 1,
                maxPower: 22000, // 22kW
                ocppVersion: '1.6J',
                heartbeatInterval: 900,
                supportedStandards: ['IEC62196Type2'],
                location: 'residential',
                description: 'Residential wallbox charger'
            },
            'destination_ac': {
                name: 'Destination AC Charger',
                vendor: 'DestinationCharge',
                model: 'DC-AC-22',
                connectorCount: 2,
                maxPower: 22000, // 22kW
                ocppVersion: '2.0.1',
                heartbeatInterval: 300,
                supportedStandards: ['IEC62196Type2'],
                location: 'destination',
                description: 'Hotel/shopping center AC charger'
            }
        };

        for (const [profileId, profile] of Object.entries(profiles)) {
            this.profiles.set(profileId, profile);
        }

        logger.info(`📋 Loaded ${this.profiles.size} predefined station profiles`);
    }

    /**
     * Load predefined simulation scenarios
     */
    loadPredefinedScenarios() {
        const scenarios = {
            'urban_mixed': {
                name: 'Urban Mixed Charging',
                description: 'Mixed AC and DC charging in urban environment',
                duration: 3600, // 1 hour
                stations: [
                    { profileId: 'urban_ac', count: 10, csmsUrl: 'ws://localhost:9220' },
                    { profileId: 'urban_dc_fast', count: 3, csmsUrl: 'ws://localhost:9220' }
                ],
                vehicleScenarios: [
                    { type: 'quick_charge', probability: 0.4 },
                    { type: 'full_charge', probability: 0.3 },
                    { type: 'top_up', probability: 0.3 }
                ],
                events: [
                    { time: 300, action: 'peak_hour_start' },
                    { time: 1800, action: 'peak_hour_end' }
                ]
            },
            'highway_corridor': {
                name: 'Highway Charging Corridor',
                description: 'Ultra-fast charging along highway corridor',
                duration: 7200, // 2 hours
                stations: [
                    { profileId: 'highway_ultra_fast', count: 5, csmsUrl: 'ws://localhost:9220' }
                ],
                vehicleScenarios: [
                    { type: 'highway_stop', probability: 0.8 },
                    { type: 'emergency_charge', probability: 0.2 }
                ],
                events: [
                    { time: 900, action: 'traffic_surge' },
                    { time: 5400, action: 'maintenance_mode' }
                ]
            },
            'workplace_daily': {
                name: 'Workplace Daily Charging',
                description: 'Daily workplace charging pattern',
                duration: 28800, // 8 hours
                stations: [
                    { profileId: 'workplace_ac', count: 20, csmsUrl: 'ws://localhost:9220' }
                ],
                vehicleScenarios: [
                    { type: 'work_day_charge', probability: 0.9 },
                    { type: 'visitor_charge', probability: 0.1 }
                ],
                events: [
                    { time: 0, action: 'morning_arrival' },
                    { time: 14400, action: 'lunch_break' },
                    { time: 25200, action: 'evening_departure' }
                ]
            },
            'load_test': {
                name: 'Load Testing Scenario',
                description: 'High-load testing with many concurrent stations',
                duration: 1800, // 30 minutes
                stations: [
                    { profileId: 'urban_ac', count: 50, csmsUrl: 'ws://localhost:9220' },
                    { profileId: 'urban_dc_fast', count: 20, csmsUrl: 'ws://localhost:9220' },
                    { profileId: 'highway_ultra_fast', count: 10, csmsUrl: 'ws://localhost:9220' }
                ],
                vehicleScenarios: [
                    { type: 'stress_test', probability: 1.0 }
                ],
                events: [
                    { time: 300, action: 'concurrent_start' },
                    { time: 900, action: 'protocol_switch' },
                    { time: 1200, action: 'error_simulation' }
                ]
            }
        };

        for (const [scenarioId, scenario] of Object.entries(scenarios)) {
            this.scenarios.set(scenarioId, scenario);
        }

        logger.info(`📋 Loaded ${this.scenarios.size} predefined scenarios`);
    }

    /**
     * Create a single station simulator
     */
    async createStation(config) {
        const stationConfig = {
            stationId: config.stationId || `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            // Add organization metadata
            groupId: config.groupId || null,
            networkId: config.networkId || 'network_primary',
            operator: config.operator || null,
            location: config.location || null,
            ...config
        };

        // Get network configuration if networkId is specified
        if (stationConfig.networkId && this.networks.has(stationConfig.networkId)) {
            const network = this.networks.get(stationConfig.networkId);
            stationConfig.networkConfig = {
                latency: network.latency,
                packetLoss: network.packetLoss,
                disconnectionRate: network.disconnectionRate,
                enabled: true
            };
            // Use network CSMS URL if not explicitly provided
            if (!stationConfig.csmsUrl || stationConfig.csmsUrl === 'ws://localhost:9220') {
                stationConfig.csmsUrl = network.csmsUrl;
            }
        }

        const station = new StationSimulator(stationConfig);

        // Setup event handlers
        this.setupStationEventHandlers(station);

        // Store station
        this.stations.set(station.stationId, station);

        // Add to group if specified
        if (stationConfig.groupId && this.groups.has(stationConfig.groupId)) {
            const group = this.groups.get(stationConfig.groupId);
            if (!group.stationIds.includes(station.stationId)) {
                group.stationIds.push(station.stationId);
            }
        }

        // Add to network
        if (stationConfig.networkId && this.networks.has(stationConfig.networkId)) {
            const network = this.networks.get(stationConfig.networkId);
            if (!network.stationIds.includes(station.stationId)) {
                network.stationIds.push(station.stationId);
            }
        }

        // Update statistics
        this.updateStatistics();

        logger.info(`🔌 Station created: ${station.stationId} (${config.ocppVersion})`);
        this.emit('stationCreated', { station: station.getStatus() });

        return station;
    }

    /**
     * Create multiple stations from profile
     */
    async createStationsFromProfile(profileId, count, options = {}) {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const stations = [];

        for (let i = 0; i < count; i++) {
            const stationConfig = {
                ...profile,
                stationId: `${profileId}_${i + 1}_${Date.now()}`,
                csmsUrl: options.csmsUrl || 'ws://localhost:9220',
                autoStart: options.autoStart || false,
                ...options.overrides
            };

            const station = await this.createStation(stationConfig);
            stations.push(station);
        }

        logger.info(`🏭 Created ${count} stations from profile: ${profileId}`);
        return stations;
    }

    /**
     * Setup event handlers for a station
     */
    setupStationEventHandlers(station) {
        // Forward station events
        station.on('started', (data) => {
            this.updateStatistics();
            this.emit('stationStarted', data);
        });

        station.on('stopped', (data) => {
            this.updateStatistics();
            this.emit('stationStopped', data);
        });

        station.on('chargingStarted', (data) => {
            this.statistics.totalSessions++;
            this.emit('chargingStarted', data);
            this.updateStatistics();
        });

        station.on('chargingStopped', (data) => {
            this.statistics.totalEnergyDelivered += data.transaction.energyDelivered || 0;
            this.emit('chargingStopped', data);
            this.updateStatistics();
        });

        station.on('meterValues', (data) => {
            this.emit('meterValues', data);
        });

        station.on('error', (data) => {
            this.emit('stationError', data);
        });

        station.on('healthUpdate', (data) => {
            this.emit('stationHealthUpdate', data);

            // Alert if health is critical
            if (data.health.status === 'critical') {
                logger.warn(`🚨 Critical health alert for station ${data.stationId}: Score ${data.health.score}`);
                this.emit('stationHealthAlert', data);
            }
        });

        station.on('csmsConnected', (data) => {
            this.emit('csmsConnected', data);
        });

        station.on('csmsDisconnected', (data) => {
            this.emit('csmsDisconnected', data);
        });

        station.on('csmsReconnecting', (data) => {
            logger.info(`🔄 Station ${data.stationId} attempting to reconnect to CSMS (attempt ${data.attempt}/${data.maxAttempts})`);
            this.emit('csmsReconnecting', data);
        });

        station.on('csmsReconnected', (data) => {
            logger.info(`✅ Station ${data.stationId} successfully reconnected to CSMS`);
            this.emit('csmsReconnected', data);
        });

        station.on('csmsConnectionFailed', (data) => {
            logger.error(`❌ Station ${data.stationId} failed to reconnect to CSMS after ${data.attempts} attempts`);
            this.emit('csmsConnectionFailed', data);

            // Emit critical alert
            this.emit('stationHealthAlert', {
                stationId: data.stationId,
                health: {
                    status: 'critical',
                    score: 0,
                    issues: [{
                        type: 'csms_connection_failed',
                        message: 'Failed to reconnect to CSMS',
                        severity: 'critical'
                    }]
                }
            });
        });
    }

    /**
     * Start all stations
     */
    async startAllStations() {
        if (this.isRunning) {
            throw new Error('Simulation is already running');
        }

        logger.info(`🚀 Starting simulation with ${this.stations.size} stations`);

        this.isRunning = true;
        this.startTime = new Date();

        const startPromises = [];
        for (const station of this.stations.values()) {
            startPromises.push(station.start().catch(error => {
                logger.error(`Failed to start station ${station.stationId}:`, error);
            }));
        }

        await Promise.all(startPromises);

        this.emit('simulationStarted', {
            stationCount: this.stations.size,
            startTime: this.startTime
        });

        logger.info(`✅ Simulation started with ${this.stations.size} stations`);
    }

    /**
     * Stop all stations
     */
    async stopAllStations() {
        if (!this.isRunning) {
            throw new Error('Simulation is not running');
        }

        logger.info(`🛑 Stopping simulation with ${this.stations.size} stations`);

        const stopPromises = [];
        for (const station of this.stations.values()) {
            stopPromises.push(station.stop().catch(error => {
                logger.error(`Failed to stop station ${station.stationId}:`, error);
            }));
        }

        await Promise.all(stopPromises);

        this.isRunning = false;
        const endTime = new Date();
        const duration = (endTime - this.startTime) / 1000; // seconds

        this.emit('simulationStopped', {
            stationCount: this.stations.size,
            duration,
            endTime
        });

        logger.info(`✅ Simulation stopped after ${duration}s`);
    }

    /**
     * Run a predefined scenario
     */
    async runScenario(scenarioId, options = {}) {
        const scenario = this.scenarios.get(scenarioId);
        if (!scenario) {
            throw new Error(`Scenario not found: ${scenarioId}`);
        }

        logger.info(`🎬 Running scenario: ${scenario.name}`);

        // Clear existing stations if requested
        if (options.clearExisting) {
            await this.removeAllStations();
        }

        // Create stations for scenario
        for (const stationGroup of scenario.stations) {
            await this.createStationsFromProfile(
                stationGroup.profileId,
                stationGroup.count, {
                    csmsUrl: stationGroup.csmsUrl,
                    autoStart: false,
                    overrides: stationGroup.overrides
                }
            );
        }

        // Start simulation
        await this.startAllStations();

        // Schedule scenario events
        this.scheduleScenarioEvents(scenario);

        // Auto-stop after scenario duration
        if (scenario.duration && !options.manualStop) {
            setTimeout(async() => {
                await this.stopAllStations();
                logger.info(`🎬 Scenario completed: ${scenario.name}`);
            }, scenario.duration * 1000);
        }

        this.emit('scenarioStarted', {
            scenarioId,
            scenario,
            stationCount: this.stations.size
        });
    }

    /**
     * Schedule scenario events
     */
    scheduleScenarioEvents(scenario) {
        if (!scenario.events) return;

        for (const event of scenario.events) {
            setTimeout(() => {
                this.executeScenarioEvent(event);
            }, event.time * 1000);
        }
    }

    /**
     * Execute scenario event
     */
    executeScenarioEvent(event) {
        logger.info(`⚡ Executing scenario event: ${event.action}`);

        switch (event.action) {
            case 'peak_hour_start':
                this.simulatePeakHour(true);
                break;
            case 'peak_hour_end':
                this.simulatePeakHour(false);
                break;
            case 'traffic_surge':
                this.simulateTrafficSurge();
                break;
            case 'protocol_switch':
                this.simulateProtocolSwitch();
                break;
            case 'error_simulation':
                this.simulateRandomErrors();
                break;
            case 'maintenance_mode':
                this.simulateMaintenanceMode();
                break;
            default:
                logger.warn(`Unknown scenario event: ${event.action}`);
        }

        this.emit('scenarioEvent', event);
    }

    /**
     * Simulate peak hour behavior
     */
    simulatePeakHour(isPeakHour) {
        const message = isPeakHour ? 'Peak hour started' : 'Peak hour ended';
        logger.info(`📈 ${message}`);

        // Adjust charging behavior for all stations
        for (const station of this.stations.values()) {
            if (isPeakHour) {
                // Increase charging frequency
                station.config.simulationSpeed = 2.0;
            } else {
                // Return to normal
                station.config.simulationSpeed = 1.0;
            }
        }
    }

    /**
     * Simulate traffic surge (more vehicles)
     */
    simulateTrafficSurge() {
        logger.info('🚗 Simulating traffic surge');

        // Randomly start charging sessions on available connectors
        for (const station of this.stations.values()) {
            if (Math.random() < 0.7) { // 70% chance
                const availableConnectors = station.connectors.filter(c => c.status === 'Available');
                if (availableConnectors.length > 0) {
                    const connector = availableConnectors[Math.floor(Math.random() * availableConnectors.length)];

                    // Simulate vehicle connection
                    setTimeout(async() => {
                        try {
                            await station.vehicleSimulator.connectVehicle(connector.connectorId, {
                                vehicleType: 'sedan',
                                userScenario: 'hasty'
                            });
                            await station.startChargingSession(connector.connectorId, `SURGE_${Date.now()}`);
                        } catch (error) {
                            logger.error('Error during traffic surge simulation:', error);
                        }
                    }, Math.random() * 10000); // Random delay up to 10 seconds
                }
            }
        }
    }

    /**
     * Simulate protocol switching
     */
    async simulateProtocolSwitch() {
        logger.info('🔄 Simulating protocol switch');

        // Switch some stations between protocols
        const stationsArray = Array.from(this.stations.values());
        const switchCount = Math.min(3, Math.floor(stationsArray.length * 0.2)); // 20% of stations

        for (let i = 0; i < switchCount; i++) {
            const station = stationsArray[Math.floor(Math.random() * stationsArray.length)];

            if (!station.isOnline) {
                const newProtocol = station.config.ocppVersion === '1.6J' ? '2.0.1' : '1.6J';

                try {
                    await station.switchProtocol(newProtocol);
                    logger.info(`🔄 Station ${station.stationId} switched to ${newProtocol}`);
                } catch (error) {
                    logger.error(`Failed to switch protocol for ${station.stationId}:`, error);
                }
            }
        }
    }

    /**
     * Simulate random errors
     */
    simulateRandomErrors() {
        logger.info('❌ Simulating random errors');

        for (const station of this.stations.values()) {
            if (Math.random() < 0.1) { // 10% chance of error
                const errorTypes = ['ConnectorLockFailure', 'GroundFailure', 'HighTemperature', 'PowerSwitchFailure'];
                const errorCode = errorTypes[Math.floor(Math.random() * errorTypes.length)];

                // Simulate connector error
                const connector = station.connectors[Math.floor(Math.random() * station.connectors.length)];
                connector.status = 'Faulted';
                connector.errorCode = errorCode;

                station.sendStatusNotification(connector.connectorId, 'Faulted', errorCode);

                // Auto-recover after 30-60 seconds
                setTimeout(() => {
                    connector.status = 'Available';
                    connector.errorCode = 'NoError';
                    station.sendStatusNotification(connector.connectorId, 'Available', 'NoError');
                }, (30 + Math.random() * 30) * 1000);
            }
        }
    }

    /**
     * Remove a station
     */
    async removeStation(stationId) {
        const station = this.stations.get(stationId);
        if (!station) {
            throw new Error(`Station not found: ${stationId}`);
        }

        // Stop station if running
        if (station.isOnline) {
            await station.stop();
        }

        // Remove from groups
        for (const group of this.groups.values()) {
            const index = group.stationIds.indexOf(stationId);
            if (index > -1) {
                group.stationIds.splice(index, 1);
            }
        }

        // Remove from networks
        for (const network of this.networks.values()) {
            const index = network.stationIds.indexOf(stationId);
            if (index > -1) {
                network.stationIds.splice(index, 1);
            }
        }

        // Remove from map
        this.stations.delete(stationId);

        this.updateStatistics();

        logger.info(`🗑️ Station removed: ${stationId}`);
        this.emit('stationRemoved', { stationId });
    }

    /**
     * Get stations by group
     */
    getStationsByGroup(groupId) {
        const group = this.groups.get(groupId);
        if (!group) {
            return [];
        }

        return group.stationIds.map(id => this.stations.get(id)).filter(Boolean);
    }

    /**
     * Get stations by network
     */
    getStationsByNetwork(networkId) {
        const network = this.networks.get(networkId);
        if (!network) {
            return [];
        }

        return network.stationIds.map(id => this.stations.get(id)).filter(Boolean);
    }

    /**
     * Get all groups
     */
    getGroups() {
        return Object.fromEntries(this.groups);
    }

    /**
     * Get all networks
     */
    getNetworks() {
        return Object.fromEntries(this.networks);
    }

    /**
     * Create a station group
     */
    createGroup(groupConfig) {
        const groupId = groupConfig.groupId || `group_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        this.groups.set(groupId, {
            ...groupConfig,
            groupId,
            stationIds: [],
            createdAt: new Date().toISOString()
        });

        logger.info(`📁 Group created: ${groupId}`);
        return groupId;
    }

    /**
     * Create a network configuration
     */
    createNetwork(networkConfig) {
        const networkId = networkConfig.networkId || `network_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        this.networks.set(networkId, {
            ...networkConfig,
            networkId,
            stationIds: [],
            createdAt: new Date().toISOString()
        });

        logger.info(`🌐 Network created: ${networkId}`);
        return networkId;
    }

    /**
     * Batch operations
     */
    async batchStartStations(stationIds) {
        const results = { success: [], failed: [] };

        for (const stationId of stationIds) {
            try {
                const station = this.stations.get(stationId);
                if (!station) {
                    results.failed.push({ stationId, error: 'Station not found' });
                    continue;
                }

                await station.start();
                results.success.push(stationId);
            } catch (error) {
                results.failed.push({ stationId, error: error.message });
            }
        }

        return results;
    }

    async batchStopStations(stationIds) {
        const results = { success: [], failed: [] };

        for (const stationId of stationIds) {
            try {
                const station = this.stations.get(stationId);
                if (!station) {
                    results.failed.push({ stationId, error: 'Station not found' });
                    continue;
                }

                await station.stop();
                results.success.push(stationId);
            } catch (error) {
                results.failed.push({ stationId, error: error.message });
            }
        }

        return results;
    }

    async batchUpdateStations(stationIds, updates) {
        const results = { success: [], failed: [] };

        for (const stationId of stationIds) {
            try {
                const station = this.stations.get(stationId);
                if (!station) {
                    results.failed.push({ stationId, error: 'Station not found' });
                    continue;
                }

                station.updateConfiguration(updates);
                results.success.push(stationId);
            } catch (error) {
                results.failed.push({ stationId, error: error.message });
            }
        }

        return results;
    }

    /**
     * Setup health monitoring
     */
    setupHealthMonitoring() {
        // Check health every 30 seconds
        this.healthCheckInterval = setInterval(() => {
            for (const station of this.stations.values()) {
                station.updateHealthScore();
            }
        }, 30000);
        this.healthCheckInterval.unref?.();
    }

    /**
     * Setup periodic backups
     */
    setupPeriodicBackups() {
        // Backup every hour
        this.backupInterval = setInterval(async() => {
            try {
                await this.backupService.backupState(this, {
                    type: 'scheduled',
                    reason: 'periodic_backup'
                });
            } catch (error) {
                logger.error('Periodic backup failed:', error);
            }
        }, 3600000); // 1 hour
        this.backupInterval.unref?.();
    }

    /**
     * Create backup
     */
    async createBackup(metadata = {}) {
        return await this.backupService.backupState(this, metadata);
    }

    /**
     * Restore from backup
     */
    async restoreFromBackup(backupFile) {
        return await this.backupService.restoreState(this, backupFile);
    }

    /**
     * List backups
     */
    async listBackups() {
        return await this.backupService.listBackups();
    }

    /**
     * Export configuration to file
     */
    async exportConfigurationToFile(filePath) {
        return await this.backupService.exportConfiguration(this, filePath);
    }

    /**
     * Import configuration from file
     */
    async importConfigurationFromFile(filePath) {
        return await this.backupService.importConfiguration(this, filePath);
    }

    /**
     * Get station health summary
     */
    getHealthSummary() {
        const summary = {
            total: this.stations.size,
            healthy: 0,
            warning: 0,
            critical: 0,
            stations: []
        };

        for (const station of this.stations.values()) {
            const health = station.getHealth();
            summary[health.status]++;

            summary.stations.push({
                stationId: station.stationId,
                health: health.score,
                status: health.status,
                issues: health.issues.length
            });
        }

        return summary;
    }

    /**
     * Get stations by health status
     */
    getStationsByHealthStatus(status) {
        return Array.from(this.stations.values())
            .filter(station => station.getHealth().status === status)
            .map(station => ({
                stationId: station.stationId,
                health: station.getHealth()
            }));
    }

    /**
     * Remove all stations
     */
    async removeAllStations() {
        logger.info(`🗑️ Removing all ${this.stations.size} stations`);

        const removePromises = [];
        for (const stationId of this.stations.keys()) {
            removePromises.push(this.removeStation(stationId));
        }

        await Promise.all(removePromises);

        logger.info('✅ All stations removed');
    }

    /**
     * Get station by ID
     */
    getStation(stationId) {
        return this.stations.get(stationId);
    }

    /**
     * Get all stations status
     */
    getAllStationsStatus() {
        const stations = {};

        for (const [stationId, station] of this.stations) {
            stations[stationId] = station.getStatus();
        }

        return stations;
    }

    /**
     * Update simulation statistics
     */
    updateStatistics() {
        this.statistics.totalStations = this.stations.size;
        this.statistics.activeStations = Array.from(this.stations.values())
            .filter(s => s.isOnline).length;

        // Update Prometheus metrics
        this.updatePrometheusMetrics();

        // Protocol distribution
        this.statistics.protocolDistribution = {
            'OCPP 1.6J': 0,
            'OCPP 2.0.1': 0
        };

        // Group statistics
        this.statistics.byGroup = {};
        this.statistics.byNetwork = {};
        this.statistics.byLocation = {};

        for (const station of this.stations.values()) {
            const protocol = station.config.ocppVersion === '1.6J' ? 'OCPP 1.6J' : 'OCPP 2.0.1';
            this.statistics.protocolDistribution[protocol]++;

            // Group statistics
            if (station.config.groupId) {
                if (!this.statistics.byGroup[station.config.groupId]) {
                    this.statistics.byGroup[station.config.groupId] = { total: 0, active: 0 };
                }
                this.statistics.byGroup[station.config.groupId].total++;
                if (station.isOnline) {
                    this.statistics.byGroup[station.config.groupId].active++;
                }
            }

            // Network statistics
            if (station.config.networkId) {
                if (!this.statistics.byNetwork[station.config.networkId]) {
                    this.statistics.byNetwork[station.config.networkId] = { total: 0, active: 0 };
                }
                this.statistics.byNetwork[station.config.networkId].total++;
                if (station.isOnline) {
                    this.statistics.byNetwork[station.config.networkId].active++;
                }
            }

            // Location statistics
            const location = station.config.location || 'unknown';
            if (!this.statistics.byLocation[location]) {
                this.statistics.byLocation[location] = { total: 0, active: 0 };
            }
            this.statistics.byLocation[location].total++;
            if (station.isOnline) {
                this.statistics.byLocation[location].active++;
            }
        }

        // Cache statistics
        CacheManager.set(CacheKeys.ANALYTICS_HOURLY(new Date().getHours()), this.statistics, 3600);
    }

    /**
     * Update Prometheus metrics based on current station states
     */
    updatePrometheusMetrics() {
        const stations = Array.from(this.stations.values());

        // Count stations by status
        const statusCounts = {
            online: 0,
            offline: 0,
            charging: 0,
            available: 0,
            error: 0
        };

        for (const station of stations) {
            if (station.isOnline) {
                statusCounts.online++;
                if (station.status === 'Charging') {
                    statusCounts.charging++;
                } else if (station.status === 'Available') {
                    statusCounts.available++;
                }
            } else {
                statusCounts.offline++;
            }

            // Check for errors
            if (station.status === 'Error' || station.status === 'Faulted') {
                statusCounts.error++;
            }
        }

        // Update Prometheus gauges
        metricsCollector.recordOCPPStation('online', statusCounts.online);
        metricsCollector.recordOCPPStation('offline', statusCounts.offline);
        metricsCollector.recordOCPPStation('charging', statusCounts.charging);
        metricsCollector.recordOCPPStation('available', statusCounts.available);
        metricsCollector.recordOCPPStation('error', statusCounts.error);
    }

    /**
     * Get simulation statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            isRunning: this.isRunning,
            startTime: this.startTime,
            uptime: this.startTime ? (new Date() - this.startTime) / 1000 : 0
        };
    }

    /**
     * Get available profiles
     */
    getProfiles() {
        return Object.fromEntries(this.profiles);
    }

    /**
     * Get available scenarios
     */
    getScenarios() {
        return Object.fromEntries(this.scenarios);
    }

    /**
     * Graceful shutdown - stop all stations and cleanup
     */
    async shutdown() {
        logger.info('🛑 Shutting down Simulation Manager...');

        try {
            // Stop all running stations
            if (this.isRunning) {
                logger.info(`⏹️  Stopping ${this.stations.size} active stations...`);
                await this.stopAllStations();
            }

            // Disconnect all OCPP clients
            logger.info('🔌 Disconnecting OCPP clients...');
            const disconnectPromises = [];

            for (const station of this.stations.values()) {
                if (station.isOnline && station.ocppClient) {
                    disconnectPromises.push(
                        station.ocppClient.disconnect().catch(error => {
                            logger.error(`Failed to disconnect OCPP client for ${station.stationId}:`, error);
                        })
                    );
                }
            }

            await Promise.all(disconnectPromises);

            // Stop health monitoring
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = null;
            }

            // Stop periodic backups
            if (this.backupInterval) {
                clearInterval(this.backupInterval);
                this.backupInterval = null;
            }

            // Create final backup
            if (this.backupService?.backupState) {
                try {
                    await this.backupService.backupState(this, { trigger: 'shutdown' });
                    logger.info('✅ Final backup created');
                } catch (error) {
                    logger.error('Failed to create final backup:', error);
                }
            }

            logger.info('✅ Simulation Manager shutdown completed');

            return {
                success: true,
                stationsStopped: this.stations.size,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('❌ Error during Simulation Manager shutdown:', error);
            throw error;
        }
    }

    /**
     * Export simulation configuration
     */
    exportConfiguration() {
        const config = {
            stations: [],
            timestamp: new Date().toISOString(),
            statistics: this.statistics
        };

        for (const station of this.stations.values()) {
            config.stations.push({
                stationId: station.stationId,
                config: station.config,
                status: station.getStatus()
            });
        }

        return config;
    }

    /**
     * Import simulation configuration
     */
    async importConfiguration(config) {
        // Clear existing stations
        await this.removeAllStations();

        // Create stations from config
        for (const stationConfig of config.stations) {
            await this.createStation(stationConfig.config);
        }

        logger.info(`📥 Imported configuration with ${config.stations.length} stations`);
    }
}