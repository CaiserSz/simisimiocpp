import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import metricsCollector from '../middleware/metrics.js';
import { OCPP16JSimulator } from './protocols/OCPP16JSimulator.js';
import { OCPP201Simulator } from './protocols/OCPP201Simulator.js';
import { VehicleSimulator } from './VehicleSimulator.js';
import NetworkSimulator from './NetworkSimulator.js';

/**
 * EV Charging Station Simulator
 * Simulates real charging station behavior and communicates with CSMS
 */
export class StationSimulator extends EventEmitter {
    constructor(config = {}) {
        super();

        this.stationId = config.stationId || `SIM_${uuidv4().substring(0, 8)}`;
        this.config = {
            // Station Information
            vendor: config.vendor || 'Simulator Corp',
            model: config.model || 'SimCharger Pro',
            serialNumber: config.serialNumber || `SN${Date.now()}`,
            firmwareVersion: config.firmwareVersion || '1.0.0',

            // OCPP Configuration
            ocppVersion: config.ocppVersion || '1.6J', // '1.6J' or '2.0.1'
            csmsUrl: config.csmsUrl || 'ws://localhost:9220',

            // Hardware Configuration
            connectorCount: config.connectorCount || 2,
            maxPower: config.maxPower || 22000, // Watts
            supportedStandards: config.supportedStandards || ['IEC62196Type2'],

            // Simulation Settings
            autoStart: config.autoStart || false,
            simulationSpeed: config.simulationSpeed || 1, // 1x = real-time
            heartbeatInterval: config.heartbeatInterval || 300, // seconds

            ...config
        };

        // Station State
        this.status = 'Initializing'; // Initializing, Available, Unavailable, Faulted
        this.isOnline = false;
        this.connectors = this.initializeConnectors();
        this.currentSession = null;

        // Simulation Components
        this.ocppClient = null;
        this.vehicleSimulator = new VehicleSimulator(this);
        this.networkSimulator = null; // Will be initialized from network config

        // Health monitoring
        this.health = {
            score: 100, // 0-100
            status: 'healthy', // healthy, warning, critical
            lastCheck: new Date(),
            issues: []
        };

        // Historical data
        this.history = {
            sessions: [],
            errors: [],
            metrics: []
        };

        // Metrics tracking
        this.metrics = {
            totalSessions: 0,
            totalEnergyDelivered: 0,
            totalDuration: 0,
            errorCount: 0,
            lastHeartbeat: null
        };

        // Auto-start if enabled
        if (this.config.autoStart) {
            this.start();
        }

        logger.info(`🔌 Station Simulator created: ${this.stationId} (${this.config.ocppVersion})`);
    }

    /**
     * Initialize station connectors
     */
    initializeConnectors() {
        const connectors = [];

        for (let i = 1; i <= this.config.connectorCount; i++) {
            connectors.push({
                connectorId: i,
                status: 'Available', // Available, Occupied, Reserved, Unavailable, Faulted
                errorCode: 'NoError',
                currentPower: 0, // Current power delivery in Watts
                energyDelivered: 0, // kWh delivered in current session
                temperature: 20, // Celsius
                voltage: 0,
                current: 0,
                transaction: null,
                vehicle: null,
                lastStatusChange: new Date()
            });
        }

        return connectors;
    }

    /**
     * Start station simulation
     */
    async start() {
        try {
            logger.info(`🚀 Starting station simulator: ${this.stationId}`);

            this.status = 'Initializing';
            this.emit('statusChanged', { stationId: this.stationId, status: this.status });

            // Initialize OCPP client based on version
            await this.initializeOCPPClient();

            // Connect to CSMS
            await this.connectToCSMS();

            // Start periodic updates
            this.startPeriodicUpdates();

            this.status = 'Available';
            this.isOnline = true;

            logger.info(`✅ Station simulator started: ${this.stationId}`);
            this.emit('started', { stationId: this.stationId });

        } catch (error) {
            logger.error(`❌ Failed to start station simulator ${this.stationId}:`, error);
            this.status = 'Faulted';

            // Record error
            this.recordError({
                type: 'startup_error',
                message: error.message,
                severity: 'critical'
            });

            this.emit('error', { stationId: this.stationId, error });
            throw error;
        }
    }

    /**
     * Stop station simulation
     */
    async stop() {
        try {
            logger.info(`🛑 Stopping station simulator: ${this.stationId}`);

            // Stop any active charging sessions
            await this.stopAllChargingSessions();

            // Stop periodic updates
            this.stopPeriodicUpdates();

            // Disconnect from CSMS
            if (this.ocppClient) {
                await this.ocppClient.disconnect();
            }

            this.status = 'Unavailable';
            this.isOnline = false;

            logger.info(`✅ Station simulator stopped: ${this.stationId}`);
            this.emit('stopped', { stationId: this.stationId });

        } catch (error) {
            logger.error(`❌ Failed to stop station simulator ${this.stationId}:`, error);
            throw error;
        }
    }

    /**
     * Initialize OCPP client based on configured version
     */
    async initializeOCPPClient() {
        // Initialize network simulator if network config exists
        if (this.config.networkId) {
            // Network config will be provided by SimulationManager
            const networkConfig = this.config.networkConfig || {};
            this.networkSimulator = new NetworkSimulator(networkConfig);

            // Setup network event handlers
            this.networkSimulator.on('disconnected', () => {
                logger.warn(`🌐 Network disconnection simulated for ${this.stationId}`);
                this.health.issues.push({
                    type: 'network_disconnection',
                    timestamp: new Date(),
                    severity: 'warning'
                });
                this.updateHealthScore();
            });

            this.networkSimulator.on('reconnected', (data) => {
                logger.info(`🌐 Network reconnected for ${this.stationId} after ${data.downtime}s`);
                this.health.issues.push({
                    type: 'network_reconnected',
                    timestamp: new Date(),
                    downtime: data.downtime,
                    severity: 'info'
                });
                this.updateHealthScore();
            });
        }

        const clientConfig = {
            stationId: this.stationId,
            csmsUrl: this.config.csmsUrl,
            vendor: this.config.vendor,
            model: this.config.model,
            serialNumber: this.config.serialNumber,
            firmwareVersion: this.config.firmwareVersion,
            heartbeatInterval: this.config.heartbeatInterval,
            networkSimulator: this.networkSimulator // Pass to OCPP client
        };

        if (this.config.ocppVersion === '1.6J') {
            this.ocppClient = new OCPP16JSimulator(clientConfig);
        } else if (this.config.ocppVersion === '2.0.1') {
            this.ocppClient = new OCPP201Simulator(clientConfig);
        } else {
            throw new Error(`Unsupported OCPP version: ${this.config.ocppVersion}`);
        }

        // Setup OCPP event handlers
        this.setupOCPPEventHandlers();
    }

    /**
     * Setup OCPP client event handlers
     */
    setupOCPPEventHandlers() {
        this.ocppClient.on('connected', () => {
            logger.info(`🔗 OCPP client connected: ${this.stationId}`);
            this.isOnline = true;
            this.status = 'Available';
            this.emit('csmsConnected', { stationId: this.stationId });
            this.updateHealthScore();
        });

        this.ocppClient.on('disconnected', (data) => {
            logger.warn(`🔌 OCPP client disconnected: ${this.stationId}`);
            this.isOnline = false;
            this.status = 'Unavailable';

            // Record disconnection in history
            this.recordError({
                type: 'csms_disconnected',
                message: `Disconnected from CSMS: ${data.reason || 'Unknown'}`,
                severity: 'warning',
                code: data.code,
                reconnectAttempts: data.reconnectAttempts,
                maxReconnectAttempts: data.maxReconnectAttempts
            });

            this.updateHealthScore();
            this.emit('csmsDisconnected', { stationId: this.stationId, ...data });
        });

        this.ocppClient.on('reconnectionAttempt', (data) => {
            logger.info(`🔄 Reconnection attempt ${data.attempt}/${data.maxAttempts} for ${this.stationId}`);

            // Record reconnection attempt in history
            this.recordError({
                type: 'reconnection_attempt',
                message: `Attempting to reconnect to CSMS (${data.attempt}/${data.maxAttempts})`,
                severity: 'info',
                attempt: data.attempt,
                delay: data.delay
            });

            this.emit('csmsReconnecting', { stationId: this.stationId, ...data });
        });

        this.ocppClient.on('reconnectionSuccess', (data) => {
            logger.info(`✅ Reconnection successful for ${this.stationId}`);
            this.isOnline = true;
            this.status = 'Available';

            // Record successful reconnection
            this.recordError({
                type: 'reconnection_success',
                message: 'Successfully reconnected to CSMS',
                severity: 'info'
            });

            this.updateHealthScore();
            this.emit('csmsReconnected', { stationId: this.stationId, ...data });
        });

        this.ocppClient.on('reconnectionFailed', (data) => {
            logger.error(`❌ Reconnection failed for ${this.stationId} after ${data.attempts} attempts`);
            this.isOnline = false;
            this.status = 'Faulted';

            // Record reconnection failure
            this.recordError({
                type: 'reconnection_failed',
                message: `Failed to reconnect to CSMS after ${data.attempts} attempts`,
                severity: 'critical',
                attempts: data.attempts,
                lastError: data.lastError
            });

            // Add critical health issue
            this.health.issues.push({
                type: 'csms_connection_failed',
                message: 'Failed to reconnect to CSMS',
                timestamp: new Date(),
                severity: 'critical',
                attempts: data.attempts
            });

            this.updateHealthScore();
            this.emit('csmsConnectionFailed', { stationId: this.stationId, ...data });
        });

        this.ocppClient.on('commandReceived', (command) => {
            this.handleCSMSCommand(command);
        });

        this.ocppClient.on('error', (error) => {
            logger.error(`❌ OCPP client error for ${this.stationId}:`, error);
            this.metrics.errorCount++;

            // Record error in history
            this.recordError({
                type: 'ocpp_error',
                message: error.message,
                severity: 'error',
                stack: error.stack
            });

            this.updateHealthScore();
            this.emit('ocppError', { stationId: this.stationId, error });
        });
    }

    /**
     * Connect to CSMS
     */
    async connectToCSMS() {
        if (!this.ocppClient) {
            throw new Error('OCPP client not initialized');
        }

        await this.ocppClient.connect();
    }

    /**
     * Handle commands from CSMS
     */
    async handleCSMSCommand(command) {
        const { action, payload, messageId } = command;

        logger.info(`📨 Received CSMS command: ${action} for station ${this.stationId}`);

        try {
            let response;

            switch (action) {
                case 'RemoteStartTransaction':
                    response = await this.handleRemoteStartTransaction(payload);
                    break;

                case 'RemoteStopTransaction':
                    response = await this.handleRemoteStopTransaction(payload);
                    break;

                case 'UnlockConnector':
                    response = await this.handleUnlockConnector(payload);
                    break;

                case 'Reset':
                    response = await this.handleReset(payload);
                    break;

                case 'GetConfiguration':
                    response = await this.handleGetConfiguration(payload);
                    break;

                case 'ChangeConfiguration':
                    response = await this.handleChangeConfiguration(payload);
                    break;

                default:
                    logger.warn(`⚠️ Unhandled CSMS command: ${action}`);
                    response = { status: 'NotSupported' };
            }

            // Send response back to CSMS
            await this.ocppClient.sendResponse(messageId, response);

        } catch (error) {
            logger.error(`❌ Error handling CSMS command ${action}:`, error);
            await this.ocppClient.sendError(messageId, 'InternalError', error.message);
        }
    }

    /**
     * Handle RemoteStartTransaction command from CSMS
     */
    async handleRemoteStartTransaction(payload) {
        const { connectorId, idTag, chargingProfile } = payload;

        logger.info(`🚗 Remote start transaction requested: connector ${connectorId}, idTag: ${idTag}`);

        // Validate connector
        const connector = this.getConnector(connectorId);
        if (!connector) {
            return { status: 'Rejected' };
        }

        if (connector.status !== 'Available') {
            return { status: 'Rejected' };
        }

        try {
            // Simulate vehicle connection
            await this.vehicleSimulator.connectVehicle(connectorId, { idTag, chargingProfile });

            // Start charging session
            await this.startChargingSession(connectorId, idTag, chargingProfile);

            return { status: 'Accepted' };

        } catch (error) {
            logger.error('Failed to start remote transaction:', error);
            return { status: 'Rejected' };
        }
    }

    /**
     * Handle RemoteStopTransaction command from CSMS
     */
    async handleRemoteStopTransaction(payload) {
        const { transactionId } = payload;

        logger.info(`🛑 Remote stop transaction requested: ${transactionId}`);

        try {
            // Find connector with this transaction
            const connector = this.connectors.find(c =>
                c.transaction && c.transaction.transactionId === transactionId
            );

            if (!connector) {
                return { status: 'Rejected' };
            }

            // Stop charging session
            await this.stopChargingSession(connector.connectorId);

            return { status: 'Accepted' };

        } catch (error) {
            logger.error('Failed to stop remote transaction:', error);
            return { status: 'Rejected' };
        }
    }

    /**
     * Start charging session on connector
     */
    async startChargingSession(connectorId, idTag, chargingProfile = null) {
        const connector = this.getConnector(connectorId);
        if (!connector || connector.status !== 'Available') {
            throw new Error(`Connector ${connectorId} not available for charging`);
        }

        // Create transaction
        const transaction = {
            transactionId: this.generateTransactionId(),
            idTag,
            connectorId,
            startTime: new Date(),
            startMeterValue: connector.energyDelivered,
            chargingProfile,
            status: 'Active'
        };

        // Update connector state
        connector.status = 'Occupied';
        connector.transaction = transaction;
        connector.lastStatusChange = new Date();

        // Send StatusNotification to CSMS
        await this.sendStatusNotification(connectorId, 'Occupied', 'NoError');

        // Send StartTransaction to CSMS
        const startTransactionResponse = await this.ocppClient.sendStartTransaction({
            connectorId,
            idTag,
            meterStart: Math.round(connector.energyDelivered * 1000), // Wh
            timestamp: transaction.startTime.toISOString()
        });

        // Update transaction with CSMS response
        transaction.csmsTransactionId = startTransactionResponse.transactionId;

        // Start power delivery simulation
        this.startPowerDelivery(connectorId);

        this.metrics.totalSessions++;

        // Record session in history
        this.recordSession({
            transactionId: transaction.transactionId,
            csmsTransactionId: transaction.csmsTransactionId,
            connectorId,
            idTag,
            startTime: transaction.startTime,
            chargingProfile
        });

        logger.info(`⚡ Charging session started: ${transaction.transactionId} on connector ${connectorId}`);
        
        // Record charging session metric
        metricsCollector.recordChargingSession('start');
        
        this.emit('chargingStarted', {
            stationId: this.stationId,
            connectorId,
            transaction
        });
    }

    /**
     * Stop charging session on connector
     */
    async stopChargingSession(connectorId) {
        const connector = this.getConnector(connectorId);
        if (!connector || !connector.transaction) {
            throw new Error(`No active transaction on connector ${connectorId}`);
        }

        const transaction = connector.transaction;

        // Stop power delivery
        this.stopPowerDelivery(connectorId);

        // Calculate final values
        const endTime = new Date();
        const duration = (endTime - transaction.startTime) / 1000; // seconds
        const energyDelivered = connector.energyDelivered - transaction.startMeterValue;

        // Send StopTransaction to CSMS
        await this.ocppClient.sendStopTransaction({
            transactionId: transaction.csmsTransactionId,
            meterStop: Math.round(connector.energyDelivered * 1000), // Wh
            timestamp: endTime.toISOString(),
            reason: 'Remote'
        });

        // Update connector state
        connector.status = 'Available';
        connector.transaction = null;
        connector.currentPower = 0;
        connector.voltage = 0;
        connector.current = 0;
        connector.lastStatusChange = new Date();

        // Disconnect vehicle
        await this.vehicleSimulator.disconnectVehicle(connectorId);

        // Send StatusNotification to CSMS
        await this.sendStatusNotification(connectorId, 'Available', 'NoError');

        // Update metrics
        this.metrics.totalEnergyDelivered += energyDelivered;
        this.metrics.totalDuration += duration;
        
        // Record charging session metric
        metricsCollector.recordChargingSession('stop', duration, energyDelivered / 1000); // Convert Wh to kWh

        // Update session in history
        const sessionIndex = this.history.sessions.findIndex(
            s => s.transactionId === transaction.transactionId
        );
        if (sessionIndex >= 0) {
            this.history.sessions[sessionIndex] = {
                ...this.history.sessions[sessionIndex],
                endTime,
                duration,
                energyDelivered,
                stopReason: 'Remote'
            };
        }

        // Update health score
        this.updateHealthScore();

        logger.info(`🔌 Charging session stopped: ${transaction.transactionId}, Energy: ${energyDelivered.toFixed(2)} kWh`);
        this.emit('chargingStopped', {
            stationId: this.stationId,
            connectorId,
            transaction: {
                ...transaction,
                endTime,
                duration,
                energyDelivered
            }
        });
    }

    /**
     * Start power delivery simulation
     */
    startPowerDelivery(connectorId) {
        const connector = this.getConnector(connectorId);
        if (!connector) return;

        // Simulate gradual power ramp-up
        let currentPower = 0;
        const targetPower = Math.min(this.config.maxPower, 7400); // 7.4kW typical AC charging
        const rampStep = 200; // 200W per step

        const rampUpInterval = setInterval(() => {
            if (currentPower < targetPower) {
                currentPower = Math.min(currentPower + rampStep, targetPower);

                // Update connector values
                connector.currentPower = currentPower;
                connector.voltage = 230; // AC voltage
                connector.current = currentPower / connector.voltage;

                // Add some realistic variation
                connector.temperature = 20 + (currentPower / 1000) * 2; // Temperature rises with power

            } else {
                clearInterval(rampUpInterval);
                this.startEnergyAccumulation(connectorId);
            }
        }, 1000); // 1 second steps

        connector.rampUpInterval = rampUpInterval;
    }

    /**
     * Start energy accumulation
     */
    startEnergyAccumulation(connectorId) {
        const connector = this.getConnector(connectorId);
        if (!connector || !connector.transaction) return;

        const accumulationInterval = setInterval(() => {
            if (connector.transaction && connector.status === 'Occupied') {
                // Calculate energy delivered (kWh)
                const powerKW = connector.currentPower / 1000;
                const timeHours = 1 / 3600; // 1 second in hours
                const energyIncrement = powerKW * timeHours * this.config.simulationSpeed;

                connector.energyDelivered += energyIncrement;

                // Add some realistic power variation (±5%)
                const variation = (Math.random() - 0.5) * 0.1;
                connector.currentPower *= (1 + variation);
                connector.current = connector.currentPower / connector.voltage;

                // Emit real-time data
                this.emit('meterValues', {
                    stationId: this.stationId,
                    connectorId,
                    timestamp: new Date(),
                    values: {
                        power: connector.currentPower,
                        energy: connector.energyDelivered,
                        voltage: connector.voltage,
                        current: connector.current,
                        temperature: connector.temperature
                    }
                });

            } else {
                clearInterval(accumulationInterval);
            }
        }, 1000); // Every second

        connector.accumulationInterval = accumulationInterval;
    }

    /**
     * Stop power delivery
     */
    stopPowerDelivery(connectorId) {
        const connector = this.getConnector(connectorId);
        if (!connector) return;

        // Clear intervals
        if (connector.rampUpInterval) {
            clearInterval(connector.rampUpInterval);
            connector.rampUpInterval = null;
        }

        if (connector.accumulationInterval) {
            clearInterval(connector.accumulationInterval);
            connector.accumulationInterval = null;
        }

        // Reset power values
        connector.currentPower = 0;
        connector.voltage = 0;
        connector.current = 0;
    }

    /**
     * Send status notification to CSMS
     */
    async sendStatusNotification(connectorId, status, errorCode = 'NoError') {
        await this.ocppClient.sendStatusNotification({
            connectorId,
            status,
            errorCode,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Start periodic updates (heartbeat, meter values)
     */
    startPeriodicUpdates() {
        // Heartbeat
        this.heartbeatInterval = setInterval(async() => {
            try {
                await this.ocppClient.sendHeartbeat();
                this.metrics.lastHeartbeat = new Date();
            } catch (error) {
                logger.error(`❌ Heartbeat failed for ${this.stationId}:`, error);
            }
        }, this.config.heartbeatInterval * 1000);

        // Meter values (every 60 seconds)
        this.meterValuesInterval = setInterval(async() => {
            for (const connector of this.connectors) {
                if (connector.transaction) {
                    try {
                        await this.sendMeterValues(connector.connectorId);
                    } catch (error) {
                        logger.error(`❌ Failed to send meter values for connector ${connector.connectorId}:`, error);
                    }
                }
            }
        }, 60000);
    }

    /**
     * Stop periodic updates
     */
    stopPeriodicUpdates() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.meterValuesInterval) {
            clearInterval(this.meterValuesInterval);
            this.meterValuesInterval = null;
        }
    }

    /**
     * Send meter values to CSMS
     */
    async sendMeterValues(connectorId) {
        const connector = this.getConnector(connectorId);
        if (!connector || !connector.transaction) return;

        const meterValues = {
            connectorId,
            transactionId: connector.transaction.csmsTransactionId,
            meterValue: [{
                timestamp: new Date().toISOString(),
                sampledValue: [{
                        value: Math.round(connector.energyDelivered * 1000).toString(), // Wh
                        context: 'Sample.Periodic',
                        measurand: 'Energy.Active.Import.Register',
                        unit: 'Wh'
                    },
                    {
                        value: Math.round(connector.currentPower).toString(),
                        context: 'Sample.Periodic',
                        measurand: 'Power.Active.Import',
                        unit: 'W'
                    },
                    {
                        value: connector.voltage.toFixed(1),
                        context: 'Sample.Periodic',
                        measurand: 'Voltage',
                        unit: 'V'
                    },
                    {
                        value: connector.current.toFixed(2),
                        context: 'Sample.Periodic',
                        measurand: 'Current.Import',
                        unit: 'A'
                    }
                ]
            }]
        };

        await this.ocppClient.sendMeterValues(meterValues);
    }

    // Utility methods
    getConnector(connectorId) {
        return this.connectors.find(c => c.connectorId === connectorId);
    }

    generateTransactionId() {
        return Math.floor(Math.random() * 1000000);
    }

    async stopAllChargingSessions() {
        const activeConnectors = this.connectors.filter(c => c.transaction);
        for (const connector of activeConnectors) {
            await this.stopChargingSession(connector.connectorId);
        }
    }

    // Getters
    getStatus() {
        return {
            stationId: this.stationId,
            status: this.status,
            isOnline: this.isOnline,
            config: this.config,
            connectors: this.connectors.map(c => ({
                connectorId: c.connectorId,
                status: c.status,
                currentPower: c.currentPower,
                energyDelivered: c.energyDelivered,
                hasActiveTransaction: !!c.transaction
            })),
            metrics: this.metrics,
            health: this.health
        };
    }

    /**
     * Update health score based on various factors
     */
    updateHealthScore() {
        let score = 100;
        const issues = [];

        // Connection health
        if (!this.isOnline) {
            score -= 30;
            issues.push({ type: 'offline', severity: 'critical' });
        }

        // OCPP connection health
        if (this.ocppClient && !this.ocppClient.isConnected) {
            score -= 20;
            issues.push({ type: 'ocpp_disconnected', severity: 'critical' });
        }

        // Error rate
        if (this.metrics.errorCount > 10) {
            score -= 10;
            issues.push({ type: 'high_error_rate', severity: 'warning' });
        }

        // Network health
        if (this.networkSimulator && !this.networkSimulator.isConnected) {
            score -= 15;
            issues.push({ type: 'network_issue', severity: 'warning' });
        }

        // Connector health
        const faultedConnectors = this.connectors.filter(c => c.status === 'Faulted').length;
        if (faultedConnectors > 0) {
            score -= faultedConnectors * 10;
            issues.push({
                type: 'connector_faulted',
                severity: faultedConnectors === this.connectors.length ? 'critical' : 'warning',
                count: faultedConnectors
            });
        }

        // Recent issues
        const recentIssues = this.health.issues.filter(
            issue => new Date() - new Date(issue.timestamp) < 3600000 // Last hour
        );
        if (recentIssues.length > 5) {
            score -= 10;
            issues.push({ type: 'recent_issues', severity: 'warning', count: recentIssues.length });
        }

        // Update health
        this.health.score = Math.max(0, score);
        this.health.status = score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical';
        this.health.lastCheck = new Date();
        this.health.issues = issues;

        // Store in history
        this.history.metrics.push({
            timestamp: new Date(),
            healthScore: this.health.score,
            status: this.health.status,
            online: this.isOnline,
            connectorsHealthy: this.connectors.length - faultedConnectors,
            errorCount: this.metrics.errorCount
        });

        // Keep only last 1000 metrics
        if (this.history.metrics.length > 1000) {
            this.history.metrics = this.history.metrics.slice(-1000);
        }

        // Emit health update
        this.emit('healthUpdate', {
            stationId: this.stationId,
            health: this.health
        });

        return this.health;
    }

    /**
     * Get health status
     */
    getHealth() {
        return {
            ...this.health,
            networkStats: this.networkSimulator ? this.networkSimulator.getStats() : null,
            metrics: this.metrics
        };
    }

    /**
     * Get historical data
     */
    getHistory(options = {}) {
        const { type = 'all', limit = 100, startDate, endDate } = options;

        let data = {};

        if (type === 'all' || type === 'sessions') {
            data.sessions = this.history.sessions
                .filter(s => {
                    if (startDate && new Date(s.startTime) < new Date(startDate)) return false;
                    if (endDate && new Date(s.startTime) > new Date(endDate)) return false;
                    return true;
                })
                .slice(-limit);
        }

        if (type === 'all' || type === 'errors') {
            data.errors = this.history.errors
                .filter(e => {
                    if (startDate && new Date(e.timestamp) < new Date(startDate)) return false;
                    if (endDate && new Date(e.timestamp) > new Date(endDate)) return false;
                    return true;
                })
                .slice(-limit);
        }

        if (type === 'all' || type === 'metrics') {
            data.metrics = this.history.metrics
                .filter(m => {
                    if (startDate && new Date(m.timestamp) < new Date(startDate)) return false;
                    if (endDate && new Date(m.timestamp) > new Date(endDate)) return false;
                    return true;
                })
                .slice(-limit);
        }

        return data;
    }

    /**
     * Record session in history
     */
    recordSession(session) {
        this.history.sessions.push({
            ...session,
            timestamp: new Date()
        });

        // Keep only last 500 sessions
        if (this.history.sessions.length > 500) {
            this.history.sessions = this.history.sessions.slice(-500);
        }
    }

    /**
     * Record error in history
     */
    recordError(error) {
        this.history.errors.push({
            ...error,
            timestamp: new Date()
        });

        this.health.issues.push({
            type: 'error',
            message: error.message,
            timestamp: new Date(),
            severity: error.severity || 'warning'
        });

        this.updateHealthScore();

        // Keep only last 1000 errors
        if (this.history.errors.length > 1000) {
            this.history.errors = this.history.errors.slice(-1000);
        }
    }

    // Configuration methods
    async switchProtocol(newVersion) {
        if (this.isOnline) {
            throw new Error('Cannot switch protocol while station is online');
        }

        this.config.ocppVersion = newVersion;
        await this.initializeOCPPClient();

        logger.info(`🔄 Protocol switched to ${newVersion} for station ${this.stationId}`);
    }

    updateConfiguration(newConfig) {
        this.config = {...this.config, ...newConfig };
        logger.info(`⚙️ Configuration updated for station ${this.stationId}`);
        this.emit('configurationUpdated', { stationId: this.stationId, config: this.config });
    }
}
